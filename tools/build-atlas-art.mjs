import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
// New character revisions override runtime derivatives only. Original PNGs remain intact.
const manifest = JSON.parse(await readFile('art/atlas-manifest.json','utf8'));
for (const asset of manifest.assets) {
  const source = await readFile(asset.path);
  if (createHash('sha256').update(source).digest('hex') !== asset.sha256) throw Error(`Art source changed: ${asset.path}`);
  if (asset.frames) for (const frame of asset.frames) {
    const {x,y,w,h}=frame.rect;
    const crop=await sharp(source).extract({left:x,top:y,width:w,height:h}).png().toBuffer();
    await sharp(crop).trim({threshold:8}).resize({width:640,height:640,fit:'inside',withoutEnlargement:true}).webp({quality:88,alphaQuality:100}).toFile(`app/public/game-assets/art/${frame.id.replace('/','-')}.webp`);
  } else await sharp(source).resize({width:1600,withoutEnlargement:true}).webp({quality:88}).toFile(`app/public/game-assets/art/${asset.id}.webp`);
}
await writeFile('app/public/game-assets/art/atlas-art-version.json',JSON.stringify({version:2,assets:manifest.assets.map(a=>({id:a.id,sha256:a.sha256}))}));
