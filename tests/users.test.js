const db = require('./db');
const { request, app, registerUser, makeAdmin, auth } = require('./helpers');

beforeAll(() => db.connect());
afterEach(() => db.clear());
afterAll(() => db.close());

describe('User registration', () => {
  test('registers a valid user and returns token + sanitized data', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ username: 'alice', email: 'alice@x.dev', password: 'secret123', name: 'Alice' });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeTruthy();
    expect(res.body.data).toMatchObject({
      username: 'alice',
      email: 'alice@x.dev',
      role: 'user',
    });
    expect(res.body.data.password).toBeUndefined(); // never leaked
  });

  test('rejects invalid input with 400 + per-field errors', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ username: 'a!', email: 'not-an-email', password: '123', name: '' });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'email' }),
        expect.objectContaining({ field: 'password' }),
      ])
    );
  });

  test('rejects duplicate email or username with 409', async () => {
    await registerUser({ username: 'alice', email: 'alice@x.dev' });
    const res = await request(app)
      .post('/api/users')
      .send({ username: 'alice', email: 'alice@x.dev', password: 'secret123', name: 'Dup' });

    expect(res.statusCode).toBe(409);
  });
});

describe('User login', () => {
  test('logs in with valid credentials', async () => {
    await registerUser({ username: 'alice', email: 'alice@x.dev' });
    const res = await request(app)
      .post('/api/users/login')
      .send({ email: 'alice@x.dev', password: 'secret123' });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.data.username).toBe('alice');
  });

  test('rejects wrong password with 401', async () => {
    await registerUser({ username: 'alice', email: 'alice@x.dev' });
    const res = await request(app)
      .post('/api/users/login')
      .send({ email: 'alice@x.dev', password: 'wrongpass' });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });

  test('rejects malformed email with 400 (validation)', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ email: 'not-an-email', password: 'whatever1' });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors[0].field).toBe('email');
  });
});

describe('Protected user routes — 401/403 handling', () => {
  test('GET /api/users without token → 401 with WWW-Authenticate', async () => {
    const res = await request(app).get('/api/users');
    expect(res.statusCode).toBe(401);
    expect(res.headers['www-authenticate']).toMatch(/Bearer/);
  });

  test('GET /api/users with garbage token → 401 invalid_token', async () => {
    const res = await request(app).get('/api/users').set(auth('garbage.token.here'));
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/invalid token/i);
  });

  test('GET /api/users as regular user → 403', async () => {
    const { token } = await registerUser({ username: 'alice', email: 'alice@x.dev' });
    const res = await request(app).get('/api/users').set(auth(token));
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/admin/i);
  });

  test('GET /api/users as admin → 200 with list', async () => {
    await registerUser({ username: 'alice', email: 'alice@x.dev' });
    const { token } = await makeAdmin();
    const res = await request(app).get('/api/users').set(auth(token));

    expect(res.statusCode).toBe(200);
    expect(res.body.total).toBeGreaterThanOrEqual(2);
    expect(res.body.data.every((u) => u.password === undefined)).toBe(true);
  });
});

describe('User update/delete permissions', () => {
  test('user can update their own profile', async () => {
    const me = await registerUser({ username: 'alice', email: 'alice@x.dev' });
    const res = await request(app)
      .put(`/api/users/${me.data.id}`)
      .set(auth(me.token))
      .send({ name: 'Alice Updated' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.name).toBe('Alice Updated');
  });

  test('user cannot update someone else — 403', async () => {
    const alice = await registerUser({ username: 'alice', email: 'alice@x.dev' });
    const bob = await registerUser({ username: 'bob', email: 'bob@x.dev' });
    const res = await request(app)
      .put(`/api/users/${alice.data.id}`)
      .set(auth(bob.token))
      .send({ name: 'Hacked' });

    expect(res.statusCode).toBe(403);
  });

  test('admin can update another user and change role; user cannot self-escalate', async () => {
    const alice = await registerUser({ username: 'alice', email: 'alice@x.dev' });

    // self-escalation attempt
    const selfRes = await request(app)
      .put(`/api/users/${alice.data.id}`)
      .set(auth(alice.token))
      .send({ role: 'admin' });
    expect(selfRes.statusCode).toBe(200);
    expect(selfRes.body.data.role).toBe('user'); // role change ignored

    // admin promotes
    const { token } = await makeAdmin();
    const res = await request(app)
      .put(`/api/users/${alice.data.id}`)
      .set(auth(token))
      .send({ role: 'admin' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.role).toBe('admin');
  });

  test('admin deleting self → 400; deleting others → 200', async () => {
    const alice = await registerUser({ username: 'alice', email: 'alice@x.dev' });
    const boss = await makeAdmin();

    const selfDel = await request(app)
      .delete(`/api/users/${boss.data.id}`)
      .set(auth(boss.token));
    expect(selfDel.statusCode).toBe(400);

    const del = await request(app)
      .delete(`/api/users/${alice.data.id}`)
      .set(auth(boss.token));
    expect(del.statusCode).toBe(200);

    const gone = await request(app).get(`/api/users/${alice.data.id}`);
    expect(gone.statusCode).toBe(404);
  });
});
