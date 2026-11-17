import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const jobs=JSON.parse(await readFile(process.argv[2],'utf8'));
const out='app/public/game-assets/audio';await mkdir(out,{recursive:true});
let cursor=0;const results=[];
async function worker(){while(cursor<jobs.length){const j=jobs[cursor++];const r=await fetch(j.url);if(!r.ok)throw Error(`${j.id}: HTTP ${r.status}`);const b=Buffer.from(await r.arrayBuffer());if(b.length<300)throw Error('Empty audio: '+j.id);await writeFile(`${out}/${j.id}.mp3`,b);results.push({id:j.id,file:`game-assets/audio/${j.id}.mp3`,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex'),duration:j.duration,generationId:j.generationId,status:'generated-awaiting-adult-review'});}}
await Promise.all([worker(),worker(),worker()]);
await mkdir('content/audio-batches',{recursive:true});await writeFile(`content/audio-batches/${process.argv[3]??'batch'}.json`,JSON.stringify(results,null,2)+'\n');console.log(`Saved ${results.length} clips.`);
