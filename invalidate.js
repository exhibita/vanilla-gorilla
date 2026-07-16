import { spawnSync } from 'child_process';
import fs from 'fs';

// CDN Cache Invalidation utility for Vanilla Gorilla.
// To configure, set these variables or define them in a local config.json.
let DISTRIBUTION_ID = 'YOUR_CLOUDFRONT_DISTRIBUTION_ID'; 
let DEFAULT_PROFILE = 'default';

// Load config.json if it exists
try {
    if (fs.existsSync('./config.json')) {
        const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
        if (config.distributionId) DISTRIBUTION_ID = config.distributionId;
        if (config.awsProfile) DEFAULT_PROFILE = config.awsProfile;
    }
} catch (err) {
    // Ignore config errors here
}

function usage() {
    console.error('\nUsage: npm run invalidate -- <all | page-or-file ...> [dryrun]');
    console.error('\nExamples:');
    console.error('  npm run invalidate -- all                       # entire site (/*)');
    console.error('  npm run invalidate -- blog/my-post              # one page');
    console.error('  npm run invalidate -- blog/ css/style.min.css   # multiple targets');
    console.error('  npm run invalidate -- dryrun blog/my-post       # preview only');
    process.exit(1);
}

// Convert a path into index-ready CloudFront paths
function pathsFor(target) {
    let p = target.trim().replace(/\\/g, '/');
    if (!p.startsWith('/')) p = '/' + p;

    if (p.includes('*')) return [p]; // Wildcard pass-through

    const lastSegment = p.split('/').pop();
    if (lastSegment.includes('.')) return [p]; // A direct file

    if (!p.endsWith('/')) p += '/';
    return [p, p + 'index.html']; // Check both formats to clear router cache
}

const rawArgs = process.argv.slice(2);
const dryRun = rawArgs.includes('dryrun');
const targets = rawArgs.filter(a => a !== 'dryrun');

if (targets.length === 0) usage();

if (DISTRIBUTION_ID === 'YOUR_CLOUDFRONT_DISTRIBUTION_ID') {
    console.warn('\n=============================================================');
    console.warn('WARNING: CloudFront Distribution ID has not been configured.');
    console.warn('Please update config.json with your specific credentials:');
    console.warn('{\n  "distributionId": "E123456789ABCD",\n  "awsProfile": "my-aws-profile"\n}');
    console.warn('=============================================================\n');
    if (!dryRun) {
        process.exit(1);
    }
}

const paths = targets.some(t => t.trim().toLowerCase() === 'all')
    ? ['/*']
    : [...new Set(targets.flatMap(pathsFor))];

console.log('Paths to invalidate:');
for (const p of paths) console.log(`  ${p}`);

if (dryRun) {
    console.log('\nDry run: no invalidation created.');
    process.exit(0);
}

const awsArgs = [
    'cloudfront', 'create-invalidation',
    '--distribution-id', DISTRIBUTION_ID,
    '--paths', ...paths,
    '--output', 'json'
];
if (!process.env.AWS_PROFILE) {
    awsArgs.push('--profile', DEFAULT_PROFILE);
}

console.log(`Creating AWS CloudFront invalidation for distribution ${DISTRIBUTION_ID}...`);
const result = spawnSync('aws', awsArgs, { encoding: 'utf8' });

if (result.error) {
    console.error(`\nFailed to run the AWS CLI: ${result.error.message}`);
    console.error('Is the AWS CLI installed, configured, and on your PATH?');
    process.exit(1);
}
if (result.status !== 0) {
    console.error(`\nAWS CLI exited with status ${result.status}:`);
    console.error(result.stderr || result.stdout);
    process.exit(result.status ?? 1);
}

const invalidation = JSON.parse(result.stdout).Invalidation;
console.log(`\nInvalidation created: ${invalidation.Id} (status: ${invalidation.Status})`);
console.log('Propagation typically completes in 1-5 minutes.');
