import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, buildSite } from './build-site.js';

const DEFAULT_SITE_URL = 'https://exhibita.github.io/vanilla-gorilla';
const WARNING = 'siteUrl is the template default';

// Clear the variables that the build reads, so the host environment does not change the result.
const CLEAN_ENV = { SITE_URL: '', SITE_TITLE: '', SITE_DESCRIPTION: '', GITHUB_ACTIONS: '', GITHUB_REPOSITORY: '' };

function build(options) {
    const site = buildSite({}, { ...options, env: { ...CLEAN_ENV, ...options.env } });
    assert.equal(site.status, 0, site.output);
    return site;
}

test('the committed config.json is valid JSON with the three site values', () => {
    const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8'));
    assert.match(config._comment, /secrets/i);
    assert.equal(config.siteUrl, DEFAULT_SITE_URL);
    assert.equal(typeof config.siteTitle, 'string');
    assert.equal(typeof config.siteDescription, 'string');
});

test('config.json sets the address, title and description in the RSS feed and sitemap', () => {
    const site = build({
        config: { _comment: 'test', siteUrl: 'https://example.com', siteTitle: 'Example', siteDescription: 'An example site.' }
    });
    try {
        const rss = site.read('rss.xml');
        assert.match(rss, /<link>https:\/\/example\.com\/<\/link>/);
        assert.match(rss, /<title>Example<\/title>/);
        assert.match(rss, /<description>An example site\.<\/description>/);
        assert.match(site.read('sitemap.xml'), /<loc>https:\/\/example\.com\//);
    } finally {
        site.cleanup();
    }
});

test('environment variables override config.json', () => {
    const site = build({
        config: { siteUrl: 'https://example.com', siteTitle: 'Example', siteDescription: 'An example site.' },
        env: { SITE_URL: 'https://env.example.org', SITE_TITLE: 'Env Title', SITE_DESCRIPTION: 'Env description.' }
    });
    try {
        const rss = site.read('rss.xml');
        assert.match(rss, /<link>https:\/\/env\.example\.org\/<\/link>/);
        assert.match(rss, /<title>Env Title<\/title>/);
        assert.match(rss, /<description>Env description\.<\/description>/);
    } finally {
        site.cleanup();
    }
});

test('a GitHub Actions build of another repository warns when siteUrl is the template default', () => {
    const site = build({ env: { GITHUB_ACTIONS: 'true', GITHUB_REPOSITORY: 'someone/my-site' } });
    try {
        assert.ok(site.output.includes(WARNING), site.output);
    } finally {
        site.cleanup();
    }
});

test('a GitHub Actions build of the template repository does not warn', () => {
    const site = build({ env: { GITHUB_ACTIONS: 'true', GITHUB_REPOSITORY: 'exhibita/vanilla-gorilla' } });
    try {
        assert.ok(!site.output.includes(WARNING), site.output);
    } finally {
        site.cleanup();
    }
});

test('a GitHub Actions build with its own siteUrl does not warn', () => {
    const site = build({
        config: { siteUrl: 'https://example.com' },
        env: { GITHUB_ACTIONS: 'true', GITHUB_REPOSITORY: 'someone/my-site' }
    });
    try {
        assert.ok(!site.output.includes(WARNING), site.output);
    } finally {
        site.cleanup();
    }
});

test('a local build with the default siteUrl does not warn', () => {
    const site = build({});
    try {
        assert.ok(!site.output.includes(WARNING), site.output);
    } finally {
        site.cleanup();
    }
});
