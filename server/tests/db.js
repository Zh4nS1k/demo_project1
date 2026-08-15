/**
 * Shared in-memory MongoDB lifecycle for Jest.
 *
 * Singleton: the first connect() starts the memory server; because tests run
 * with maxWorkers=1 (see jest.config.js) all test files reuse the same instance.
 */
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// First run downloads a mongod binary (~70 MB) — allow time for that.
jest.setTimeout(120000);

let mongod = null;

exports.connect = async () => {
  if (!mongod) {
    mongod = await MongoMemoryServer.create();
  }
  const uri = mongod.getUri('coffee_drinker_test');
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
  return uri;
};

/** Wipe all collections between tests for isolation. */
exports.clear = async () => {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
};

exports.close = async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
    mongod = null;
  }
};
