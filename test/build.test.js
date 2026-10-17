import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite } from './build-site.js';

let site;

before(() => {
    site = buildSite({
        'blog/hello/index.md': '---\ntitle: Hello\ndate: 2026-01-01\ndescription: First post.\n---\n\nHello world.\n'
    });
});

after(() => site.cleanup());

test('the build exits with code 0', () => {
    assert.equal(site.status, 0, site.output);
});

test('a Markdown blog post compiles to dist/blog/<slug>/index.html', () => {
    assert.match(site.read('blog/hello/index.html'), /Hello world\./);
});

test('the blog index lists the post', () => {
    assert.match(site.read('blog/index.html'), /href="hello\/"/);
});
