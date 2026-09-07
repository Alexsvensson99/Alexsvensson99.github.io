import fs from 'node:fs';
import path from 'node:path';

export function loadGuides(root) {
  const directory = path.join(root, 'data');
  const files = fs.readdirSync(directory).filter(name => /^guides-[a-z0-9-]+\.json$/.test(name)).sort();
  const guides = files.flatMap(name => JSON.parse(fs.readFileSync(path.join(directory,name),'utf8')));
  if (!guides.length || new Set(guides.map(g=>g.slug)).size !== guides.length) throw new Error('Guide sources must have unique slugs and at least one guide');
  return guides;
}
