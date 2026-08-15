const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');

/** Register a fresh user via the API and get a token back. */
async function registerUser({
  username = 'tester',
  email = 'tester@test.dev',
  password = 'secret123',
  name = 'Test User',
} = {}) {
  const res = await request(app)
    .post('/api/users')
    .send({ username, email, password, name });
  if (res.statusCode !== 201) {
    throw new Error(`registerUser failed (${res.statusCode}): ${JSON.stringify(res.body)}`);
  }
  return res.body; // { success, data, token }
}

/** Register a user, flip their role to admin directly in the DB, return login body. */
async function makeAdmin({ username = 'boss', email = 'boss@test.dev' } = {}) {
  await registerUser({ username, email, password: 'secret123', name: 'Boss Admin' });
  await User.updateOne({ username }, { role: 'admin' });
  const res = await request(app)
    .post('/api/users/login')
    .send({ email, password: 'secret123' });
  if (res.statusCode !== 200) {
    throw new Error(`makeAdmin login failed (${res.statusCode}): ${JSON.stringify(res.body)}`);
  }
  return res.body;
}

/** Auth header helper. */
const auth = (token) => ({ Authorization: `Bearer ${token}` });

module.exports = { request, app, registerUser, makeAdmin, auth };
