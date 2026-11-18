import sharp from 'sharp';
import {readFile,mkdir,cp,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const manifest=JSON.parse(await readFile('art/manifest.json','utf8'));
const out='app/public/game-assets'; await mkdir(out+'/art',{recursive:true});
// Published MP3s also serve as source assets for clean-checkout development.
await mkdir(out+'/audio',{recursive:true});
const audioManifest=JSON.parse(await readFile('content/audio-batches/all.json','utf8'));
for (const clip of audioManifest) {
  const dest='app/public/'+clip.file;
  const valid=async path=>{try {return createHash('sha256').update(await readFile(path)).digest('hex')===clip.sha256;}catch(error){if(error.code==='ENOENT')return false;throw error;}};
  // Keep freshly generated audio when a previous release contains the same ID.
  if(await valid(dest))continue;
  if(!await valid(clip.file))throw Error('Missing verified audio source: '+clip.id);
  await cp(clip.file,dest);
}
let bytes=0;
for (const a of manifest.assets) {
  if(a.frames?.length) {
    for(const f of a.frames) {
      const {x,y,w,h}=f.rect;
      const crop=await sharp(a.path).extract({left:x,top:y,width:w,height:h}).png().toBuffer();
      const b=await sharp(crop).trim({threshold:8}).resize({width:640,height:640,fit:'inside',withoutEnlargement:true}).webp({quality:88,alphaQuality:100}).toBuffer();
      await writeFile(`${out}/art/${f.id.replace('/','-')}.webp`,b); bytes+=b.length;
    }
  } else {const b=await sharp(a.path).resize({width:1600,withoutEnlargement:true}).webp({quality:84}).toBuffer();await writeFile(`${out}/art/${a.id}.webp`,b);bytes+=b.length;}
}
await cp('art/ui',out+'/ui',{recursive:true});
await import('./build-atlas-art.mjs');
for(const n of [192,512]) await sharp(out+'/art/family-adam.webp').resize(n,n,{fit:'contain',background:'#fff6de'}).png().toFile(`${out}/icon-${n}.png`);
console.log(`Runtime art: ${(bytes/1024/1024).toFixed(2)} MiB, source PNGs preserved.`);
