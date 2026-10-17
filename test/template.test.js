import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './build-site.js';

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

test('package.json declares template version 2', () => {
    assert.deepEqual(pkg.vanillaGorilla, { templateVersion: 2 });
});

test('package.json declares the AGPL-3.0-or-later license', () => {
    assert.equal(pkg.license, 'AGPL-3.0-or-later');
});
