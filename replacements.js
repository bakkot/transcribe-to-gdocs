'use strict';

// This list is specialized for TC39. It may not make sense for your application.
const REPLACEMENTS = [
  [/\s+/g, ' '],
  [/ dot /gi, '.'],
  [/javascript/gi, 'JavaScript'],
  [/\bc[- ]sharp\b/gi, 'C#'],
  [/\b(a)ssessor\b/gi, (text, a) => `${a}ccessor`],
  [/\b(a)ssessors\b/gi, (text, a) => `${a}ccessors`],
  [/\bsho(?:e|ot?)\b/gi, 'Shu'],
  [/\b(a )?sink\b/gi, (text, a) => `${a == null ? '' : 'a'}sync`],
  [/\bdominic\b/gi, 'Domenic'],
  [/\bapi(s)\b/g, (text, s) => `API${s}`],
  [/\bequal system(s)\b/g, (text, s) => `ecosystem${s}`],
  [/\bdome?\b/gi, 'DOM'],
  [/\b(jazz|jessie|jace)\b/gi, 'JS'],
  [/\beconomic\b/gi, 'ergonomic'],
  [/\bjason\b/gi, 'JSON'],
  [/\bJson\b/gi, 'JSON'],
  [/\bmind types\b/gi, 'mime types'],
  [/\bimmune ability\b/gi, 'immutability'],
  [/\bthe temple\b/gi, 'Temporal'],
  [/\btemple\b/gi, 'Temporal'],
  [/\bIntel\b/gi, 'Intl'],
  [/\bacma\b/gi, 'Ecma'],
];

if (typeof ''.replaceAll !== 'function') {
  throw new Error(
    'Your version of node is too old to support replaceAll; please use a more recent version'
  );
}

function makeReplacements(text) {
  for (let args of REPLACEMENTS) {
    text = text.replaceAll.apply(text, args);
  }
  return text;
}

// this is not a no-op: this file is going to be 'eval'd
makeReplacements;
