import sharp from 'sharp';
import {readFile,mkdir,cp,writeFile,access} from 'node:fs/promises';
const manifest=JSON.parse(await readFile('art/manifest.json','utf8'));
const out='app/public/game-assets'; await mkdir(out+'/art',{recursive:true});
// Published MP3s also serve as source assets for clean-checkout development.
try {await access('game-assets/audio');await cp('game-assets/audio',out+'/audio',{recursive:true});} catch(error) {if(error.code!=='ENOENT')throw error;}
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
for(const n of [192,512]) await sharp(out+'/art/family-adam.webp').resize(n,n,{fit:'contain',background:'#fff6de'}).png().toFile(`${out}/icon-${n}.png`);
console.log(`Runtime art: ${(bytes/1024/1024).toFixed(2)} MiB, source PNGs preserved.`);
