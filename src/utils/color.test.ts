import test from 'node:test';
import assert from 'node:assert/strict';
import { isHexDraft, normalizeHex } from './color.ts';

test('normalizeHex accepts shorthand and uppercase values', () => {
  assert.equal(normalizeHex('#ABC'), '#aabbcc');
  assert.equal(normalizeHex('ABC123'), '#abc123');
  assert.equal(normalizeHex('#abcdef'), '#abcdef');
});

test('isHexDraft allows partial color text while the user is typing', () => {
  assert.equal(isHexDraft('#'), true);
  assert.equal(isHexDraft('ABC12'), true);
  assert.equal(isHexDraft('GGGGGG'), false);
  assert.equal(isHexDraft('1234567'), false);
});
