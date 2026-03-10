import fs from 'node:fs';

let lastGoodReplacements = '';
let lastBadReplacements = '';
export let fixup = (x: string) => x;
function reloadFixup() {
  let src = fs.readFileSync('./replacements.js', 'utf8');
  if (src === lastGoodReplacements || src === lastBadReplacements) {
    return true;
  }
  try {
    let newFixup = (0, eval)(src);
    if (typeof newFixup !== 'function') {
      lastBadReplacements = src;
      console.error(`Failed to load replacements.js: expecting function, got ${typeof newFixup}`);
      return false;
    }
    fixup = newFixup;
    lastGoodReplacements = src;
    console.log('(reloaded replacements.js)');
    return true;
  } catch (e) {
    lastBadReplacements = src;
    console.error(`Failed to load replacements.js: error evaling file`);
    console.error(e);
    return false;
  }
}

if (!reloadFixup()) {
  // if this happens once we're running we should tolerate it, but here we can afford to require it to work
  throw new Error('failed to load replacements');
}
setInterval(reloadFixup, 2000);
