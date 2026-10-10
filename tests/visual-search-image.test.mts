import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateVisualSearchImage, VISUAL_SEARCH_MAX_BYTES } from '../src/lib/visual-search.ts';

function pngFixture() {
  const bytes = new Uint8Array(45);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  bytes.set([0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52], 8);
  bytes.set([0, 0, 0, 1, 0, 0, 0, 1], 16);
  bytes.set([8, 2, 0, 0, 0], 24);
  bytes.set([0, 0, 0, 0], 29);
  bytes.set([0, 0, 0, 0, 0x49, 0x45, 0x4e, 0x44], 33);
  bytes.set([0, 0, 0, 0], 41);
  return bytes;
}

function jpegFixture() {
  return new Uint8Array([
    0xff, 0xd8, 0xff, 0xc0, 0x00, 0x0b, 0x08,
    0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00,
    0xff, 0xd9,
  ]);
}

function webpFixture() {
  const bytes = new Uint8Array(30);
  bytes.set([0x52, 0x49, 0x46, 0x46, 22, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
  bytes.set([0x56, 0x50, 0x38, 0x58, 10, 0, 0, 0], 12);
  return bytes;
}

test('accepts structurally valid JPEG, PNG, and WebP with matching declared types', () => {
  assert.equal(validateVisualSearchImage(pngFixture(), 'image/png'), null);
  assert.equal(validateVisualSearchImage(jpegFixture(), 'image/jpeg'), null);
  assert.equal(validateVisualSearchImage(webpFixture(), 'image/webp'), null);
});

test('rejects image type mismatches and invalid signatures', () => {
  assert.match(validateVisualSearchImage(pngFixture(), 'image/jpeg') || '', /contents do not match/);
  assert.match(validateVisualSearchImage(new Uint8Array(40), 'image/png') || '', /contents do not match/);
  const oversizedDimensions = pngFixture();
  oversizedDimensions[16] = 0xff;
  assert.match(validateVisualSearchImage(oversizedDimensions, 'image/png') || '', /contents do not match/);
});

test('rejects unsupported, empty, and oversized images', () => {
  assert.match(validateVisualSearchImage(pngFixture(), 'image/gif') || '', /JPEG, PNG, or WebP/);
  assert.match(validateVisualSearchImage(new Uint8Array(), 'image/png') || '', /smaller than 4 MB/);
  assert.match(validateVisualSearchImage(new Uint8Array(VISUAL_SEARCH_MAX_BYTES + 1), 'image/png') || '', /smaller than 4 MB/);
});
