import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite } from './build-site.js';

const page = (title, date, extra = '') =>
    `---\ntitle: ${title}\ndate: ${date}\ndescription: ${title} text.\n${extra}---\n\n${title} body.\n`;

let site;

before(() => {
    site = buildSite({
        'blog/live-post/index.md': page('Live Post', '2026-01-01'),
        'blog/secret-post/index.md': page('Secret Post', '2026-02-01', 'draft: true\n'),
        'blog/quoted-draft/index.md': page('Quoted Draft', '2026-03-01', 'draft: "TRUE"\n'),
        'blog/not-draft/index.md': page('Not Draft', '2025-12-01', 'draft: false\n'),
        'secret-page/index.md': page('Secret Page', '2026-01-01', 'skeleton: page\ndraft: true\n'),
        'gallery/live-gallery/index.md': page('Live Gallery', '2026-01-01', 'skeleton: gallery\n'),
        'gallery/secret-gallery/index.md': page('Secret Gallery', '2026-01-01', 'skeleton: gallery\ndraft: true\n')
    });
});

after(() => site.cleanup());

test('the build exits with code 0', () => {
    assert.equal(site.status, 0, site.output);
});

test('draft pages are not compiled', () => {
    assert.equal(site.exists('blog/secret-post/index.html'), false);
    assert.equal(site.exists('secret-page/index.html'), false);
    assert.equal(site.exists('gallery/secret-gallery/index.html'), false);
});

test('the string "true" in any case is a draft', () => {
    assert.equal(site.exists('blog/quoted-draft/index.html'), false);
});

test('draft: false and no draft field are published', () => {
    assert.equal(site.exists('blog/not-draft/index.html'), true);
    assert.equal(site.exists('blog/live-post/index.html'), true);
});

test('drafts are not in the blog index', () => {
    const index = site.read('blog/index.html');
    assert.match(index, /Live Post/);
    assert.doesNotMatch(index, /Secret Post|Quoted Draft/);
});

test('drafts are not in the RSS feed or the sitemap', () => {
    assert.doesNotMatch(site.read('rss.xml'), /secret-post|quoted-draft/);
    assert.doesNotMatch(site.read('sitemap.xml'), /secret|quoted-draft/);
});

test('drafts are not in recent posts or prev/next links', () => {
    assert.doesNotMatch(site.readSrc('templates/recent-posts.html'), /secret-post|quoted-draft/);
    assert.doesNotMatch(site.read('blog/live-post/index.html'), /secret-post|quoted-draft/);
});

test('draft galleries are not in the gallery index', () => {
    const index = site.read('gallery/index.html');
    assert.match(index, /live-gallery\//);
    assert.doesNotMatch(index, /secret-gallery/);
});

test('the build log names each skipped draft', () => {
    assert.match(site.output, /Skipping draft: .*secret-post/);
});
