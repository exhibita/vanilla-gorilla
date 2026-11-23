import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite } from './build-site.js';

const post = (title, date, extra = '') =>
    `---\ntitle: ${title}\ndate: ${date}\ndescription: ${title} text.\n${extra}---\n\n${title} body.\n`;

let site;

before(() => {
    site = buildSite({
        'index.html': '<!--#include file="templates/header.html" -->\n<!--#include file="templates/recent-posts.html" -->\n<!--#include file="templates/footer.html" -->\n',
        'blog/plain/index.md': post('Plain', '2026-01-01'),
        'blog/pictured/index.md': post('Pictured', '2026-01-02', 'image: images/cover.png\nbadge: Hair Care\n'),
        'blog/dotted/index.md': post('Dotted', '2026-01-03', 'image: ./images/dotted.png\n'),
        'blog/remote/index.md': post('Remote', '2026-01-04', 'image: https://cdn.example.com/a.png\n'),
        'blog/labelled/index.md': post('Labelled', '2026-01-05', 'badge: "<Tips & Tricks>"\n'),
        'blog/body-image/index.md': post('Body image', '2026-01-06') + '\n![In the body](./images/body.png)\n',
        'blog/empty/index.md': post('Empty', '2026-01-07', 'image:\nbadge:\n')
    }, { config: { postsPerPage: 5 } });
});

after(() => site.cleanup());

const entry = (html, slug) => {
    const articles = html.split('<article').slice(1).map(part => `<article${part.split('</article>')[0]}</article>`);
    return articles.find(article => article.includes(`href="${slug}/"`)) || '';
};

const item = (html, slug) => {
    const items = html.split('<li').slice(1).map(part => `<li${part.split('</li>')[0]}</li>`);
    return items.find(li => li.includes(`/blog/${slug}/"`)) || '';
};

test('the build exits with code 0 and has no warnings', () => {
    assert.equal(site.status, 0, site.output);
    assert.doesNotMatch(site.output, /Warning/);
});

test('a post with no image and no badge keeps the earlier blog index markup', () => {
    const html = entry(site.read('blog/page/2/index.html'), '../../plain');
    assert.match(html, /^<article class="post type-post status-publish format-standard hentry">\s*<header class="entry-header">\s*<h2 class="entry-title">/);
    assert.doesNotMatch(html, /post-thumbnail|entry-badge/);
});

test('a post with no image and no badge keeps the title-only recent posts item', () => {
    assert.equal(
        item(site.readSrc('templates/recent-posts.html'), 'body-image'),
        '<li><a class="wp-block-latest-posts__post-title" href="./blog/body-image/">Body image</a></li>'
    );
});

test('an image in the body of a post is not used as the post image', () => {
    assert.doesNotMatch(entry(site.read('blog/index.html'), 'body-image'), /post-thumbnail/);
});

test('empty image and badge keys add nothing', () => {
    assert.doesNotMatch(entry(site.read('blog/index.html'), 'empty'), /post-thumbnail|entry-badge/);
});

test('the blog index shows the image and the badge, with the path fixed for the page depth', () => {
    const html = entry(site.read('blog/page/2/index.html'), '../../pictured');
    assert.match(html, /class="post [^"]*has-post-thumbnail"/);
    assert.match(html, /<a class="post-thumbnail" href="..\/..\/pictured\/" tabindex="-1" aria-hidden="true"><img src="..\/..\/..\/images\/cover.png" alt="" loading="lazy"><\/a>/);
    assert.match(html, /<span class="entry-badge">Hair Care<\/span>/);
});

test('an image path that starts with "./" is fixed for the depth of the first blog index page', () => {
    assert.match(entry(site.read('blog/index.html'), 'dotted'), /<img src="..\/images\/dotted.png"/);
});

test('a full URL is used as written', () => {
    assert.match(entry(site.read('blog/index.html'), 'remote'), /<img src="https:\/\/cdn.example.com\/a.png"/);
});

test('the badge text is escaped', () => {
    const html = entry(site.read('blog/index.html'), 'labelled');
    assert.match(html, /<span class="entry-badge">&lt;Tips &amp; Tricks&gt;<\/span>/);
    assert.doesNotMatch(html, /has-post-thumbnail/);
});

test('the recent posts list shows the image, the date and the summary for a post with an image', () => {
    const html = item(site.readSrc('templates/recent-posts.html'), 'dotted');
    assert.match(html, /^<li class="has-post-thumbnail">/);
    assert.match(html, /<a class="wp-block-latest-posts__featured-image" href=".\/blog\/dotted\/" tabindex="-1" aria-hidden="true"><img src=".\/images\/dotted.png" alt="" loading="lazy"><\/a>/);
    assert.match(html, /<time class="wp-block-latest-posts__post-date" datetime="2026-01-03">/);
    assert.match(html, /<div class="wp-block-latest-posts__post-excerpt">Dotted text.<\/div>/);
});

test('the recent posts list shows the badge for a post with only a badge', () => {
    const html = item(site.readSrc('templates/recent-posts.html'), 'labelled');
    assert.match(html, /^<li>/);
    assert.match(html, /<span class="wp-block-latest-posts__badge">&lt;Tips &amp; Tricks&gt;<\/span>/);
    assert.doesNotMatch(html, /featured-image/);
});

test('the home page uses the image path as written, because it is at depth 0', () => {
    assert.match(site.read('index.html'), /<img src=".\/images\/dotted.png"/);
});
