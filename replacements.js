'use strict';

// This list is specialized for TC39. It may not make sense for your application.
const REPLACEMENTS = [
  [/(?:\b(?:uh|um)\b[,\s]*)+(.)?/gi, (match, nextChar) => match[0] === 'U' && nextChar ? nextChar.toUpperCase() : (nextChar || '')],
  [/\bsho(?:e|ot?)\b/gi, 'Shu'],
  [/\bIntel\b/gi, 'Intl'],
  [/\btemporal\b/gi, 'Temporal'],
  [/\bplain ?time\b/gi, 'PlainTime'],
  [/\bplain ?date\b/gi, 'PlainDate'],
  [/\btest262\b/gi, 'Test262'],
  [/\bagalya\b/gi, 'Igalia'],
  [/\bregalia\b/gi, 'Igalia'],
  [/\bgalia\b/gi, 'Igalia'],
  [/\begalia\b/gi, 'Igalia'],
  [/\bNan\b/gi, 'NaN'],
  [/\bFukara\b/gi, 'Ficarra'],
  [/\bMiner\b/gi, 'Minor'],
  [/\bValdemar\b/gi, 'Waldemar'],
  [/\bSemina\b/gi, 'Samina'],
  [/\bANBA\b/gi, 'Anba'],
  [/\bUPCERT\b/gi, 'Upsert'],
  [/\bNicola\b/gi, 'NRO'],
  [/\bMikkel\b/gi, 'Mikhail'],
  [/\bDom\b/gi, 'DOM'],
  [/\bBuxton\b/gi, 'Buckton'],
  [/\btwo-string\b/gi, 'toString'],
  [/\bsealed yard\b/gi, 'CLDR'],
  [/\bemily\b/gi, 'EAO'],
  [/\bshared array buffer\b/gi, 'SharedArrayBuffer'],
  [/\bshared array buffers\b/gi, 'SharedArrayBuffers'],
  [/\barray buffer\b/gi, 'ArrayBuffer'],
  [/\barray buffers\b/gi, 'ArrayBuffers'],
  [/\bShenzong\b/gi, 'CZW'],
  [/\bCheng Song\b/gi, 'CZW'],
];

function makeReplacements(text) {
  for (let args of REPLACEMENTS) {
    text = text.replaceAll.apply(text, args);
  }
  return text;
}

// this is not a no-op: this file is going to be 'eval'd
makeReplacements;
