import {copyFile, cp, mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const output = join(projectRoot, 'public');
await mkdir(output, {recursive: true});

const files = [
    'index.html',
    'boot.min.js',
    'theme-init.js',
    'script.min.js',
    'style.min.css',
    'Icon.png',
    'Icon-256.png',
    'Icon-256.webp'
];
await Promise.all(files.map(file => copyFile(join(projectRoot, file), join(output, file))));
await cp(join(projectRoot, 'assets'), join(output, 'assets'), {recursive: true, force: true});
