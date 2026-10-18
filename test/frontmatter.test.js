import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite } from './build-site.js';

// "images: list" makes a second ": " in an unquoted value, which is not valid YAML.
const badYaml = '---\ntitle: Bad\ndate: 2026-01-01\ndescription: Two images from the images: list.\n---\n\nBody.\n';

let site;

before(() => {
    site = buildSite({
        'blog/good-post/index.md': '---\ntitle: Good Post\ndate: 2026-01-01\n---\n\nGood body.\n',
        'blog/bad-post/index.md': badYaml,
        'bad-page/index.md': badYaml
    });
});

after(() => site.cleanup());

test('a page with invalid front matter does not stop the build', () => {
    assert.equal(site.status, 0, site.output);
    assert.equal(site.exists('blog/good-post/index.html'), true);
});

test('pages with invalid front matter are skipped', () => {
    assert.equal(site.exists('blog/bad-post/index.html'), false);
    assert.equal(site.exists('bad-page/index.html'), false);
    assert.doesNotMatch(site.read('blog/index.html'), /bad-post/);
});

test('each invalid page gets one warning that names the file', () => {
    const warnings = site.output.match(/Warning: Skipping .*bad-post.*not valid YAML/g) || [];
    assert.equal(warnings.length, 1, site.output);
    assert.match(site.output, /Warning: Skipping .*bad-page.*not valid YAML/);
});
