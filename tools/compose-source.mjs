import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { sourceManifest } from './source-manifest.mjs';

const root = process.cwd();
const checkOnly = process.argv.includes('--check');
let hasMismatch = false;

for (const entry of sourceManifest) {
    const fragments = await Promise.all(
        entry.files.map(file => readFile(path.join(root, file), 'utf8')),
    );
    const composed = fragments.join('');
    const outputPath = path.join(root, entry.output);
    const current = await readFile(outputPath, 'utf8').catch(() => '');

    // Source checkouts can mix LF and CRLF on Windows. Preserve the tracked
    // output when its content is otherwise identical.
    if (current.replace(/\r\n/g, '\n') === composed.replace(/\r\n/g, '\n')) {
        console.log(`${entry.output}: up to date`);
        continue;
    }

    if (checkOnly) {
        hasMismatch = true;
        console.error(`${entry.output}: generated file is out of date`);
        continue;
    }

    await writeFile(outputPath, composed, 'utf8');
    console.log(`${entry.output}: composed from ${entry.files.length} source files`);
}

if (hasMismatch) process.exitCode = 1;
