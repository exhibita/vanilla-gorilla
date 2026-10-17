import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite } from './build-site.js';

const post = '---\ntitle: Hello\ndate: 2026-01-01\n---\n\nHello.\n';
const handBuilt = '<!--#include file="templates/header.html" -->\n<h1>My own gallery page</h1>\n<!--#include file="templates/footer.html" -->\n';

let noGalleries;
let handBuiltIndex;

before(() => {
    noGalleries = buildSite({ 'blog/hello/index.md': post });
    handBuiltIndex = buildSite({ 'blog/hello/index.md': post, 'gallery/index.html': handBuilt });
});

after(() => {
    noGalleries.cleanup();
    handBuiltIndex.cleanup();
});

test('a site with no galleries still gets an empty /gallery/ index', () => {
    assert.equal(noGalleries.status, 0, noGalleries.output);
    assert.match(noGalleries.read('gallery/index.html'), /id="gallery-list"/);
});

test('a hand-built src/gallery/index.html is kept when there are no galleries', () => {
    assert.equal(handBuiltIndex.status, 0, handBuiltIndex.output);
    assert.match(handBuiltIndex.read('gallery/index.html'), /My own gallery page/);
});
