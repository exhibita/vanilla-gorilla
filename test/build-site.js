import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUILD_JS = path.join(ROOT, 'build.js');

// Build a throwaway site in a temp directory and return helpers to inspect it.
// pages maps a path relative to src/ to the file content.
// fullSrc copies the whole template src/; otherwise only templates/ and skeletons/ are copied.
export function buildSite(pages = {}, { fullSrc = false } = {}) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vg-test-'));
    const src = path.join(dir, 'src');
    const copy = sub => fs.cpSync(path.join(ROOT, 'src', sub), path.join(src, sub), { recursive: true });

    if (fullSrc) {
        copy('');
    } else {
        copy('templates');
        copy('skeletons');
    }

    for (const [relativePath, content] of Object.entries(pages)) {
        const file = path.join(src, relativePath);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, content, 'utf8');
    }

    const result = spawnSync(process.execPath, [BUILD_JS], { cwd: dir, encoding: 'utf8' });

    return {
        dir,
        status: result.status,
        output: `${result.stdout}${result.stderr}`,
        read: relativePath => fs.readFileSync(path.join(dir, 'dist', relativePath), 'utf8'),
        exists: relativePath => fs.existsSync(path.join(dir, 'dist', relativePath)),
        readSrc: relativePath => fs.readFileSync(path.join(src, relativePath), 'utf8'),
        cleanup: () => fs.rmSync(dir, { recursive: true, force: true })
    };
}
