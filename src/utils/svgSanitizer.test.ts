import test from 'node:test';
import assert from 'node:assert/strict';
import { extractAndSanitizeSvg, getDiagramDimensions } from './svgSanitizer';

test('getDiagramDimensions returns expected viewBox for supported aspect ratios', () => {
  assert.equal(getDiagramDimensions('16:9').viewBox, '0 0 960 540');
  assert.equal(getDiagramDimensions('4:3').viewBox, '0 0 880 660');
  assert.equal(getDiagramDimensions('1:1').viewBox, '0 0 760 760');
  assert.equal(getDiagramDimensions('3:4').viewBox, '0 0 660 880');
  assert.equal(getDiagramDimensions('unknown').viewBox, '0 0 960 540');
});

test('extractAndSanitizeSvg extracts fenced SVG and preserves safe elements and internal #refs', () => {
  const raw =
    '```svg\n<svg viewBox="0 0 960 540"><defs><linearGradient id="g1"><stop offset="0%" stop-color="#6D28D9"/></linearGradient></defs><rect width="960" height="540" fill="url(#g1)"/><use href="#g1"/><text x="40" y="60">Heart Circulation</text></svg>\n```';
  const cleaned = extractAndSanitizeSvg(raw);
  assert.ok(cleaned);
  assert.ok(cleaned.includes('xmlns="http://www.w3.org/2000/svg"'));
  assert.ok(cleaned.includes('Heart Circulation'));
  assert.ok(cleaned.includes('href="#g1"'));
});

test('extractAndSanitizeSvg strips scripts, foreignObject, event handlers, and external/javascript hrefs', () => {
  const hostile = `<svg onload="alert(1)" viewBox="0 0 400 200">
    <script>alert("xss")</script>
    <foreignObject width="100" height="100"><div>evil</div></foreignObject>
    <a href="javascript:alert(2)"><rect onclick="evil()" width="50" height="50"/></a>
    <image href="https://evil.example/track.png" width="10" height="10"/>
    <text x="10" y="20">Safe Diagram Label</text>
  </svg>`;
  const cleaned = extractAndSanitizeSvg(hostile);
  assert.ok(cleaned);
  assert.ok(!cleaned.includes('<script'));
  assert.ok(!cleaned.includes('foreignObject'));
  assert.ok(!cleaned.includes('onload'));
  assert.ok(!cleaned.includes('onclick'));
  assert.ok(!cleaned.includes('javascript:'));
  assert.ok(!cleaned.includes('evil.example'));
  assert.ok(cleaned.includes('Safe Diagram Label'));
});

test('extractAndSanitizeSvg returns null when no svg root is present', () => {
  assert.equal(extractAndSanitizeSvg('Just plain text without vector markup'), null);
  assert.equal(extractAndSanitizeSvg(''), null);
});
