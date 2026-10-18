import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite } from './build-site.js';

// A v1-style gallery skeleton: it has the #gallery grid but no #gallery-lightboxes container.
const oldSkeleton = `<!--#include file="templates/header.html" -->
<h1 class="entry-title"></h1>
<div class="entry-content"></div>
<div class="gallery-grid" id="gallery"></div>
<!--#include file="templates/footer.html" -->
`;

const page = `---
title: Old Skeleton Gallery
date: 2026-01-01
skeleton: old-gallery
images:
  - path: ./images/gallery/old/one.jpg
    alt: One
---
`;

let site;

before(() => {
    site = buildSite({
        'skeletons/old-gallery-skeleton.html': oldSkeleton,
        'gallery/old-skeleton/index.md': page
    });
});

after(() => site.cleanup());

test('a gallery skeleton without #gallery-lightboxes gives a warning', () => {
    assert.equal(site.status, 0, site.output);
    assert.match(site.output, /Warning: .*old-skeleton.*"old-gallery" has #gallery but no #gallery-lightboxes/);
});
