/**
 * Tiny emoji-prefixed logger — zero dependencies.
 *
 * - Every line is timestamped (HH:MM:SS.mmm) for log streams (Render/Docker).
 * - info/success/event are silenced in test mode so jest output stays clean;
 *   warn/error always print, even in tests.
 *
 * Usage:
 *   const { log } = require('../utils/log');
 *   log.success('MongoDB connected:', host);
 *   log.event('🎉', 'New user registered:', username);
 */

const isTest = process.env.NODE_ENV === 'test';

const ts = () => new Date().toISOString().slice(11, 23);

const write = (stream, icon, args) => stream(`  ${icon} [${ts()}]`, ...args);

exports.log = {
  info: (...args) => !isTest && write(console.log, 'ℹ️ ', args),
  success: (...args) => !isTest && write(console.log, '✅', args),
  warn: (...args) => write(console.warn, '⚠️ ', args),
  error: (...args) => write(console.error, '❌', args),
  /** Any custom icon: log.event('🎉', 'New user:', name) */
  event: (icon, ...args) => !isTest && write(console.log, icon, args),
};
