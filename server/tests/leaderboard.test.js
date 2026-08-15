const db = require('./db');
const { request, app, registerUser, auth } = require('./helpers');

const DAY = 86400000;
const daysAgo = (n) => new Date(Date.now() - n * DAY).toISOString();

beforeAll(() => db.connect());
afterEach(() => db.clear());
afterAll(() => db.close());

async function log(token, username, coffee_name, cups, daysBack, rating = 0) {
  const res = await request(app)
    .post('/api/days')
    .set(auth(token))
    .send({ username, coffee_name, count_of_cups: cups, rating, date: daysAgo(daysBack) });
  if (res.statusCode !== 201) throw new Error(`log failed: ${JSON.stringify(res.body)}`);
}

describe('GET /api/days/leaderboard', () => {
  test('ranks users by cups in the period, week excludes older logs', async () => {
    const alice = await registerUser({ username: 'alice', email: 'alice@x.dev', name: 'Alice Walker' });
    const bob = await registerUser({ username: 'bob', email: 'bob@x.dev', name: 'Bob Smith' });

    // alice: 5 cups this week + 3 cups 10 days ago (outside week, inside month)
    await log(alice.token, 'alice', 'Latte', 5, 0);
    await log(alice.token, 'alice', 'Espresso', 3, 10);
    // bob: 4 cups this week
    await log(bob.token, 'bob', 'Mocha', 4, 1, 5);

    const week = await request(app).get('/api/days/leaderboard?period=week');
    expect(week.statusCode).toBe(200);
    expect(week.body.period).toBe('week');
    expect(week.body.data).toHaveLength(2);
    expect(week.body.data[0]).toMatchObject({ username: 'alice', cups: 5 });
    expect(week.body.data[1]).toMatchObject({ username: 'bob', cups: 4 });

    const month = await request(app).get('/api/days/leaderboard?period=month');
    expect(month.body.data[0]).toMatchObject({ username: 'alice', cups: 8 }); // 5 + 3
    expect(month.body.data[1]).toMatchObject({ username: 'bob', cups: 4 });
  });

  test('joins display name, aggregates entries/unique coffees/avg rating (rated only)', async () => {
    const alice = await registerUser({ username: 'alice', email: 'alice@x.dev', name: 'Alice Walker' });
    await log(alice.token, 'alice', 'Latte', 2, 0, 4);
    await log(alice.token, 'alice', 'Latte', 1, 1, 5);
    await log(alice.token, 'alice', 'Espresso', 1, 2, 0); // unrated

    const res = await request(app).get('/api/days/leaderboard');
    const row = res.body.data[0];

    expect(row).toEqual({
      username: 'alice',
      name: 'Alice Walker',
      cups: 4,
      entries: 3,
      avg_rating: 4.5, // (4+5)/2 — the 0 doesn't drag it down
      unique_coffees: 2,
    });
  });

  test('default period is week; bogus period → 400; empty board → empty array', async () => {
    const def = await request(app).get('/api/days/leaderboard');
    expect(def.statusCode).toBe(200);
    expect(def.body.period).toBe('week');

    const bad = await request(app).get('/api/days/leaderboard?period=year');
    expect(bad.statusCode).toBe(400);

    const empty = await request(app).get('/api/days/leaderboard');
    expect(empty.body.data).toEqual([]);
  });

  test('privacy: leaderboard rows expose no user document fields (no email/password)', async () => {
    const alice = await registerUser({
      username: 'alice', email: 'alice@x.dev', name: 'Alice Walker', password: 'secret123',
    });
    await log(alice.token, 'alice', 'Latte', 2, 0);

    const res = await request(app).get('/api/days/leaderboard');
    const row = res.body.data[0];
    const raw = JSON.stringify(row);

    expect(raw).not.toContain('alice@x.dev');
    expect(raw).not.toContain('secret');
    expect(raw).not.toContain('password');
    expect(Object.keys(row).sort()).toEqual(
      ['avg_rating', 'cups', 'entries', 'name', 'unique_coffees', 'username'].sort()
    );
  });
});

describe('Public user profile — privacy', () => {
  test('GET /api/users/public/:username returns username/name/member_since only', async () => {
    await registerUser({
      username: 'alice', email: 'alice@x.dev', name: 'Alice Walker', age: 28, gender: 'female',
    });

    const res = await request(app).get('/api/users/public/alice');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.username).toBe('alice');
    expect(res.body.data.name).toBe('Alice Walker');
    expect(res.body.data.member_since).toBeTruthy();

    const raw = JSON.stringify(res.body.data);
    expect(raw).not.toContain('alice@x.dev');
    expect(raw).not.toContain('"age"');
    expect(raw).not.toContain('"gender"');
    expect(Object.keys(res.body.data).sort()).toEqual(['member_since', 'name', 'username']);
  });

  test('unknown username → 404', async () => {
    const res = await request(app).get('/api/users/public/ghost');
    expect(res.statusCode).toBe(404);
  });

  test('legacy public user reads are sanitized (no email/age/gender leak)', async () => {
    await registerUser({
      username: 'alice', email: 'alice@x.dev', name: 'Alice Walker', age: 28,
    });

    const byName = await request(app).get('/api/users/username/alice');
    expect(byName.statusCode).toBe(200);
    const rawName = JSON.stringify(byName.body.data);
    expect(rawName).not.toContain('alice@x.dev');
    expect(rawName).not.toContain('"age"');
    expect(byName.body.data.username).toBe('alice');

    const id = byName.body.data.id;
    const byId = await request(app).get(`/api/users/${id}`);
    expect(byId.statusCode).toBe(200);
    expect(JSON.stringify(byId.body.data)).not.toContain('alice@x.dev');
  });
});
