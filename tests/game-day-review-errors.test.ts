import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const { isNavigationPrefetchAbort, isExpectedPrefetchPageError } = require('./game-day-review-browser.cjs');
const url = 'http://127.0.0.1:3121/review?_rsc=known-prefetch';
const context = {
  engine: 'webkit', base: 'http://127.0.0.1:3121', navigating: true,
  method: 'GET', url, prefetch: '1', failure: 'Load request cancelled',
};
const message = `Fetch API cannot load ${url} due to access control checks.`;

test('only the known same-origin WebKit navigation-prefetch cancellation is eligible', () => {
  assert.equal(isNavigationPrefetchAbort(context), true);
  assert.equal(isNavigationPrefetchAbort({ ...context, failure: 'net::ERR_ABORTED' }), true);
  for (const different of [
    { engine: 'chromium' }, { navigating: false }, { method: 'POST' },
    { prefetch: undefined }, { prefetch: '0' }, { failure: 'access control checks' },
    { failure: 'Connection refused' }, { failure: undefined },
    { url: 'https://other.example/review?_rsc=known-prefetch' },
    { url: 'http://127.0.0.1:3121/private?_rsc=known-prefetch' },
    { url: 'http://127.0.0.1:3121/review' },
    { url: 'http://127.0.0.1:3121/review?_rsc=' }, { url: 'invalid' },
  ]) assert.equal(isNavigationPrefetchAbort({ ...context, ...different }), false, JSON.stringify(different));
});

test('page errors need the exact cancelled URL and remain failures on Chromium', () => {
  const aborted = new Set([url]);
  assert.equal(isExpectedPrefetchPageError(message, 'webkit', aborted), true);
  assert.equal(isExpectedPrefetchPageError(message, 'chromium', aborted), false);
  assert.equal(isExpectedPrefetchPageError(message, 'webkit', new Set()), false);
  assert.equal(isExpectedPrefetchPageError(message.replace('known-prefetch', 'another-request'), 'webkit', aborted), false);
  assert.equal(isExpectedPrefetchPageError(`Unexpected application error at ${url}`, 'webkit', aborted), false);
  assert.equal(isExpectedPrefetchPageError(`${message} Also https://other.example/`, 'webkit', aborted), false);
});

test('real access-control failures are retained instead of being treated as navigation aborts', () => {
  const aborted = new Set<string>();
  if (isNavigationPrefetchAbort({ ...context, failure: 'Blocked due to access control checks' })) aborted.add(url);
  const errors = [message, 'Unexpected application exception'];
  assert.deepEqual(errors.filter(error => !isExpectedPrefetchPageError(error, 'webkit', aborted)), errors);
});
