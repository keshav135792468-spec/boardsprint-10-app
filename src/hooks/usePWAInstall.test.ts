import test from 'node:test';
import assert from 'node:assert/strict';
import { detectIOSUserAgent, isStandaloneDisplayMode } from './usePWAInstall';

test('detectIOSUserAgent identifies iPhone, iPad, and iPod while excluding Android/Desktop', () => {
  assert.equal(
    detectIOSUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
    ),
    true
  );
  assert.equal(
    detectIOSUserAgent(
      'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
    ),
    true
  );
  assert.equal(
    detectIOSUserAgent(
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/124.0.0.0 Mobile Safari/537.36'
    ),
    false
  );
  assert.equal(
    detectIOSUserAgent(
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36'
    ),
    false
  );
});

test('isStandaloneDisplayMode detects standalone media query or iOS navigator.standalone', () => {
  assert.equal(isStandaloneDisplayMode(true, false), true);
  assert.equal(isStandaloneDisplayMode(false, true), true);
  assert.equal(isStandaloneDisplayMode(false, false), false);
  assert.equal(isStandaloneDisplayMode(false, undefined), false);
});
