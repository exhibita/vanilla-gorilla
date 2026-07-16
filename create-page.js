import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import * as cheerio from 'cheerio';

// Derive a starter title from the target directory slug: "my-new-post" -> "My New Post"
function titleFromSlug(slug) {
    return slug
        .split(/[-_]+/)
        .filter(Boolean)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

async function main() {
    const rawArgs = process.argv.slice(2);
    // Bare "--" gets stripped by PowerShell before npm runs, so we filter it out if present
    const asMarkdown = rawArgs.includes('--md');
    const args = rawArgs.filter(a => a !== '--md');

    // Dynamic skeleton detection
    const skeletonsDir = path.join('src', 'skeletons');
    let skeletonMap = {};
    
    // Ensure skeletons directory exists
    if (!existsSync(skeletonsDir)) {
        await fs.mkdir(skeletonsDir, { recursive: true });
    }

    try {
        const files = await fs.readdir(skeletonsDir);
        for (const file of files) {
            if (file.endsWith('-skeleton.html')) {
                const name = file.replace('-skeleton.html', '');
                skeletonMap[name.toLowerCase()] = path.join(skeletonsDir, file);
            }
        }
    } catch (err) {
        console.error(`Error reading skeletons directory: ${err.message}`);
        process.exit(1);
    }
    
    if (args.length < 2) {
        console.error('\nError: Missing arguments.');
        console.error('Usage (HTML page):     npm run create-page -- <skeleton-type> <target-path-relative-to-src>');
        console.error('Usage (Markdown page): npm run create-md -- <skeleton-type> <target-path-relative-to-src>');
        console.error(`Available skeleton types: ${Object.keys(skeletonMap).join(', ') || '(None found yet - run build first)'}`);
        console.error('\nExample (HTML page): npm run create-page -- blog blog/my-new-post');
        console.error('Example (Markdown page): npm run create-md -- blog blog/my-new-post');
        process.exit(1);
    }
    
    const skeletonType = args[0].toLowerCase();
    const rawTargetPath = args[1];
    
    const skeletonFile = skeletonMap[skeletonType];
    if (!skeletonFile) {
        console.error(`\nError: Skeleton type "${skeletonType}" not found.`);
        console.error(`Available skeleton types: ${Object.keys(skeletonMap).join(', ')}\n`);
        process.exit(1);
    }
    
    // Normalize target path: must live under src/ and end with index.html / index.md
    let targetPath = rawTargetPath;
    targetPath = targetPath.replace(/^(\.\/)?src\//, '');
    targetPath = path.join('src', targetPath);

    const targetExt = asMarkdown ? '.md' : '.html';
    if (!targetPath.endsWith(targetExt)) {
        targetPath = path.join(targetPath, `index${targetExt}`);
    }
    
    const absoluteTargetPath = path.resolve(targetPath);
    const absoluteSrcPath = path.resolve('src');
    
    if (!absoluteTargetPath.startsWith(absoluteSrcPath)) {
        console.error(`\nError: Target path must be within the "src/" directory.\n`);
        process.exit(1);
    }
    
    if (existsSync(targetPath)) {
        console.error(`\nError: Target file already exists at ${targetPath}. Will not overwrite.\n`);
        process.exit(1);
    }

    if (asMarkdown) {
        // A sibling index.html would shadow the markdown file at build time
        const siblingHtml = targetPath.replace(/\.md$/, '.html');
        if (existsSync(siblingHtml)) {
            console.error(`\nError: ${siblingHtml} already exists and would shadow the markdown page.\n`);
            process.exit(1);
        }

        const slug = path.basename(targetPath) === 'index.md'
            ? path.basename(path.dirname(targetPath))
            : path.basename(targetPath, '.md');
        const today = new Date().toISOString().slice(0, 10);
        const skeletonLine = skeletonType === 'blog' ? '' : `skeleton: ${skeletonType}\n`;

        const stub = `---
title: ${titleFromSlug(slug)}
date: ${today}
description: Write a brief description here.
${skeletonLine}---

Write your post content here in Markdown...
`;

        console.log(`Creating new Markdown page (skeleton "${skeletonType}" applied at build time)...`);
        console.log(`Target Location: ${targetPath}`);

        await fs.mkdir(path.dirname(targetPath), { recursive: true });
        await fs.writeFile(targetPath, stub, 'utf8');
        console.log(`Successfully created page at: ${targetPath}`);
        return;
    }

    console.log(`Creating new page from "${skeletonType}" skeleton...`);
    console.log(`Skeleton Source: ${skeletonFile}`);
    console.log(`Target Location: ${targetPath}`);
    
    // Read skeleton content
    const content = await fs.readFile(skeletonFile, 'utf8');
    
    // Calculate nesting depth
    const relativeToSrc = path.relative('src', targetPath);
    const parts = relativeToSrc.split(path.sep);
    const depth = parts.length - 1;
    
    const prefix = depth === 0 ? './' : '../'.repeat(depth);
    console.log(`Target nesting depth: ${depth} (using relative prefix: "${prefix}")`);
    
    // Load with cheerio to adjust links
    const $ = cheerio.load(content);
    
    $('*').each((_, el) => {
        const attribs = el.attribs;
        if (!attribs) return;
        for (const attr of Object.keys(attribs)) {
            const val = attribs[attr];
            if (val) {
                if (val.startsWith('./')) {
                    const adjustedVal = val.replace(/^\.\//, prefix);
                    $(el).attr(attr, adjustedVal);
                } else if (attr === 'style') {
                    const adjustedVal = val.replace(/url\((['"]?)\.\//g, `url($1${prefix}`);
                    $(el).attr(attr, adjustedVal);
                }
            }
        }
    });
    
    // Update links inside style tags
    $('style').each((_, el) => {
        let css = $(el).text();
        css = css.replace(/url\((['"]?)\.\//g, `url($1${prefix}`);
        $(el).text(css);
    });
    
    const modifiedContent = $.html();
    
    // Ensure parent directory exists
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    
    // Write modified file
    await fs.writeFile(targetPath, modifiedContent, 'utf8');
    console.log(`Successfully created page at: ${targetPath}`);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
