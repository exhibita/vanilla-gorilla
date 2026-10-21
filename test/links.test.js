import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import * as cheerio from 'cheerio';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildSite, ROOT } from './build-site.js';

const mainPage = `---
title: My Links
description: All my links.
skeleton: links
image: ./images/me.png
image_alt: A portrait
css: |
  .links-page { --color-primary: #123456; }
  /* </style><script>alert(1)</script> */
links:
  - url: https://example.com/a?x=1&y=2
    text: Fish & <Chips>
  - url: mailto:me@example.com
    text: Email me
  - url: tel:+15555550100
    text: Call me
  - url: ./relative/
    text: Relative link
  - url: /absolute-path/
    text: Root-relative link
  - url: //example.com/protocol-relative
    text: Protocol-relative link
  - url: "java\\tscript:alert(1)"
    text: Script link
  - url: data:text/html,hello
    text: Data link
  - url: https://example.com/no-text
  - text: No URL
  - just-a-string
  - url: https://example.com/last
    text: Last Link
  - url: file:///etc/passwd
    text: File link
  - url: blob:https://example.com/1234
    text: Blob link
  - url: view-source:https://example.com
    text: View-source link
  - url: ftp://example.com/file.txt
    text: FTP link
  - url: sms:+15555550100
    text: Text me
---

Intro text before the links.
`;

const bareLinks = `---
title: Bare Links
skeleton: links
---
`;

const nullLinks = `---
title: Null Links
skeleton: links
links:
---
`;

const badLinks = `---
title: Bad Links
skeleton: links
links: just-a-string
image: 42
css:
  - not-a-string
---
`;

// A links page under blog/ and gallery/ must not be listed.
const blogPath = `---
title: Hidden Blog Links
date: 2026-05-01
skeleton: links
links:
  - url: https://example.com/
    text: Example
---
`;

const galleryPath = `---
title: Hidden Gallery Links
date: 2026-05-01
skeleton: links
links:
  - url: https://example.com/
    text: Example
---
`;

const listedLinks = `---
title: Listed Links
skeleton: links
sitemap: true
links:
  - url: https://example.com/
    text: Example
---
`;

const normalPost = `---
title: Normal Post
date: 2026-05-02
---

A normal post.
`;

let site;
let $;

before(() => {
    site = buildSite({
        'links/index.md': mainPage,
        'links/bare/index.md': bareLinks,
        'links/listed/index.md': listedLinks,
        'links/null/index.md': nullLinks,
        'links/bad/index.md': badLinks,
        'blog/hidden-links/index.md': blogPath,
        'blog/normal-post/index.md': normalPost,
        'gallery/hidden-links/index.md': galleryPath
    });
    $ = cheerio.load(site.read('links/index.html'));
});

after(() => site.cleanup());

test('the build succeeds', () => {
    assert.equal(site.status, 0, site.output);
});

test('the page title is the H1 and the document title', () => {
    assert.equal($('h1.entry-title').text(), 'My Links');
    assert.equal($('title').text(), 'My Links - Vanilla Gorilla');
});

test('the page has no site header, nav or footer', () => {
    assert.equal($('header.site-header').length, 0);
    assert.equal($('.main-navigation').length, 0);
    assert.equal($('footer').length, 0);
});

test('only the valid entries become link buttons, in order', () => {
    const texts = $('#links a.link-button').map((_, a) => $(a).text()).get();
    assert.deepEqual(texts, ['Fish & <Chips>', 'Email me', 'Call me', 'Last Link', 'Text me']);
});

test('each link button opens in a new tab with a safe rel', () => {
    $('#links a.link-button').each((_, a) => {
        assert.equal($(a).attr('target'), '_blank');
        assert.equal($(a).attr('rel'), 'noopener noreferrer');
    });
});

test('link text and URLs are escaped', () => {
    const html = site.read('links/index.html');
    assert.match(html, /href="https:\/\/example\.com\/a\?x=1&amp;y=2"/);
    assert.match(html, /Fish &amp; &lt;Chips&gt;/);
});

test('invalid entries give warnings', () => {
    assert.match(site.output, /links[\\/]index\.md: links\[3\] url "\.\/relative\/" is not a full URL/);
    assert.match(site.output, /links\[4\] url "\/absolute-path\/" is not a full URL/);
    assert.match(site.output, /links\[5\] url "\/\/example\.com\/protocol-relative" is not a full URL/);
    assert.match(site.output, /links\[6\] url uses the protocol "javascript:", which is not allowed/);
    assert.match(site.output, /links\[7\] url uses the protocol "data:", which is not allowed/);
    assert.match(site.output, /links\[12\] url uses the protocol "file:", which is not allowed/);
    assert.match(site.output, /links\[13\] url uses the protocol "blob:", which is not allowed/);
    assert.match(site.output, /links\[14\] url uses the protocol "view-source:", which is not allowed/);
    assert.match(site.output, /links\[15\] url uses the protocol "ftp:", which is not allowed/);
    assert.doesNotMatch(site.output, /links\[16\]/);
    assert.match(site.output, /links\[8\] needs both "url" and "text"/);
    assert.match(site.output, /links\[9\] needs both "url" and "text"/);
    assert.match(site.output, /links\[10\] needs both "url" and "text"/);
});

test('the image is set from the front matter and its path is fixed for the page depth', () => {
    const img = $('img.links-image');
    assert.equal(img.length, 1);
    assert.equal(img.attr('src'), '../images/me.png');
    assert.equal(img.attr('alt'), 'A portrait');
});

test('the stylesheet path is fixed for the page depth', () => {
    assert.equal($('link[rel="stylesheet"]').attr('href'), '../css/style.min.css');
});

test('the Markdown body comes before the links', () => {
    assert.match($('.entry-content').text(), /Intro text before the links\./);
    const order = $('.entry-content, #links').map((_, el) => $(el).attr('id') || 'content').get();
    assert.deepEqual(order, ['content', 'links']);
});

test('the css front matter becomes a style block after the main stylesheet', () => {
    const css = $('head style#links-overrides').text();
    assert.match(css, /--color-primary: #123456/);
    assert.equal($('head > *').index($('style#links-overrides')) > $('head > *').index($('link[rel="stylesheet"]')), true);
});

test('the css front matter cannot close the style block', () => {
    assert.equal($('script').length, 0);
    assert.equal($('head style').length, 1);
});

test('a links page with no front matter extras has no image and no style block', () => {
    const bare = cheerio.load(site.read('links/bare/index.html'));
    assert.equal(bare('img.links-image').length, 0);
    assert.equal(bare('style#links-overrides').length, 0);
    assert.equal(bare('#links a').length, 0);
    assert.equal(bare('link[rel="stylesheet"]').attr('href'), '../../css/style.min.css');
});

test('an empty "links:" key builds an empty list without a warning', () => {
    const page = cheerio.load(site.read('links/null/index.html'));
    assert.equal(page('#links a').length, 0);
    assert.doesNotMatch(site.output, /links[\\/]null[\\/]index\.md: /);
});

test('wrong value types give warnings and are ignored', () => {
    assert.match(site.output, /links[\\/]bad[\\/]index\.md: "links" must be a list/);
    assert.match(site.output, /links[\\/]bad[\\/]index\.md: "image" must be a non-empty path or URL/);
    assert.match(site.output, /links[\\/]bad[\\/]index\.md: "css" must be a string of CSS/);
    const page = cheerio.load(site.read('links/bad/index.html'));
    assert.equal(page('img.links-image').length, 0);
    assert.equal(page('style#links-overrides').length, 0);
});

test('links pages stay out of the blog index, the feed and the gallery index', () => {
    assert.ok(site.exists('blog/hidden-links/index.html'));
    assert.ok(site.exists('gallery/hidden-links/index.html'));
    const blogIndex = site.read('blog/index.html');
    const feed = site.read('rss.xml');
    const galleryIndex = site.read('gallery/index.html');
    for (const text of [blogIndex, feed]) {
        assert.doesNotMatch(text, /Hidden Blog Links|hidden-links/);
        assert.match(text, /Normal Post/);
    }
    assert.doesNotMatch(galleryIndex, /Hidden Gallery Links|hidden-links/);
});

test('a links page is left out of sitemap.xml by default and in with "sitemap: true"', () => {
    const sitemap = site.read('sitemap.xml');
    assert.doesNotMatch(sitemap, /\/links\/<|links\/bare|links\/null|links\/bad|hidden-links/);
    assert.match(sitemap, /\/links\/listed\/</);
    assert.match(sitemap, /\/blog\/normal-post\/</);
});

test('create-md with the links skeleton writes two sample links', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vg-create-'));
    try {
        fs.cpSync(path.join(ROOT, 'src', 'skeletons'), path.join(dir, 'src', 'skeletons'), { recursive: true });
        const result = spawnSync(process.execPath, [path.join(ROOT, 'create-page.js'), '--md', 'links', 'links/new-page'], { cwd: dir, encoding: 'utf8' });
        assert.equal(result.status, 0, result.stderr);
        const stub = fs.readFileSync(path.join(dir, 'src', 'links', 'new-page', 'index.md'), 'utf8');
        assert.ok(stub.includes([
            'skeleton: links',
            'links:',
            '  - url: https://github.com/exhibita/vanilla-gorilla',
            '    text: Vanilla Gorilla on GitHub',
            '  - url: https://vg.exhibita.com',
            '    text: Vanilla Gorilla sample site',
            '---',
            '',
            'Write the text that shows above your links here. Delete this line if you do not want text.'
        ].join('\n')), stub);
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
});
