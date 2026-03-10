'use strict';

// This list is specialized for TC39. It may not make sense for your application.
const REPLACEMENTS = [
  [/\bsho(?:e|ot?)\b/gi, 'Shu'],
  [/\b(, )?u(h|m),?(?= |$)/gi, ''],
  [/\bIntel\b/gi, 'Intl'],
  [/\bagalya\b/gi, 'Igalia'],
  [/\bregalia\b/gi, 'Igalia'],
  [/\bgalia\b/gi, 'Igalia'],
  [/\begalia\b/gi, 'Igalia'],
  [/\bNan\b/gi, 'NaN'],
  [/\bFukara\b/gi, 'Ficarra'],
  [/\bMiner\b/gi, 'Minor'],
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
];

function makeReplacements(text) {
  for (let args of REPLACEMENTS) {
    text = text.replaceAll.apply(text, args);
  }
  return text;
}

// this is not a no-op: this file is going to be 'eval'd
makeReplacements;
