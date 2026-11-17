import {readFile,readdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const script=await json('content/audio-script.json'),lines=await json('content/game-lines.json');
const expected=[...script.lines.map(l=>l.id),...(await json('content/story-audio.json')).lines.map(l=>l.id),...Object.keys(lines).flatMap(id=>['cs','en'].map(l=>`game.${id}.${l}`))];
const audio=await json('content/audio-batches/all.json');
for(const id of expected){const entry=audio.find(a=>a.id===id);if(!entry)throw Error('Missing audio '+id);const file=await readFile('app/public/'+entry.file);if(createHash('sha256').update(file).digest('hex')!==entry.sha256)throw Error('Audio hash mismatch '+id);if(entry.duration<=0||entry.bytes<300)throw Error('Empty audio '+id);}
const art=await json('art/manifest.json');for(const a of art.assets){for(const id of a.frames?.length?a.frames.map(f=>f.id.replace('/','-')):[a.id]){await stat(`app/public/game-assets/art/${id}.webp`);}}
console.log(`PASS: ${expected.length} actual MP3 clips with hashes/durations, all runtime art derivatives present.`);
console.log('Audio is synthesized. Native-speaking adult review and physical iPad Safari verification remain manual checks.');
