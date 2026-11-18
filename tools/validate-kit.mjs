import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const assert=(ok,msg)=>{if(!ok)throw Error(msg);};
const manifest=read('art/manifest.json');
const jobs=read('art/generation-prompts.json').jobs;
assert(manifest.assets.length===jobs.length,'Missing generated assets');
const artIds=new Set(manifest.assets.flatMap(a=>[a.id,...a.frames.map(f=>f.id)]));
for(const a of manifest.assets){assert(fs.existsSync(path.join(root,a.path)),`Missing ${a.path}`);for(const f of a.frames)assert(f.rect.x>=0&&f.rect.y>=0&&f.rect.x+f.rect.w<=a.width&&f.rect.y+f.rect.h<=a.height,`Out of bounds ${f.id}`);}
const {vocabulary}=read('content/vocabulary.json');
const {quests}=read('content/quests.json');
const {characters}=read('content/characters.json');
const {achievements}=read('content/achievements.json');
const lines=[...read('content/audio-script.json').lines,...read('content/story-audio.json').lines];
for(const [name,rows]of Object.entries({vocabulary,quests,characters,achievements,lines}))assert(new Set(rows.map(r=>r.id)).size===rows.length,`Duplicate ID in ${name}`);
const concepts=new Set(vocabulary.map(v=>v.id)),questIds=new Set(quests.map(q=>q.id)),audioIds=new Set(lines.map(l=>l.id));
for(const v of vocabulary){assert(artIds.has(v.art),`Missing art ${v.art}`);assert(v.enPronunciationCs?.trim(),`Missing Czech pronunciation guide ${v.id}`);for(const id of Object.values(v.audio))assert(audioIds.has(id),`Missing audio script ${id}`);}
for(const a of read('art/atlas-manifest.json').assets){assert(fs.existsSync(path.join(root,a.path)),`Missing ${a.path}`);for(const f of a.frames??[])assert(f.rect.x>=0&&f.rect.y>=0&&f.rect.x+f.rect.w<=a.width&&f.rect.y+f.rect.h<=a.height,`Out of bounds ${f.id}`);}
assert(characters.filter(c=>c.playable).length===1&&characters.find(c=>c.id==='adam').playable,'Only Adam can be playable');
assert(characters.find(c=>c.id==='romca').narrator,'Romca must narrate');
for(const q of quests){assert(artIds.has(q.background),`Missing scene ${q.background}`);for(const c of [...q.concepts,...(q.bonusConcepts??[])])assert(concepts.has(c),`Unknown concept ${c}`);for(const p of q.prerequisites)assert(questIds.has(p),`Unknown prerequisite ${p}`);for(const c of q.cast){const character=characters.find(x=>x.id===c);assert(character,`Unknown actor ${c}`);assert(character.allowedPhysicalRegions.includes(q.region),`Wrong region ${c}/${q.region}`);}assert(q.narrator==='romca',`Wrong narrator ${q.id}`);}
const seen=new Set(),visiting=new Set();function visit(id){if(seen.has(id))return;assert(!visiting.has(id),`Quest cycle ${id}`);visiting.add(id);for(const p of quests.find(q=>q.id===id).prerequisites)visit(p);visiting.delete(id);seen.add(id);}for(const q of quests)visit(q.id);
for(const a of achievements){assert(artIds.has(a.badge),`Missing badge ${a.id}`);assert(!a.realRewardEnabledByDefault,`Unapproved reward ${a.id}`);if(a.conditions.questId)assert(questIds.has(a.conditions.questId)||fs.existsSync(path.join(root,'content/quest-packs',a.conditions.questId+'.json')),`Unknown achievement quest ${a.id}`);}
console.log(`PASS: ${manifest.assets.length} source images, ${artIds.size} art IDs, ${manifest.icons.length} UI icons, ${vocabulary.length} concepts, ${quests.length} quests, ${characters.length} characters, ${achievements.length} achievements, ${lines.length} audio-script lines.`);
console.log('This validates the preparation kit, not game functionality or pronunciation.');
