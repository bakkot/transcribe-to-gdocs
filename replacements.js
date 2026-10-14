'use strict';

// This list is specialized for TC39. It may not make sense for your application.
const REPLACEMENTS = [
  [/(?:\b(?:uh|um)\b[,\s]*)+(.)?/gi, (match, nextChar) => match[0] === 'U' && nextChar ? nextChar.toUpperCase() : (nextChar || '')],
  [/\bsho(?:e|ot?)\b/gi, 'Shu'],
  [/\bWadwick\b/gi, 'WHATWG'],
  [/\bIntel\b/gi, 'Intl'],
  [/\bbig int\b/gi, 'BigInt'],
  [/\btemporal\b/gi, 'Temporal'],
  [/\bsymbol(s)?\b/gi, 'Symbol$1'],
  [/\bpromise(s)?\b/gi, 'Promise$1'],
  [/\bproxy\b/gi, 'Proxy'],
  [/\bplain ?time\b/gi, 'PlainTime'],
  [/\bplain ?date\b/gi, 'PlainDate'],
  [/\btest262\b/gi, 'Test262'],
  [/\bagalya\b/gi, 'Igalia'],
  [/\bregalia\b/gi, 'Igalia'],
  [/\bgalia\b/gi, 'Igalia'],
  [/\begalia\b/gi, 'Igalia'],
  [/\bNan\b/gi, 'NaN'],
  [/\bFukara\b/gi, 'Ficarra'],
  [/\bPekara\b/gi, 'Ficarra'],
  [/\bMiner\b/gi, 'Minor'],
  [/\bValdemar\b/gi, 'Waldemar'],
  [/\bSemina\b/gi, 'Samina'],
  [/\bANBA\b/gi, 'Anba'],
  [/\bUPCERT\b/gi, 'Upsert'],
  [/\bNicola\b/gi, 'NRO'],
  [/\bNikola\b/gi, 'NRO'],
  [/\bMikkel\b/gi, 'Mikhail'],
  [/\bDom\b/gi, 'DOM'],
  [/\bDOM exception\b/gi, 'DOMException'],
  [/\bBuxton\b/gi, 'Buckton'],
  [/\btwo-string\b/gi, 'toString'],
  [/\bsealed yard\b/gi, 'CLDR'],
  [/\bemily\b/gi, 'EAO'],
  [/\boliviay\b/gi, 'OFR'],
  [/\bolivia\b/gi, 'OFR'],
  [/\bshared array buffer(s?)\b/gi, 'SharedArrayBuffer$1'],
  [/\barray buffer(s?)\b/gi, 'ArrayBuffer$1'],
  [/\btyped array(s?)\b/gi, 'TypedArray$1'],
  [/\bdata view(s?)\b/gi, 'DataView$1'],
  [/\babort controller(s?)\b/gi, 'AbortController$1'],
  [/\babort signal(s?)\b/gi, 'AbortSignal$1'],
  [/\bweak map(s?)\b/gi, 'WeakMap$1'],
  [/\bflat map\b/gi, 'flatMap'],
  [/\bShenzong\b/gi, 'CZW'],
  [/\bCheng Song\b/gi, 'CZW'],
  [/\bZhengzheng\b/gi, 'CZW'],
  [/\bwanna\b/gi, 'want to'],
  [/\bgonna\b/gi, 'going to'],
  [/\bkinda\b/gi, 'kind of'],
  [/\bSPIES\b/gi, 'spies'],
  [/\bSPIE\b/gi, 'spy'],
  [/\bcue\b/gi, 'queue'],
  [/\bdaytime\b/gi, 'datetime'],
  [/\brange error\b/gi, 'RangeError'],
  [/\btype error\b/gi, 'TypeError'],
  [/\bsyntax error\b/gi, 'SyntaxError'],
  [/\bmessage format\b/gi, 'MessageFormat'],
  [/\bvenable\b/gi, 'thenable'],
  [/\bmodible\b/gi, 'Moddable'],
  [/\bmodibles\b/gi, 'Moddable\'s'],
  [/, you know(,|\b)/gi, ','],
  [/, like(,|\b)/gi, ','],
  [/\b(and|but|the|in|a|if|of|their|my|this|is|are|how|or|I|I'll|I'm|we|we're|on|what|it|it's|and|to|just), \1(?:, \1)*\b/gi, '$1'],
];

// used to track whether we need to capitalize the next segment
let endsWithFiller = false;

let endsWithSpace = false;
function makeReplacements(text) {
  if (endsWithSpace && text[0] === ' ') {
    text = text.slice(1);
  }

  if (endsWithFiller) {
    let idx = 0;
    if (text[0] === ' ') {
      idx = 1;
    }
    if (/[a-z]/.test(text[idx] ?? '')) {
      text = ((idx === 1) ? ' ' : '') + text[idx].toUpperCase() + text.slice(idx + 1);
    }
  }
  endsWithFiller = /\bU[mh], ?$/.test(text);

  for (let args of REPLACEMENTS) {
    text = text.replaceAll.apply(text, args);
  }

  endsWithSpace = text.endsWith(' ');
  return text;
}

// this is not a no-op: this file is going to be 'eval'd
makeReplacements;
