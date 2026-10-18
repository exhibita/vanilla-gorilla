import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import * as cheerio from 'cheerio';
import { buildSite } from './build-site.js';

const beachTrip = `---
title: Beach Trip
date: 2026-05-01
description: Photos from the beach.
skeleton: gallery
images:
  - path: ./images/gallery/beach-trip/one.jpg
    alt: Waves on the sand
    caption: Fish & <Chips>
  - path: images/gallery/beach-trip/two.jpg
    alt: A red umbrella
  - alt: An entry with no path
  - path: ./images/gallery/beach-trip/three.jpg
    caption: Sunset
---

We went to the beach.
`;

const onePhoto = `---
title: One Photo
date: 2026-04-01
skeleton: gallery
images:
  - path: ./images/gallery/one-photo/only.jpg
    alt: The only photo
---
`;

const emptyGallery = `---
title: Empty Gallery
date: 2026-03-01
skeleton: gallery
---

No images yet.
`;

const badList = `---
title: Bad List
date: 2026-02-01
skeleton: gallery
images: just-a-string
---

Text.
`;

const nullImages = `---
title: Null Images
date: 2026-01-15
skeleton: gallery
images:
---

Photos come later.
`;

const quotes = `---
title: Quotes
date: 2025-12-01
skeleton: gallery
images:
  - path: './images/gallery/quotes/a"b.jpg'
    alt: 'The "best" view'
---
`;

let site;
const load = relativePath => cheerio.load(site.read(relativePath));

before(() => {
    site = buildSite({
        'gallery/beach-trip/index.md': beachTrip,
        'gallery/one-photo/index.md': onePhoto,
        'gallery/empty-gallery/index.md': emptyGallery,
        'gallery/bad-list/index.md': badList,
        'gallery/null-images/index.md': nullImages,
        'gallery/quotes/index.md': quotes
    });
});

after(() => site.cleanup());

test('the build exits with code 0', () => {
    assert.equal(site.status, 0, site.output);
});

test('the title and the Markdown body are injected', () => {
    const $ = load('gallery/beach-trip/index.html');
    assert.equal($('.entry-title').text().trim(), 'Beach Trip');
    assert.match($('.entry-content').text(), /We went to the beach\./);
});

test('each image with a path gets a grid item and a lightbox', () => {
    const $ = load('gallery/beach-trip/index.html');
    assert.equal($('#gallery .gallery-item').length, 3);
    assert.equal($('.lightbox-target').length, 3);
    assert.deepEqual(
        $('#gallery .gallery-item a').map((_, el) => $(el).attr('href')).get(),
        ['#img1', '#img2', '#img3']
    );
    assert.deepEqual(
        $('.lightbox-target').map((_, el) => $(el).attr('id')).get(),
        ['img1', 'img2', 'img3']
    );
});

test('image paths are adjusted for the page depth', () => {
    const $ = load('gallery/beach-trip/index.html');
    assert.deepEqual(
        $('#gallery img').map((_, el) => $(el).attr('src')).get(),
        [
            '../../images/gallery/beach-trip/one.jpg',
            '../../images/gallery/beach-trip/two.jpg',
            '../../images/gallery/beach-trip/three.jpg'
        ]
    );
});

test('prev and next links wrap around; close goes back to the grid', () => {
    const $ = load('gallery/beach-trip/index.html');
    assert.equal($('#img1 .lightbox-prev').attr('href'), '#img3');
    assert.equal($('#img1 .lightbox-next').attr('href'), '#img2');
    assert.equal($('#img3 .lightbox-next').attr('href'), '#img1');
    assert.equal($('#img2 .lightbox-close').attr('href'), '#gallery');
});

test('captions are escaped', () => {
    const html = site.read('gallery/beach-trip/index.html');
    assert.doesNotMatch(html, /<Chips>/);
    const $ = cheerio.load(html);
    assert.equal($('#gallery .gallery-caption').first().text(), 'Fish & <Chips>');
    assert.equal($('#img1 .lightbox-desc').text(), 'Fish & <Chips>');
});

test('alt falls back to the caption; no caption means no caption element', () => {
    const $ = load('gallery/beach-trip/index.html');
    const items = $('#gallery .gallery-item');
    assert.equal(items.eq(1).find('.gallery-caption').length, 0);
    assert.equal(items.eq(2).find('img').attr('alt'), 'Sunset');
});

test('bad entries and bad lists are skipped with a warning', () => {
    assert.match(site.output, /beach-trip.*images\[2\] has no "path"/);
    assert.match(site.output, /bad-list.*"images" must be a list/);
    const $ = load('gallery/bad-list/index.html');
    assert.equal($('#gallery .gallery-item').length, 0);
});

test('a gallery with one image has no prev/next links', () => {
    const $ = load('gallery/one-photo/index.html');
    assert.equal($('.lightbox-target').length, 1);
    assert.equal($('.lightbox-nav').length, 0);
});

test('a gallery with no images shows only its text', () => {
    const $ = load('gallery/empty-gallery/index.html');
    assert.equal($('#gallery .gallery-item').length, 0);
    assert.match($('.entry-content').text(), /No images yet\./);
});

test('the gallery index uses the first image as the cover', () => {
    const $ = load('gallery/index.html');
    assert.equal($('a[href="beach-trip/"] img').attr('src'), '../images/gallery/beach-trip/one.jpg');
});

test('a gallery with no images gets the default cover on the index', () => {
    const $ = load('gallery/index.html');
    assert.equal($('a[href="empty-gallery/"] img').attr('src'), '../images/gallery/sage-horizon.png');
});

test('an empty images: key is an empty list, with no warning', () => {
    assert.doesNotMatch(site.output, /null-images.*"images" must be a list/);
    const $ = load('gallery/null-images/index.html');
    assert.equal($('#gallery .gallery-item').length, 0);
    assert.match($('.entry-content').text(), /Photos come later\./);
});

test('each images: warning prints once per build', () => {
    assert.equal((site.output.match(/beach-trip.*images\[2\] has no "path"/g) || []).length, 1);
    assert.equal((site.output.match(/bad-list.*"images" must be a list/g) || []).length, 1);
});

test('alt text with a double quote is shown as typed', () => {
    const $ = load('gallery/quotes/index.html');
    assert.equal($('#gallery img').attr('alt'), 'The "best" view');
    assert.equal($('#img1 img').attr('alt'), 'The "best" view');
});

test('a cover path with a double quote is escaped on the gallery index', () => {
    const $ = load('gallery/index.html');
    assert.equal($('a[href="quotes/"] img').attr('src'), '../images/gallery/quotes/a"b.jpg');
});
