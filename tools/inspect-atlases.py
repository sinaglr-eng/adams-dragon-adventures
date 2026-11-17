"""Read-only PNG inspection: write frame metadata, never alter image pixels.
Requires Pillow. Source images and their alpha channels stay untouched.
"""
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
jobs = json.loads((ROOT / 'art/generation-prompts.json').read_text(encoding='utf-8'))['jobs']
result = {}
reports = []

def split_near(target, radius, limit, score):
    candidates = range(max(1, int(target-radius)), min(limit-1, int(target+radius))+1)
    values = [(score(p), abs(p-target), p) for p in candidates]
    return min(values)[2]

for job in jobs:
    file = ROOT / f"art/source/{job['id']}.png"
    if not job['cells'] or not file.exists():
        continue
    image = Image.open(file).convert('RGBA')
    alpha = image.getchannel('A')
    width, height = image.size
    # Ignore near-invisible antialias haze; include substantive soft edges.
    visible = alpha.point(lambda value: 1 if value > 32 else 0)
    rows = [0]
    for index in range(1, job['rows']):
        target = index*height/job['rows']
        rows.append(split_near(target, height/job['rows']*.22, height,
            lambda y: sum(visible.crop((0,y,width,y+1)).tobytes())))
    rows.append(height)
    frames = []
    for row in range(job['rows']):
        top, bottom = rows[row:row+2]
        columns = [0]
        for index in range(1, job['cols']):
            target = index*width/job['cols']
            columns.append(split_near(target, width/job['cols']*.22, width,
                lambda x: sum(visible.crop((x,top,x+1,bottom)).tobytes())))
        columns.append(width)
        for col in range(job['cols']):
            cell_index = row*job['cols']+col
            if cell_index >= len(job['cells']):
                continue
            left, right = columns[col:col+2]
            frames.append({'x':left,'y':top,'w':right-left,'h':bottom-top})
    result[job['id']] = frames
    hist = alpha.histogram()
    reports.append({'id':job['id'],'width':width,'height':height,
        'transparentPercent':round(sum(hist[:10])*100/(width*height),2),
        'frameCount':len(frames),'rowSplits':rows})

(ROOT/'art/frame-overrides.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
(ROOT/'art/alpha-inspection.json').write_text(json.dumps(reports,indent=2)+'\n',encoding='utf-8')
print(json.dumps(reports,indent=2))
