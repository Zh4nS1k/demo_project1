const db = require('./db');
const Coffee = require('../src/models/Coffee');
const { request, app, registerUser, auth } = require('./helpers');

const DAY = 86400000;
const utcNoon = (offsetDays) =>
  new Date(new Date().toISOString().slice(0, 10) + 'T12:00:00.000Z').getTime() - offsetDays * DAY;

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

describe('GET /api/days/summary/:username — streaks, weekday, caffeine trend', () => {
  async function logAt(token, offsetDays, body = {}) {
    const res = await request(app)
      .post('/api/days')
      .set(auth(token))
      .send({ username: 'alice', coffee_name: 'Latte', count_of_cups: 1, rating: 0, ...body, date: new Date(utcNoon(offsetDays)).toISOString() });
    if (res.statusCode !== 201) throw new Error(`logAt failed: ${JSON.stringify(res.body)}`);
    return res;
  }

  test('current streak counts today+yesterday; longest spans an older 3-day run', async () => {
    const { token } = await registerUser({ username: 'alice', email: 'alice@x.dev' });

    // older isolated run: 10, 9, 8 days ago
    await logAt(token, 10);
    await logAt(token, 9);
    await logAt(token, 8);
    // gap … then today + yesterday
    await logAt(token, 1);
    await logAt(token, 0);

    const res = await request(app).get('/api/days/summary/alice');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.streaks).toEqual({ current: 2, longest: 3 });
  });

  test('current streak survives when today has no log yet (yesterday counts)', async () => {
    const { token } = await registerUser({ username: 'alice', email: 'alice@x.dev' });
    await logAt(token, 1);

    const res = await request(app).get('/api/days/summary/alice');
    expect(res.body.data.streaks.current).toBe(1);
  });

  test('current streak is 0 when the last log is ≥2 days ago', async () => {
    const { token } = await registerUser({ username: 'alice', email: 'alice@x.dev' });
    await logAt(token, 2);
    await logAt(token, 3);

    const res = await request(app).get('/api/days/summary/alice');
    expect(res.body.data.streaks).toEqual({ current: 0, longest: 2 });
  });

  test('most active weekday by cups with correct day name', async () => {
    const { token } = await registerUser({ username: 'alice', email: 'alice@x.dev' });

    // Three different weekdays, with Saturday (offset chosen below) getting most cups
    const offsets = [2, 3, 5];
    const dates = offsets.map((o) => new Date(utcNoon(o)));
    // Give the last-listed date 4 cups so it dominates
    await logAt(token, offsets[0], { count_of_cups: 1 });
    await logAt(token, offsets[1], { count_of_cups: 1 });
    await logAt(token, offsets[2], { count_of_cups: 4 });

    const expectedDay = dates[2].toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
    const res = await request(app).get('/api/days/summary/alice');

    expect(res.body.data.most_active_weekday).toEqual({
      day: expectedDay,
      cups: 4,
      entries: 1,
    });
  });

  test('caffeine trend = cups × energy_boost; unknown coffees count 0; zero-filled daily arrays', async () => {
    const { token } = await registerUser({ username: 'alice', email: 'alice@x.dev' });
    await Coffee.create({ name: 'Latte', taste: 'sweet', energy_boost: 6, milk: 1 });
    await Coffee.create({ name: 'Espresso', taste: 'bitter', energy_boost: 9, milk: 0 });

    await logAt(token, 0, { coffee_name: 'Latte', count_of_cups: 2 });      // 12 today
    await logAt(token, 3, { coffee_name: 'Espresso', count_of_cups: 1 });   // 9 three days ago
    await logAt(token, 5, { coffee_name: 'Ghost Brew', count_of_cups: 3 }); // deleted coffee → 0

    const res = await request(app).get('/api/days/summary/alice');
    const trend = res.body.data.caffeine_trend;

    expect(trend.last7.total).toBe(21);
    expect(trend.last30.total).toBe(21);
    expect(trend.last7.daily).toHaveLength(7);
    expect(trend.last30.daily).toHaveLength(30);

    const today = new Date().toISOString().slice(0, 10);
    const todayBar = trend.last7.daily[6]; // last element = today
    expect(todayBar).toEqual({ date: today, caffeine: 12 });

    // zero-fill: day 2 ago had no logs
    expect(trend.last7.daily[4].caffeine).toBe(0);
  });

  test('user with no logs gets zeroed insights', async () => {
    await registerUser({ username: 'ghost', email: 'ghost@x.dev' });
    const res = await request(app).get('/api/days/summary/ghost');

    expect(res.body.data.streaks).toEqual({ current: 0, longest: 0 });
    expect(res.body.data.most_active_weekday).toBeNull();
    expect(res.body.data.caffeine_trend.last7.total).toBe(0);
    expect(res.body.data.caffeine_trend.last7.daily).toHaveLength(7);
  });
});
