const db = require('./db');
const { request, app, registerUser, makeAdmin, auth } = require('./helpers');

beforeAll(() => db.connect());
afterEach(() => db.clear());
afterAll(() => db.close());

const validCoffee = { name: 'Flat White', taste: 'nutty', energy_boost: 7, milk: 1 };

describe('Coffee CRUD — access control', () => {
  test('create without token → 401', async () => {
    const res = await request(app).post('/api/coffees').send(validCoffee);
    expect(res.statusCode).toBe(401);
  });

  test('create as regular user → 403', async () => {
    const { token } = await registerUser();
    const res = await request(app).post('/api/coffees').set(auth(token)).send(validCoffee);
    expect(res.statusCode).toBe(403);
  });

  test('create as admin → 201', async () => {
    const { token } = await makeAdmin();
    const res = await request(app).post('/api/coffees').set(auth(token)).send(validCoffee);

    expect(res.statusCode).toBe(201);
    expect(res.body.data).toMatchObject(validCoffee);
  });
});

describe('Coffee CRUD — validation & duplicates', () => {
  test('invalid taste/energy/milk → 400 with field errors', async () => {
    const { token } = await makeAdmin();
    const res = await request(app)
      .post('/api/coffees')
      .set(auth(token))
      .send({ name: 'Weird', taste: 'metallic', energy_boost: 42, milk: 5 });

    expect(res.statusCode).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toEqual(expect.arrayContaining(['taste', 'energy_boost', 'milk']));
  });

  test('duplicate name → 409', async () => {
    const { token } = await makeAdmin();
    await request(app).post('/api/coffees').set(auth(token)).send(validCoffee);
    const res = await request(app).post('/api/coffees').set(auth(token)).send(validCoffee);

    expect(res.statusCode).toBe(409);
  });

  test('bad ObjectId param → 400', async () => {
    const res = await request(app).get('/api/coffees/notanid');
    expect(res.statusCode).toBe(400);
  });
});

describe('Coffee reads — public listing & filters', () => {
  beforeEach(async () => {
    const { token } = await makeAdmin();
    for (const c of [
      { name: 'Espresso', taste: 'bitter', energy_boost: 9, milk: 0 },
      { name: 'Latte', taste: 'sweet', energy_boost: 6, milk: 1 },
      { name: 'Cold Brew', taste: 'chocolate', energy_boost: 8, milk: 0 },
    ]) {
      await request(app).post('/api/coffees').set(auth(token)).send(c);
    }
  });

  test('public list returns all with community stats fields', async () => {
    const res = await request(app).get('/api/coffees');

    expect(res.statusCode).toBe(200);
    expect(res.body.count).toBe(3);
    expect(res.body.data[0]).toEqual(
      expect.objectContaining({
        avg_rating: null,
        total_cups: 0,
        total_entries: 0,
      })
    );
  });

  test('filters: taste, milk, minEnergy compose', async () => {
    const bitter = await request(app).get('/api/coffees?taste=bitter');
    expect(bitter.body.count).toBe(1);
    expect(bitter.body.data[0].name).toBe('Espresso');

    const noMilk = await request(app).get('/api/coffees?milk=0');
    expect(noMilk.body.count).toBe(2);

    const strong = await request(app).get('/api/coffees?minEnergy=8');
    expect(strong.body.count).toBe(2);

    const combo = await request(app).get('/api/coffees?taste=chocolate&milk=0&minEnergy=8');
    expect(combo.body.count).toBe(1);
    expect(combo.body.data[0].name).toBe('Cold Brew');
  });

  test('invalid filter values → 400', async () => {
    const res = await request(app).get('/api/coffees?taste=metallic');
    expect(res.statusCode).toBe(400);
  });

  test('name lookup treats regex metacharacters literally', async () => {
    // beforeEach in this block already registered the default admin — use unique creds
    const { token } = await makeAdmin({ username: 'boss2', email: 'boss2@test.dev' });
    await request(app)
      .post('/api/coffees')
      .set(auth(token))
      .send({ name: 'Latte', taste: 'sweet', energy_boost: 6, milk: 1 });

    // '.*' must not match everything — no coffee is literally named '.*'
    const wildcard = await request(app).get('/api/coffees/name/.*');
    expect(wildcard.statusCode).toBe(404);

    const exact = await request(app).get('/api/coffees/name/latte');
    expect(exact.statusCode).toBe(200);
    expect(exact.body.data.name).toBe('Latte');
  });
});

describe('Coffee update & delete', () => {
  test('admin updates a coffee → 200 with new values', async () => {
    const { token } = await makeAdmin();
    const created = await request(app).post('/api/coffees').set(auth(token)).send(validCoffee);

    const res = await request(app)
      .put(`/api/coffees/${created.body.data._id}`)
      .set(auth(token))
      .send({ energy_boost: 10 });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.energy_boost).toBe(10);
    expect(res.body.data.name).toBe('Flat White'); // untouched fields preserved
  });

  test('delete as admin → 200, then 404 on fetch; non-admin delete → 403', async () => {
    const { token } = await makeAdmin();
    const user = await registerUser();
    const created = await request(app).post('/api/coffees').set(auth(token)).send(validCoffee);
    const id = created.body.data._id;

    const forbidden = await request(app).delete(`/api/coffees/${id}`).set(auth(user.token));
    expect(forbidden.statusCode).toBe(403);

    const del = await request(app).delete(`/api/coffees/${id}`).set(auth(token));
    expect(del.statusCode).toBe(200);

    const gone = await request(app).get(`/api/coffees/${id}`);
    expect(gone.statusCode).toBe(404);
  });
});
