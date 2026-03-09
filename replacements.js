'use strict';

// This list is specialized for TC39. It may not make sense for your application.
const REPLACEMENTS = [
  [/\bsho(?:e|ot?)\b/gi, 'Shu'],
  [/\b(, )?u(h|m),?\b/gi, ''],
  [/\bIntel\b/gi, 'Intl'],
  [/\bagalya\b/gi, 'Igalia'],
  [/\bregalia\b/gi, 'Igalia'],
  [/\bgalia\b/gi, 'Igalia'],
  [/\begalia\b/gi, 'Igalia'],
  [/\bNan\b/gi, 'NaN'],
];

function makeReplacements(text) {
  for (let args of REPLACEMENTS) {
    text = text.replaceAll.apply(text, args);
  }
  return text;
}

// this is not a no-op: this file is going to be 'eval'd
makeReplacements;
