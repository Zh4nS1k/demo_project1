const db = require('./db');
const { request, app, registerUser, auth } = require('./helpers');

beforeAll(() => db.connect());
afterEach(() => db.clear());
afterAll(() => db.close());

/**
 * Fixture: alice logs
 *   Latte    2 cups, rating 5
 *   Latte    2 cups, rating 4
 *   Espresso 3 cups, rating 0  (unrated)
 *   Mocha    1 cup,  rating 3
 * → totals: 8 cups / 4 entries / 3 unique coffees / avg (5+4+0+3)/4 = 3.0
 *   by_coffee (desc by cups): Latte 4, Espresso 3, Mocha 1
 */
async function seedAliceLog(token) {
  const entries = [
    { username: 'alice', coffee_name: 'Latte', count_of_cups: 2, rating: 5 },
    { username: 'alice', coffee_name: 'Latte', count_of_cups: 2, rating: 4 },
    { username: 'alice', coffee_name: 'Espresso', count_of_cups: 3, rating: 0 },
    { username: 'alice', coffee_name: 'Mocha', count_of_cups: 1, rating: 3 },
  ];
  for (const e of entries) {
    const res = await request(app).post('/api/days').set(auth(token)).send(e);
    if (res.statusCode !== 201) throw new Error(`seed failed: ${JSON.stringify(res.body)}`);
  }
}

describe('GET /api/days/summary/:username — aggregation', () => {
  test('computes totals, unique coffees and average rating', async () => {
    const { token } = await registerUser({ username: 'alice', email: 'alice@x.dev' });
    await seedAliceLog(token);

    const res = await request(app).get('/api/days/summary/alice');

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toMatchObject({
      username: 'alice',
      total_cups: 8,
      total_entries: 4,
      unique_coffees: expect.arrayContaining(['Latte', 'Espresso', 'Mocha']),
      avg_rating: 3,
    });
    expect(res.body.data.unique_coffees).toHaveLength(3);
  });

  test('by_coffee breakdown sorted by total cups desc', async () => {
    const { token } = await registerUser({ username: 'alice', email: 'alice@x.dev' });
    await seedAliceLog(token);

    const res = await request(app).get('/api/days/summary/alice');
    const byCoffee = res.body.data.by_coffee;

    expect(byCoffee.map((c) => c.coffee_name)).toEqual(['Latte', 'Espresso', 'Mocha']);
    expect(byCoffee[0]).toEqual({
      coffee_name: 'Latte',
      total_cups: 4,
      entries: 2,
      avg_rating: 4.5,
    });
    // espresso entry is unrated → its avg stays 0
    expect(byCoffee[1]).toEqual({
      coffee_name: 'Espresso',
      total_cups: 3,
      entries: 1,
      avg_rating: 0,
    });
  });

  test('rating_breakdown counts each star level', async () => {
    const { token } = await registerUser({ username: 'alice', email: 'alice@x.dev' });
    await seedAliceLog(token);

    const res = await request(app).get('/api/days/summary/alice');
    const breakdown = res.body.data.rating_breakdown;

    // sorted desc by rating: 5, 4, 3, 0 — one entry each
    expect(breakdown).toEqual([
      { rating: 5, count: 1 },
      { rating: 4, count: 1 },
      { rating: 3, count: 1 },
      { rating: 0, count: 1 },
    ]);
  });

  test('user with no logs gets a zeroed summary, not an error', async () => {
    await registerUser({ username: 'ghost', email: 'ghost@x.dev' });

    const res = await request(app).get('/api/days/summary/ghost');

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toMatchObject({
      username: 'ghost',
      total_cups: 0,
      total_entries: 0,
      unique_coffees: [],
      avg_rating: 0,
      by_coffee: [],
    });
  });

  test('aggregation is scoped to the requested user only', async () => {
    const alice = await registerUser({ username: 'alice', email: 'alice@x.dev' });
    const bob = await registerUser({ username: 'bob', email: 'bob@x.dev' });
    await seedAliceLog(alice.token);
    await request(app)
      .post('/api/days')
      .set(auth(bob.token))
      .send({ username: 'bob', coffee_name: 'Latte', count_of_cups: 10, rating: 5 });

    const aliceRes = await request(app).get('/api/days/summary/alice');
    expect(aliceRes.body.data.total_cups).toBe(8); // bob's 10 cups don't leak in
  });
});
