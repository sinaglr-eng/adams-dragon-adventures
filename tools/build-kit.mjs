import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(import.meta.dirname, '..');
const read = p => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const write = (p, data) => { fs.mkdirSync(path.dirname(path.join(root,p)), {recursive:true}); fs.writeFileSync(path.join(root,p),data); };
const escape = s => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const icons = {
 play:'<path d="M25 17 48 32 25 47Z" fill="#F3BC4B"/>',
 pause:'<rect x="21" y="17" width="8" height="30" rx="3"/><rect x="37" y="17" width="8" height="30" rx="3"/>',
 speaker:'<path d="M13 26h10l12-10v32L23 38H13Z"/><path d="M42 24q9 8 0 16m5-23q16 15 0 30"/>',
 microphone:'<rect x="25" y="10" width="14" height="29" rx="7"/><path d="M18 29v3a14 14 0 0 0 28 0v-3M32 46v9m-9 0h18"/>',
 home:'<path d="m11 30 21-18 21 18M17 27v25h30V27M27 52V36h10v16"/>',
 atlas:'<path d="M32 17c-8-6-16-6-24-3v35c8-3 16-3 24 3 8-6 16-6 24-3V14c-8-3-16-3-24 3Zm0 0v35"/>',
 map:'<path d="m9 16 15-5 16 7 15-5v35l-15 5-16-7-15 5Zm15-5v35m16-28v35"/>',
 back:'<path d="m30 17-16 15 16 15M15 32h37"/>',
 next:'<path d="m34 17 16 15-16 15M49 32H12"/>',
 close:'<path d="m19 19 26 26m0-26L19 45"/>',
 check:'<path d="m14 33 12 12 25-27"/>',
 lock:'<rect x="17" y="28" width="30" height="25" rx="5"/><path d="M23 28v-9a9 9 0 0 1 18 0v9m-9 11v5"/>',
 star:'<path d="m32 9 7 15 17 2-13 12 4 17-15-9-15 9 4-17L8 26l17-2Z" fill="#F3BC4B"/>',
 heart:'<path d="M32 53 12 33C-1 18 20 3 32 20 44 3 65 18 52 33Z" fill="#E88668"/>',
 replay:'<path d="M14 25a20 20 0 1 1-1 18M14 11v14h14"/>',
 help:'<circle cx="32" cy="32" r="23"/><path d="M25 24a7 7 0 1 1 10 6c-3 2-3 4-3 7m0 9v1"/>',
 settings:'<circle cx="32" cy="32" r="9"/><path d="m27 9 10 0 2 8 7 4 8-2 5 9-6 6v8l-8 5-2 8H29l-2-8-7-4-8 2-5-9 6-6v-8l8-5Z"/>',
 gift:'<path d="M12 29h40v24H12Zm-3-10h46v10H9Zm23 0v34M32 19C7 19 20 1 32 19c25 0 12-18 0 0Z"/>',
 suitcase:'<rect x="9" y="22" width="46" height="31" rx="7"/><path d="M23 22v-9h18v9M20 22v31m24-31v31"/>',
 plane:'<path d="m32 6 5 21 18 12v7L36 38v13l6 5H22l6-5V38L9 46v-7l18-12Z"/>',
 fishing:'<path d="m13 53 29-39q7-5 10 2v26a7 7 0 0 1-14 0v-4m-9-1 8 8m-14-2 8 8"/>',
 bug:'<ellipse cx="32" cy="35" rx="13" ry="17"/><circle cx="32" cy="16" r="7"/><path d="M32 23v28M18 29l-8-6m8 14H8m11 8-9 6m36-22 8-6m-8 14h10m-11 8 9 6M27 10l-5-5m15 5 5-5"/>',
 bicycle:'<circle cx="15" cy="44" r="10"/><circle cx="49" cy="44" r="10"/><path d="m15 44 12-22 10 22H15m12-22h17l5 22M23 17h10m9-4h7l-5 9"/>',
 parent:'<circle cx="25" cy="18" r="9"/><circle cx="46" cy="31" r="6"/><path d="M8 52V41a17 17 0 0 1 34 0v11m-4 0v-9a8 8 0 0 1 16 0v9"/>',
 toycar:'<path d="m8 38 6-14h28l13 14v12H8Zm12-14 2 14h24L36 24M8 38h47"/><circle cx="18" cy="49" r="6" fill="#F3BC4B"/><circle cx="45" cy="49" r="6" fill="#F3BC4B"/>',
 cards:'<rect x="13" y="9" width="31" height="42" rx="5" transform="rotate(-10 28 30)"/><rect x="23" y="15" width="30" height="42" rx="5" fill="#FFF6DE"/><path d="m38 24 4 7 8 2-6 6v8l-6-4-7 4 1-8-6-6 8-2Z" fill="#F3BC4B"/>',
 snack:'<path d="M18 28c-13-8-15 14-5 23 8 7 14 6 19 2 5 4 11 5 19-2 10-9 8-31-5-23-5-4-9-4-14 0-5-4-9-4-14 0Z" fill="#E88668"/><path d="M32 27v-9c0-8 9-10 15-8-1 8-8 11-15 8"/>',
 soundoff:'<path d="M11 26h10l12-10v32L21 38H11Zm31 0 13 13m0-13L42 39"/>'
};
for(const [id,body] of Object.entries(icons))write(`art/ui/${id}.svg`,`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="#294438" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">${body}</svg>\n`);

const jobs=read('art/generation-prompts.json').jobs;
const overrides=fs.existsSync(path.join(root,'art/frame-overrides.json'))?read('art/frame-overrides.json'):{};
const assets=[];
for(const j of jobs){
 const p=`art/source/${j.id}.png`;
 if(!fs.existsSync(path.join(root,p)))continue;
 const bytes=fs.readFileSync(path.join(root,p));
 if(bytes.toString('hex',0,8)!=='89504e470d0a1a0a')throw Error(`Not PNG: ${p}`);
 const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
 const frames=j.cells.map((id,i)=>{
  const col=i%j.cols,row=Math.floor(i/j.cols);
  const nominalX=Math.round(col*width/j.cols),nominalY=Math.round(row*height/j.rows);
  const {x,y,w,h}=overrides[j.id]?.[i]??{x:nominalX,y:nominalY,w:Math.round((col+1)*width/j.cols)-nominalX,h:Math.round((row+1)*height/j.rows)-nominalY};
  const frame={id:`${j.id}/${id}`,name:id,rect:{x,y,w,h},pivot:{x:0.5,y:j.category==='characters'?0.94:0.5}};
  const wrapper=`art/frames/${j.id}.${id}.svg`;
  write(wrapper,`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}"><defs><clipPath id="cell"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath></defs><image clip-path="url(#cell)" href="../source/${j.id}.png" width="${width}" height="${height}"/></svg>\n`);
  return {...frame,previewWrapper:wrapper};
 });
 assets.push({id:j.id,path:p,category:j.category,width,height,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),alphaRequested:j.transparent,grid:{cols:j.cols,rows:j.rows},frames,animation:j.id==='adam-poses'?'Discrete poses; tween/crossfade, not a frame cycle':'Static artwork; animate at runtime'});
}
const manifest={schemaVersion:1,title:'Adamovy dračí výpravy',generatedWith:'built-in image_gen',notes:['Original PNGs preserved; wrapper SVGs only reference source rectangles.','Frames must be used with clipping; preserve alpha.','Family scale differs by age; set actor display height per character.','No audio or gameplay implementation included.'],assets,icons:Object.keys(icons).map(id=>({id,path:`art/ui/${id}.svg`}))};
write('art/manifest.json',JSON.stringify(manifest,null,2)+'\n');
const sprite= (a,f)=>`<svg viewBox="${f.rect.x} ${f.rect.y} ${f.rect.w} ${f.rect.h}" aria-label="${escape(f.name)}" role="img"><defs><clipPath id="clip-${a.id}-${f.name}"><rect x="${f.rect.x}" y="${f.rect.y}" width="${f.rect.w}" height="${f.rect.h}"/></clipPath></defs><image clip-path="url(#clip-${a.id}-${f.name})" href="source/${a.id}.png" width="${a.width}" height="${a.height}"/></svg>`;
const sections=assets.map(a=>`<section id="${a.id}"><h2>${escape(a.id)}</h2><p>${a.width} × ${a.height} · ${(a.bytes/1048576).toFixed(2)} MB · ${a.frames.length?`${a.frames.length} samostatných políček`:'samostatné prostředí / ilustrace'}</p>${a.frames.length?`<div class="grid">${a.frames.map(f=>`<figure><div class="sprite">${sprite(a,f)}</div><figcaption>${escape(f.id)}</figcaption></figure>`).join('')}</div>`:`<img class="wide" src="source/${a.id}.png" alt="${escape(a.id)}" loading="lazy">`}</section>`).join('');
write('art/catalog.html',`<!doctype html><html lang="cs"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Adamovy dračí výpravy — grafický katalog</title><style>*{box-sizing:border-box}body{margin:0;background:#fff6de;color:#294438;font:16px/1.6 system-ui,sans-serif}header{padding:56px max(5vw,20px);background:#294438;color:#fff6de}h1{font-size:clamp(30px,4vw,58px);line-height:1.1;margin:0 0 16px}main{max-width:1400px;padding:24px;margin:auto}nav{display:flex;flex-wrap:wrap;gap:10px;margin:24px 0}a{color:inherit}nav a{padding:8px 14px;background:#f3bc4b;border-radius:18px;text-decoration:none}section{margin:48px 0;scroll-margin-top:20px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:18px}figure{margin:0;border:1px solid #dccaa2;border-radius:24px;overflow:hidden;background:#fffdf4}.sprite{height:270px;padding:12px;background:linear-gradient(135deg,#dce9d9,#fcf1cb)}.sprite svg{width:100%;height:100%}figcaption{padding:10px;text-align:center;font-size:13px}.wide{width:100%;border-radius:24px;display:block}.icons{display:flex;flex-wrap:wrap;gap:12px}.icon{width:105px;padding:10px;text-align:center;border:1px solid #dccaa2;border-radius:18px}.icon img{width:52px;height:52px;display:block;margin:auto}.notice{padding:16px;background:#e7eedc;border-radius:16px}footer{padding:30px;text-align:center}button{font:inherit}</style><header><h1>Adamovy dračí výpravy</h1><p>Grafická sada pro první vydání · Adam / Iowa / Příbram / dračí rodina</p></header><main><p class="notice">Toto je katalog grafických podkladů, nikoli implementovaná hra. Ilustrace jsou statické; animace a interakce jsou popsané v zadání. Texty, slova a herní název se při implementaci přidávají živě.</p><nav>${assets.map(a=>`<a href="#${a.id}">${a.id}</a>`).join('')}<a href="#icons">UI ikony</a></nav>${sections}<section id="icons"><h2>Ovládací ikony</h2><div class="icons">${Object.keys(icons).map(id=>`<div class="icon"><img src="ui/${id}.svg" alt=""><small>${id}</small></div>`).join('')}</div></section></main><footer>Original artwork · image_gen · připraveno pro implementaci</footer></html>`);
console.log(JSON.stringify({sourceImages:assets.length,frames:assets.reduce((n,a)=>n+a.frames.length,0),icons:Object.keys(icons).length},null,2));
