import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { ROOT, buildSite } from './build-site.js';

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

test('package.json declares template version 3', () => {
    assert.deepEqual(pkg.vanillaGorilla, { templateVersion: 3 });
});

test('package.json declares the AGPL-3.0-or-later license', () => {
    assert.equal(pkg.license, 'AGPL-3.0-or-later');
});

let site;

before(() => {
    site = buildSite({}, { fullSrc: true });
});

after(() => site.cleanup());

test('the real template src/ builds with exit code 0', () => {
    assert.equal(site.status, 0, site.output);
});

test('the demo gallery is a Markdown gallery with 4 images', () => {
    const $ = cheerio.load(site.read('gallery/earthy-lightshow/index.html'));
    assert.equal($('.entry-title').text().trim(), 'Earthy Lightshow Gallery');
    assert.equal($('#gallery .gallery-item').length, 4);
    assert.equal($('.lightbox-target').length, 4);
    assert.equal($('#gallery img').first().attr('src'), '../../images/gallery/sage-horizon.png');
});

test('/gallery/ is the generated index and links to the demo gallery', () => {
    const $ = cheerio.load(site.read('gallery/index.html'));
    assert.equal($('#gallery-list a[href="earthy-lightshow/"]').length, 1);
});
