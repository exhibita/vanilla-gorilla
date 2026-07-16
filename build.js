import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import chokidar from 'chokidar';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as cheerio from 'cheerio';
import { marked } from 'marked';
import matter from 'gray-matter';

const execPromise = promisify(exec);

const SRC_DIR = './src';
const DIST_DIR = './dist';

// Default configuration (can be overriden via config.json or env variables)
const config = {
    siteUrl: process.env.SITE_URL || 'https://exhibita.github.io/vanilla-gorilla',
    siteTitle: process.env.SITE_TITLE || 'Vanilla Gorilla',
    siteDescription: process.env.SITE_DESCRIPTION || 'Vanilla HTML/CSS/JS compiler with agentic superpowers.',
    rssItemLimit: 20,
    postsPerPage: 10
};

// Try loading local config.json if it exists
try {
    if (existsSync('./config.json')) {
        const localConfig = JSON.parse(await fs.readFile('./config.json', 'utf8'));
        Object.assign(config, localConfig);
    }
} catch (err) {
    console.warn('Warning: Failed to parse config.json, using defaults.', err.message);
}

const { siteUrl: SITE_URL, siteTitle: SITE_TITLE, siteDescription: SITE_DESCRIPTION, rssItemLimit: RSS_ITEM_LIMIT, postsPerPage: POSTS_PER_PAGE } = config;

// Registry of blog post metadata collected during compilation, keyed by slug.
const blogPosts = new Map();

// Registry of gallery metadata collected during compilation, keyed by slug.
const galleries = new Map();

function gallerySlugFor(relativePath) {
    const parts = relativePath.split(path.sep);
    if (parts.length !== 3 || parts[0] !== 'gallery') return null;
    if (parts[2] !== 'index.html' && parts[2] !== 'index.md') return null;
    return parts[1];
}

// Clean and recreate dist directory
async function cleanDist() {
    console.log('Cleaning dist directory...');
    await fs.rm(DIST_DIR, { recursive: true, force: true });
    await fs.mkdir(DIST_DIR, { recursive: true });
}

// Helper to get directory nesting depth relative to SRC_DIR
function getDepth(filePath) {
    const relativePath = path.relative(SRC_DIR, filePath);
    const parts = relativePath.split(path.sep);
    return parts.length - 1; // index.html is depth 0, blog/my-post/index.html is depth 2
}

// Adjust relative links across a full cheerio document based on depth.
function adjustDocumentLinks($, depth) {
    if (depth === 0) return;

    const prefix = '../'.repeat(depth);

    $('*').each((_, el) => {
        const attribs = el.attribs;
        if (!attribs) return;
        for (const attr of Object.keys(attribs)) {
            const val = attribs[attr];
            if (!val) continue;
            if (val.startsWith('./')) {
                $(el).attr(attr, val.replace(/^\.\//, prefix));
            } else if (attr === 'style') {
                $(el).attr(attr, val.replace(/url\((['"]?)\.\//g, `url($1${prefix}`));
            }
        }
    });

    $('style').each((_, el) => {
        let css = $(el).text();
        css = css.replace(/url\((['"]?)\.\//g, `url($1${prefix}`);
        $(el).text(css);
    });
}

// Expand SSI-style includes: <!--#include file="templates/header.html" -->
async function expandIncludes(content, filePath) {
    const relativePath = path.relative(SRC_DIR, filePath);
    const includeRegex = /<!--#include\s+(?:file|virtual)="(.+?)"\s*-->/g;

    let modifiedContent = content;
    const matches = [...content.matchAll(includeRegex)];

    for (const m of matches) {
        const fullDirective = m[0];
        const includeFile = m[1];

        // Try resolving relative to SRC_DIR or current file dir
        let resolvedPath = path.join(SRC_DIR, includeFile);
        if (!existsSync(resolvedPath)) {
            resolvedPath = path.join(path.dirname(filePath), includeFile);
        }

        if (existsSync(resolvedPath)) {
            let templateContent = await fs.readFile(resolvedPath, 'utf8');
            modifiedContent = modifiedContent.replace(fullDirective, templateContent);
        } else {
            console.warn(`Warning: Include file not found: ${includeFile} (referenced in ${relativePath})`);
        }
    }

    return modifiedContent;
}

// True if this src-relative path is a blog post page (blog/<slug>/index.*),
// excluding the blog index itself and the author pages.
function blogSlugFor(relativePath) {
    const parts = relativePath.split(path.sep);
    if (parts.length !== 3 || parts[0] !== 'blog' || parts[1] === 'author') return null;
    if (parts[2] !== 'index.html' && parts[2] !== 'index.md') return null;
    return parts[1];
}

function formatDisplayDate(date) {
    return date.toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
    });
}

// Normalize a frontmatter date (YAML Date object or string) to a Date, or null.
function parseFrontmatterDate(value) {
    if (value instanceof Date) return isNaN(value) ? null : value;
    if (typeof value === 'string') {
        const isoDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00Z` : value;
        const d = new Date(isoDateOnly);
        return isNaN(d) ? null : d;
    }
    return null;
}

function truncateText(text, max = 200) {
    const clean = text.replace(/\s+/g, ' ').trim();
    if (clean.length <= max) return clean;
    return clean.slice(0, max).replace(/\s+\S*$/, '') + '...';
}

// Extract post metadata from compiled HTML blog post
function collectHtmlPostMetadata(slug, content) {
    const $ = cheerio.load(content);

    const title = $('h1.entry-title').first().text().trim()
        || $('title').text().replace(/\s*-\s*$/, '').trim()
        || slug;

    const dateStr = $('meta[property="article:published_time"]').attr('content')
        || $('time.entry-date').attr('datetime');
    let date = dateStr ? new Date(dateStr) : null;
    if (date && isNaN(date)) date = null;

    const description = $('meta[property="og:description"]').attr('content')
        || truncateText($('.entry-content p').first().text());

    if (!date) {
        console.warn(`Warning: No publish date found for blog post "${slug}"; it will sort last.`);
    }

    blogPosts.set(slug, { slug, title, date, description });
}

// Extract gallery metadata from compiled HTML gallery
function collectHtmlGalleryMetadata(slug, content) {
    const $ = cheerio.load(content);

    const title = $('h1.entry-title').first().text().trim()
        || $('h1.page-title').first().text().trim()
        || $('title').text().replace(/\s*-\s*$/, '').trim()
        || slug;

    const dateStr = $('meta[property="article:published_time"]').attr('content')
        || $('time.entry-date').attr('datetime');
    let date = dateStr ? new Date(dateStr) : null;
    if (date && isNaN(date)) date = null;

    const description = $('meta[name="description"]').attr('content')
        || $('meta[property="og:description"]').attr('content')
        || truncateText($('.page-header p').first().text() || $('p').first().text());

    const cover = $('img').first().attr('src') || '';

    galleries.set(slug, { slug, title, date, description, cover });
}

// Compile a single HTML file
async function compileHtmlFile(filePath) {
    const relativePath = path.relative(SRC_DIR, filePath);
    const destPath = path.join(DIST_DIR, relativePath);

    // Skip templates and skeletons
    const parts = relativePath.split(path.sep);
    if (parts[0] === 'templates' || parts[0] === 'skeletons') {
        return;
    }

    console.log(`Compiling HTML: ${relativePath}`);

    const content = await fs.readFile(filePath, 'utf8');
    const depth = getDepth(filePath);

    let modifiedContent = await expandIncludes(content, filePath);

    if (depth > 0) {
        const $ = cheerio.load(modifiedContent);
        adjustDocumentLinks($, depth);
        modifiedContent = $.html();
    }

    const slug = blogSlugFor(relativePath);
    if (slug) {
        collectHtmlPostMetadata(slug, content);
    }

    const gallerySlug = gallerySlugFor(relativePath);
    if (gallerySlug) {
        collectHtmlGalleryMetadata(gallerySlug, modifiedContent);
    }

    await fs.mkdir(path.dirname(destPath), { recursive: true });
    await fs.writeFile(destPath, modifiedContent, 'utf8');
}

// Compile a markdown file into a full HTML page by merging it into a skeleton.
async function compileMarkdownFile(filePath) {
    const relativePath = path.relative(SRC_DIR, filePath);

    // Skip templates and skeletons
    const parts = relativePath.split(path.sep);
    if (parts[0] === 'templates' || parts[0] === 'skeletons') {
        return;
    }

    const htmlRelativePath = relativePath.replace(/\.md$/, '.html');
    const destPath = path.join(DIST_DIR, htmlRelativePath);

    const siblingHtml = filePath.replace(/\.md$/, '.html');
    if (existsSync(siblingHtml)) {
        console.warn(`Warning: Skipping ${relativePath} because ${path.relative(SRC_DIR, siblingHtml)} exists and compiles to the same destination.`);
        return;
    }

    console.log(`Compiling Markdown: ${relativePath}`);

    const raw = await fs.readFile(filePath, 'utf8');
    const { data: frontmatter, content: markdownBody } = matter(raw);

    if (!frontmatter.title) {
        console.warn(`Warning: Skipping ${relativePath}: frontmatter is missing required "title" field.`);
        return;
    }

    const skeletonName = frontmatter.skeleton || 'blog';
    const skeletonPath = path.join(SRC_DIR, 'skeletons', `${skeletonName}-skeleton.html`);
    if (!existsSync(skeletonPath)) {
        console.warn(`Warning: Skipping ${relativePath}: skeleton "${skeletonName}" not found at ${skeletonPath}.`);
        return;
    }

    const bodyHtml = marked.parse(markdownBody);
    const date = parseFrontmatterDate(frontmatter.date);

    const slug = blogSlugFor(relativePath);

    const skeletonContent = await fs.readFile(skeletonPath, 'utf8');
    const $ = cheerio.load(skeletonContent);

    // Inject title, body, and dates
    $('title').text(`${frontmatter.title} - ${SITE_TITLE}`);
    $('.entry-title').text(frontmatter.title);
    $('.entry-content').html(bodyHtml);

    const $time = $('time.entry-date');
    if (date && $time.length) {
        $time.attr('datetime', date.toISOString().slice(0, 10));
        $time.text(formatDisplayDate(date));
    } else if ($time.length) {
        $time.closest('.posted-on').remove();
    }

    if (!slug) {
        $('.entry-footer').remove();
    }

    if (frontmatter.description) {
        $('meta[name="description"]').remove();
        $('head').append(`<meta name="description" content="${frontmatter.description.replace(/"/g, '&quot;')}"/>\n`);
    }

    const depth = getDepth(filePath);
    const merged = $.html();
    let finalContent = await expandIncludes(merged, filePath);

    if (depth > 0) {
        const $final = cheerio.load(finalContent);
        adjustDocumentLinks($final, depth);
        finalContent = $final.html();
    }

    if (slug) {
        const description = frontmatter.description
            || truncateText(cheerio.load(bodyHtml)('p').first().text());
        blogPosts.set(slug, { slug, title: frontmatter.title, date, description });
    }

    const gallerySlug = gallerySlugFor(relativePath);
    if (gallerySlug) {
        const description = frontmatter.description
            || truncateText(cheerio.load(bodyHtml)('p').first().text());
        const cover = frontmatter.cover || cheerio.load(bodyHtml)('img').first().attr('src') || '';
        galleries.set(gallerySlug, { slug: gallerySlug, title: frontmatter.title, date, description, cover });
    }

    await fs.mkdir(path.dirname(destPath), { recursive: true });
    await fs.writeFile(destPath, finalContent, 'utf8');
}

// Copy a static asset
async function copyAsset(filePath) {
    const relativePath = path.relative(SRC_DIR, filePath);
    const destPath = path.join(DIST_DIR, relativePath);

    // Skip templates and skeletons
    const parts = relativePath.split(path.sep);
    if (parts[0] === 'templates' || parts[0] === 'skeletons') {
        return;
    }

    await fs.mkdir(path.dirname(destPath), { recursive: true });
    await fs.copyFile(filePath, destPath);
    console.log(`Copied asset: ${relativePath}`);
}

// Get sorted list of blog posts
function sortedPosts() {
    return [...blogPosts.values()].sort((a, b) => {
        if (!a.date && !b.date) return a.title.localeCompare(b.title);
        if (!a.date) return 1;
        if (!b.date) return -1;
        return b.date - a.date;
    });
}

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function escapeXml(text) {
    return escapeHtml(text).replace(/'/g, '&apos;');
}

// Generate the blog index
async function generateBlogIndex() {
    const srcIndexPath = path.join(SRC_DIR, 'blog', 'index.html');
    if (existsSync(srcIndexPath)) {
        console.warn('Warning: src/blog/index.html exists; skipping generated blog index.');
        return;
    }

    const templatePath = path.join(SRC_DIR, 'templates', 'blog-index.html');
    if (!existsSync(templatePath)) {
        console.warn('Warning: src/templates/blog-index.html not found; skipping blog index generation.');
        return;
    }

    console.log('Generating blog index...');
    await fs.rm(path.join(DIST_DIR, 'blog', 'page'), { recursive: true, force: true });

    const posts = sortedPosts();
    const pageCount = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
    const template = await fs.readFile(templatePath, 'utf8');

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
        const pagePosts = posts.slice((pageNum - 1) * POSTS_PER_PAGE, pageNum * POSTS_PER_PAGE);

        const isFirst = pageNum === 1;
        const destDirParts = isFirst ? ['blog'] : ['blog', 'page', String(pageNum)];
        const depth = destDirParts.length;
        const postHrefPrefix = isFirst ? '' : '../../';

        const entries = pagePosts.map(post => {
            const dateHtml = post.date
                ? `\n                            <div class="entry-meta">\n                                <span class="posted-on"><time class="entry-date published" datetime="${post.date.toISOString().slice(0, 10)}">${formatDisplayDate(post.date)}</time></span>\n                            </div>`
                : '';
            const summaryHtml = post.description
                ? `\n                        <div class="entry-summary">\n                            <p>${escapeHtml(post.description)}</p>\n                        </div>`
                : '';
            return `                    <article class="post type-post status-publish format-standard hentry">
                        <header class="entry-header">
                            <h2 class="entry-title"><a href="${postHrefPrefix}${encodeURI(post.slug)}/">${escapeHtml(post.title)}</a></h2>${dateHtml}
                        </header>${summaryHtml}
                    </article>`;
        }).join('\n');

        const $ = cheerio.load(template);
        if (!isFirst) {
            $('title').text(`Blog - Page ${pageNum} - ${SITE_TITLE}`);
        }
        $('#blog-post-list').html('\n' + entries + '\n');

        // Navigation links
        const olderHref = isFirst ? 'page/2/' : `../${pageNum + 1}/`;
        const newerHref = pageNum === 2 ? '../../' : `../${pageNum - 1}/`;
        const older = pageNum < pageCount
            ? `\n                            <div class="nav-previous"><a href="${olderHref}">Older posts</a></div>`
            : '';
        const newer = !isFirst
            ? `\n                            <div class="nav-next"><a href="${newerHref}">Newer posts</a></div>`
            : '';
        if (older || newer) {
            $('#blog-post-list').after(`
                    <nav class="navigation paging-navigation" role="navigation" style="overflow: hidden;">
                        <h2 class="screen-reader-text">Posts navigation</h2>
                        <div class="nav-links">${older}${newer}
                        </div>
                    </nav>`);
        }

        const virtualPath = path.join(SRC_DIR, ...destDirParts, 'index.html');
        let finalContent = await expandIncludes($.html(), virtualPath);

        if (depth > 0) {
            const $final = cheerio.load(finalContent);
            adjustDocumentLinks($final, depth);
            finalContent = $final.html();
        }

        const destPath = path.join(DIST_DIR, ...destDirParts, 'index.html');
        await fs.mkdir(path.dirname(destPath), { recursive: true });
        await fs.writeFile(destPath, finalContent, 'utf8');
    }

    console.log(`Blog index generated: ${posts.length} posts across ${pageCount} page(s).`);
}

// Generate dist/rss.xml
async function generateRssFeed() {
    console.log('Generating RSS feed...');
    const posts = sortedPosts().filter(p => p.date).slice(0, RSS_ITEM_LIMIT);

    const items = posts.map(post => {
        const url = `${SITE_URL}/blog/${encodeURI(post.slug)}/`;
        return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${post.date.toUTCString()}</pubDate>
      <description>${escapeXml(post.description || '')}</description>
    </item>`;
    }).join('\n');

    const lastBuildDate = posts.length ? posts[0].date.toUTCString() : new Date().toUTCString();

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}/</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en-US</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;

    await fs.writeFile(path.join(DIST_DIR, 'rss.xml'), xml, 'utf8');
    console.log(`RSS feed generated with ${posts.length} items.`);
}

// Generates the recent-posts.html template fragment
async function generateRecentPostsInclude() {
    console.log('Generating Recent Posts include...');
    const posts = sortedPosts().slice(0, 5);
    
    const items = posts.map(post => {
        return `    <li><a class="wp-block-latest-posts__post-title" href="./blog/${encodeURI(post.slug)}/">${escapeHtml(post.title)}</a></li>`;
    }).join('\n');

    const content = `<!-- 
    AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
    This file is generated by build.js based on the latest blog posts.
    Any manual changes will be overwritten during the next build.
-->
<ul class="wp-block-latest-posts__list wp-block-latest-posts">
${items}
</ul>`;

    const includePath = path.join(SRC_DIR, 'templates', 'recent-posts.html');
    await fs.writeFile(includePath, content, 'utf8');
}

// Injects next/previous navigation into compiled blog post HTML files
async function injectPostNavigation() {
    console.log('Injecting post navigation...');
    const posts = sortedPosts();
    
    for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        const prev = posts[i + 1]; // Older
        const next = posts[i - 1]; // Newer
        
        const postPath = path.join(DIST_DIR, 'blog', post.slug, 'index.html');
        if (!existsSync(postPath)) continue;

        const content = await fs.readFile(postPath, 'utf8');
        const $ = cheerio.load(content);
        
        const olderHtml = prev 
            ? `<div class="nav-previous"><a href="../${encodeURI(prev.slug)}/" rel="prev"><span class="meta-nav">Older Post</span><br/>${escapeHtml(prev.title)}</a></div>` 
            : '';
        const newerHtml = next 
            ? `<div class="nav-next"><a href="../${encodeURI(next.slug)}/" rel="next"><span class="meta-nav">Newer Post</span><br/>${escapeHtml(next.title)}</a></div>` 
            : '';
            
        if (olderHtml || newerHtml) {
            const navHtml = `<div class="nav-links">${olderHtml}${newerHtml}</div>`;
            $('#post-nav-placeholder').html(navHtml);
        } else {
            $('#post-nav-placeholder').remove();
        }

        await fs.writeFile(postPath, $.html(), 'utf8');
    }
}

// Generates sitemap.xml
async function generateSitemap() {
    console.log('Generating sitemap.xml...');
    const pages = [];
    
    async function walk(dir) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                await walk(fullPath);
            } else if (entry.name.endsWith('.html')) {
                let relPath = path.relative(DIST_DIR, fullPath).replace(/\\/g, '/');
                if (relPath.endsWith('index.html')) {
                    relPath = relPath.slice(0, -10);
                }
                pages.push(relPath);
            }
        }
    }

    await walk(DIST_DIR);
    
    const urls = pages.map(page => {
        const loc = `${SITE_URL}/${page}`;
        return `  <url>\n    <loc>${loc}</loc>\n    <changefreq>weekly</changefreq>\n  </url>`;
    }).join('\n');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    await fs.writeFile(path.join(DIST_DIR, 'sitemap.xml'), sitemap, 'utf8');
}

async function generateBlogArtifacts() {
    try {
        await generateBlogIndex();
        await generateRssFeed();
        await generateRecentPostsInclude();
        await injectPostNavigation();
    } catch (err) {
        console.error('Error generating blog index/RSS/Nav:', err);
    }
}

// Walk src to collect metadata
async function collectAllMetadata(dir = SRC_DIR) {
    if (!existsSync(dir)) return;
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(SRC_DIR, fullPath);
        if (entry.isDirectory()) {
            await collectAllMetadata(fullPath);
        } else if (entry.isFile()) {
            const slug = blogSlugFor(relativePath);
            const gallerySlug = gallerySlugFor(relativePath);
            if (!slug && !gallerySlug) continue;

            if (slug) {
                if (entry.name.endsWith('.html')) {
                    const content = await fs.readFile(fullPath, 'utf8');
                    collectHtmlPostMetadata(slug, content);
                } else if (entry.name.endsWith('.md')) {
                    const raw = await fs.readFile(fullPath, 'utf8');
                    const { data: frontmatter, content: markdownBody } = matter(raw);
                    if (frontmatter.title) {
                        const date = parseFrontmatterDate(frontmatter.date);
                        const description = frontmatter.description
                            || truncateText(cheerio.load(marked.parse(markdownBody))('p').first().text());
                        blogPosts.set(slug, { slug, title: frontmatter.title, date, description });
                    }
                }
            } else if (gallerySlug) {
                if (entry.name.endsWith('.html')) {
                    const content = await fs.readFile(fullPath, 'utf8');
                    collectHtmlGalleryMetadata(gallerySlug, content);
                } else if (entry.name.endsWith('.md')) {
                    const raw = await fs.readFile(fullPath, 'utf8');
                    const { data: frontmatter, content: markdownBody } = matter(raw);
                    if (frontmatter.title) {
                        const date = parseFrontmatterDate(frontmatter.date);
                        const description = frontmatter.description
                            || truncateText(cheerio.load(marked.parse(markdownBody))('p').first().text());
                        const cover = frontmatter.cover || cheerio.load(marked.parse(markdownBody))('img').first().attr('src') || '';
                        galleries.set(gallerySlug, { slug: gallerySlug, title: frontmatter.title, date, description, cover });
                    }
                }
            }
        }
    }
}

// Recursively compile everything
async function buildAll(dir = SRC_DIR) {
    if (!existsSync(dir)) return;
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            await buildAll(fullPath);
        } else if (entry.isFile()) {
            if (entry.name.endsWith('.html')) {
                await compileHtmlFile(fullPath);
            } else if (entry.name.endsWith('.md')) {
                await compileMarkdownFile(fullPath);
            } else {
                await copyAsset(fullPath);
            }
        }
    }
}

// Main
async function main() {
    const args = process.argv.slice(2);
    const isWatch = args.includes('--watch');

    await cleanDist();
    console.log('Building site...');
    
    await collectAllMetadata();
    await generateRecentPostsInclude();
    await buildAll();
    await generateBlogArtifacts();
    await generateGalleryIndex();
    await generateSitemap();
    
    console.log('Build complete.');

    if (isWatch) {
        console.log('\nWatching for changes in src/...\n');
        const watcher = chokidar.watch(SRC_DIR, {
            ignored: /(^|[\/\\])\../,
            persistent: true,
            ignoreInitial: true
        });

        watcher.on('all', async (event, filePath) => {
            const relativePath = path.relative(SRC_DIR, filePath);
            const parts = relativePath.split(path.sep);

            if (parts[0] === 'templates') {
                console.log(`\nTemplate changed (${relativePath}). Rebuilding all files...`);
                try {
                    await buildAll();
                    await generateBlogArtifacts();
                    console.log('Rebuild complete.');
                } catch (err) {
                    console.error('Rebuild failed:', err);
                }
                return;
            }

            if (parts[0] === 'skeletons') {
                return;
            }

            const isBlogPost = blogSlugFor(relativePath) !== null;

            if (event === 'add' || event === 'change') {
                try {
                    if (filePath.endsWith('.html')) {
                        await compileHtmlFile(filePath);
                    } else if (filePath.endsWith('.md')) {
                        await compileMarkdownFile(filePath);
                    } else {
                        if (filePath.endsWith('style.css')) {
                            console.log('style.css changed. Running CSS minifier...');
                            try {
                                const { stdout, stderr } = await execPromise('node minify.js');
                                if (stdout) console.log(stdout.trim());
                                if (stderr) console.error(stderr.trim());
                            } catch (minifyErr) {
                                console.error('Failed to run CSS minifier during watch:', minifyErr);
                            }
                        }
                        await copyAsset(filePath);
                    }
                    if (isBlogPost) {
                        await generateBlogArtifacts();
                    }
                    const isGallery = gallerySlugFor(relativePath) !== null;
                    if (isGallery) {
                        await generateGalleryIndex();
                    }
                } catch (err) {
                    console.error(`Error processing file ${relativePath}:`, err);
                }
            } else if (event === 'unlink') {
                const destRelative = relativePath.endsWith('.md')
                    ? relativePath.replace(/\.md$/, '.html')
                    : relativePath;
                const destPath = path.join(DIST_DIR, destRelative);
                try {
                    if (existsSync(destPath)) {
                        await fs.unlink(destPath);
                        console.log(`Deleted: ${destRelative}`);
                    }
                    if (isBlogPost) {
                        blogPosts.delete(blogSlugFor(relativePath));
                        await generateBlogArtifacts();
                    }
                    const gallerySlug = gallerySlugFor(relativePath);
                    if (gallerySlug) {
                        galleries.delete(gallerySlug);
                        await generateGalleryIndex();
                    }
                } catch (err) {
                    console.error(`Error deleting file ${relativePath}:`, err);
                }
            }
        });
    }
}

// Generate the gallery index
async function generateGalleryIndex() {
    if (galleries.size === 0) {
        return;
    }

    const templatePath = path.join(SRC_DIR, 'templates', 'gallery-index.html');
    if (!existsSync(templatePath)) {
        console.warn('Warning: src/templates/gallery-index.html not found; skipping gallery index generation.');
        return;
    }

    console.log('Generating gallery index...');
    await fs.rm(path.join(DIST_DIR, 'gallery', 'page'), { recursive: true, force: true });

    const sortedGalleries = [...galleries.values()].sort((a, b) => {
        if (!a.date && !b.date) return a.title.localeCompare(b.title);
        if (!a.date) return 1;
        if (!b.date) return -1;
        return b.date - a.date;
    });

    const pageCount = Math.max(1, Math.ceil(sortedGalleries.length / POSTS_PER_PAGE));
    const template = await fs.readFile(templatePath, 'utf8');

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
        const pageGalleries = sortedGalleries.slice((pageNum - 1) * POSTS_PER_PAGE, pageNum * POSTS_PER_PAGE);

        const isFirst = pageNum === 1;
        const destDirParts = isFirst ? ['gallery'] : ['gallery', 'page', String(pageNum)];
        const depth = destDirParts.length;
        const hrefPrefix = isFirst ? '' : '../../';

        const entries = pageGalleries.map(gallery => {
            const descriptionHtml = gallery.description
                ? `<p style="margin: 0.5rem 0 0; font-size: 0.8rem; opacity: 0.8; font-weight: normal;">${escapeHtml(gallery.description)}</p>`
                : '';
            const coverSrc = gallery.cover || `${hrefPrefix}images/gallery/sage-horizon.png`;
            return `        <div class="gallery-item">
            <a href="${hrefPrefix}${encodeURI(gallery.slug)}/">
                <img src="${coverSrc}" alt="${escapeHtml(gallery.title)}">
                <div class="gallery-caption">
                    <strong>${escapeHtml(gallery.title)}</strong>
                    ${descriptionHtml}
                </div>
            </a>
        </div>`;
        }).join('\n');

        const $ = cheerio.load(template);
        if (!isFirst) {
            $('title').text(`Gallery - Page ${pageNum} - ${SITE_TITLE}`);
        }
        $('#gallery-list').html('\n' + entries + '\n');

        // Navigation links (pagination)
        const olderHref = isFirst ? 'page/2/' : `../${pageNum + 1}/`;
        const newerHref = pageNum === 2 ? '../../' : `../${pageNum - 1}/`;
        const older = pageNum < pageCount
            ? `\n                            <div class="nav-previous"><a href="${olderHref}">Older galleries</a></div>`
            : '';
        const newer = !isFirst
            ? `\n                            <div class="nav-next"><a href="${newerHref}">Newer galleries</a></div>`
            : '';
        if (older || newer) {
            $('#gallery-list').after(`
                    <nav class="navigation paging-navigation" role="navigation" style="overflow: hidden; width: 100%; margin-top: 2rem;">
                        <h2 class="screen-reader-text">Gallery navigation</h2>
                        <div class="nav-links">${older}${newer}
                        </div>
                    </nav>`);
        }

        const virtualPath = path.join(SRC_DIR, ...destDirParts, 'index.html');
        let finalContent = await expandIncludes($.html(), virtualPath);

        if (depth > 0) {
            const $final = cheerio.load(finalContent);
            adjustDocumentLinks($final, depth);
            finalContent = $final.html();
        }

        const destPath = path.join(DIST_DIR, ...destDirParts, 'index.html');
        await fs.mkdir(path.dirname(destPath), { recursive: true });
        await fs.writeFile(destPath, finalContent, 'utf8');
    }

    console.log(`Gallery index generated: ${sortedGalleries.length} galleries across ${pageCount} page(s).`);
}

main().catch(err => {
    console.error('Fatal build error:', err);
    process.exit(1);
});
