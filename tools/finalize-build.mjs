import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const html=await readFile('dist/index.html','utf8');
const audioManifest=await readFile('content/audio-batches/all.json','utf8');
const hash=createHash('sha256').update(html).update(audioManifest).digest('hex').slice(0,12);
const sw=await readFile('dist/sw.js','utf8');await writeFile('dist/sw.js',sw.replace('dragon-adventures-v1',`dragon-adventures-${hash}`));
console.log(`Offline cache version ${hash}; only visited assets are cached.`);
