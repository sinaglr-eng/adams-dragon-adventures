import {cp,readFile,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(); const target=path.resolve('game-assets');
if(path.dirname(target)!==root || path.basename(target)!=='game-assets') throw Error('Unsafe output path');
await rm(target,{recursive:true,force:true});
await cp('dist/game-assets',target,{recursive:true});
for(const f of ['index.html','manifest.webmanifest','sw.js']) await cp('dist/'+f,f);
await writeFile('.nojekyll','');
console.log('Published build prepared in repository root for existing GitHub Pages branch.');
