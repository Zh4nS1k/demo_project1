const db = require('./db');
const { request, app, registerUser, auth } = require('./helpers');

beforeAll(() => db.connect());
afterEach(() => db.clear());
afterAll(() => db.close());

async function logDay(token, body) {
  return request(app).post('/api/days').set(auth(token)).send(body);
}

describe('Day logging — auth & validation', () => {
  test('create without token → 401', async () => {
    const res = await request(app)
      .post('/api/days')
      .send({ username: 'alice', coffee_name: 'Latte', count_of_cups: 1 });

    expect(res.statusCode).toBe(401);
  });

  test('logged-in user creates an entry → 201', async () => {
    const { token, data } = await registerUser({ username: 'alice', email: 'alice@x.dev' });
    const res = await logDay(token, {
      username: data.username,
      coffee_name: 'Latte',
      count_of_cups: 2,
      rating: 5,
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.data).toMatchObject({
      coffee_name: 'Latte',
      count_of_cups: 2,
      rating: 5,
    });
  });

  test('invalid fields → 400 (cups out of range, bad rating)', async () => {
    const { token } = await registerUser({ username: 'alice', email: 'alice@x.dev' });
    const res = await logDay(token, {
      username: 'alice',
      coffee_name: 'Latte',
      count_of_cups: 0,
      rating: 9,
    });

    expect(res.statusCode).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toEqual(expect.arrayContaining(['count_of_cups', 'rating']));
  });
});

describe('Day listing — pagination & sorting', () => {
  // Registered per-test (beforeEach): afterEach wipes the DB, and the JWT
  // protect middleware loads the user fresh from the DB on every request.
  let token;

  beforeEach(async () => {
    ({ token } = await registerUser({ username: 'alice', email: 'alice@x.dev' }));
    for (let i = 1; i <= 15; i++) {
      const res = await logDay(token, {
        username: 'alice',
        coffee_name: `Coffee ${i}`,
        count_of_cups: i % 5 === 0 ? 5 : 1, // entries 5, 10, 15 get 5 cups
        rating: i % 6,
      });
      if (res.statusCode !== 201) throw new Error(`seed failed: ${JSON.stringify(res.body)}`);
    }
  });

  test('GET /api/days returns paginated envelope', async () => {
    const res = await request(app).get('/api/days?limit=10');

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ count: 10, total: 15, page: 1, pages: 2 });
  });

  test('page 2 returns the remaining entries', async () => {
    const res = await request(app).get('/api/days?limit=10&page=2');

    expect(res.body.count).toBe(5);
    expect(res.body.page).toBe(2);
  });

  test('bad pagination params → 400', async () => {
    const res = await request(app).get('/api/days?page=0');
    expect(res.statusCode).toBe(400);

    const res2 = await request(app).get('/api/days?limit=500');
    expect(res2.statusCode).toBe(400);
  });

  test('sort=cups&order=desc puts the biggest drinks first', async () => {
    const res = await request(app).get('/api/days/user/alice?sort=cups&order=desc&limit=3');

    expect(res.statusCode).toBe(200);
    expect(res.body.data.map((d) => d.count_of_cups)).toEqual([5, 5, 5]);
  });

  test('default sort is date desc (latest first)', async () => {
    const res = await request(app).get('/api/days/user/alice?limit=2');

    const dates = res.body.data.map((d) => new Date(d.date).getTime());
    expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);
  });

  test('coffee_name filter narrows results', async () => {
    const res = await request(app).get('/api/days?coffee_name=Coffee%203');

    expect(res.statusCode).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.data[0].coffee_name).toBe('Coffee 3');
  });

  test('from/to date filter: future window is empty', async () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString();
    const res = await request(app).get(`/api/days?from=${tomorrow}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.total).toBe(0);
  });
});

describe('Day update & delete', () => {
  test('author can update and delete own entry', async () => {
    const { token } = await registerUser({ username: 'alice', email: 'alice@x.dev' });
    const created = await logDay(token, {
      username: 'alice',
      coffee_name: 'Latte',
      count_of_cups: 1,
      rating: 3,
    });
    const id = created.body.data._id;

    const upd = await request(app)
      .put(`/api/days/${id}`)
      .set(auth(token))
      .send({ rating: 5 });
    expect(upd.statusCode).toBe(200);
    expect(upd.body.data.rating).toBe(5);

    const del = await request(app).delete(`/api/days/${id}`).set(auth(token));
    expect(del.statusCode).toBe(200);

    const gone = await request(app).get(`/api/days/${id}`);
    expect(gone.statusCode).toBe(404);
  });
});
