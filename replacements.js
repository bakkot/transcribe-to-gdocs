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
  [/\b(a )?sinc\b/gi, (text, a) => `${a == null ? '' : 'a'}sync`],
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
  [/\bequi\b/gi, 'Ecma'],
  [/\bagri\b/gi, 'Ecma'],
  [/\bekam\b/gi, 'Ecma'],
  [/\baqua\b/gi, 'Ecma'],
  [/\becmo\b/gi, 'Ecma'],
  [/\ba key\b/gi, 'Aki'],
  [/\bpearl\b/gi, 'Perl'],
  [/\bbaht\b/gi, 'bot'],
  [/\bmodel blocks\b/gi, 'module blocks'],
  [/\ba weight\b/gi, 'await'],
  [/\bof weight\b/gi, 'await'],
  [/\bacing\b/gi, 'async'],
  [/\bimplementation to find\b/gi, 'implementation-defined'],
  [/\bcue\b/gi, 'queue'],
  [/\bglobal this\b/gi, 'globalThis'],
  [/\bweek maps\b/gi, 'WeakMaps'],
  [/\bweek map\b/gi, 'WeakMap'],
  [/\btc39\b/g, 'TC39'],
  [/\bgarlics\b/gi, 'grawlix'],
  [/\bthrone\b/gi, 'thrown'],
  [/\bgarlic's\b/gi, 'grawlix'],
  [/\bclothes\b/gi, 'close'],
  [/\bdunder proto\b/gi, '__proto__'],
  [/\bbrand x\b/gi, 'brand checks'],
  [/\bbranch x\b/gi, 'brand checks'],
  [/\bspoof a bowl\b/gi, 'spoofable'],
  [/\baquifer to\b/gi, 'Ecma 402'],
  [/\baquifers are two\b/gi, 'Ecma 402'],
  [/\bEcho 402\b/gi, 'Ecma 402'],
  [/\bjays\b/gi, 'JS'],
  [/\bcldr\b/gi, 'CLDR'],
  [/\btempura\b/gi, 'Temporal'],
  [/\btg1\b/gi, 'TG1'],
  [/\bsighs\b/gi, 'size'],
  [/\binsole\b/gi, 'Intl'],
  [/\breg ex\b/gi, 'regex'],
  [/\bagalya\b/gi, 'Igalia'],
  [/\bregalia\b/gi, 'Igalia'],
  [/\bgalia\b/gi, 'Igalia'],
  [/\bbrows are\b/gi, 'browser'],
  [/\bThe Proposal\b/g, 'the proposal'],
  [/\bVAR\b/g, 'var'],
  [/\bturn aires\b/gi, 'ternaries'],
  [/\bVA\b/gi, 'V8'],
  [/\bgypsy\b/gi, 'Jitsi'],
  [/\biffy\b/gi, 'IIFE'],
  [/\btubal\b/gi, 'tuple'],
  [/\bBR\b/gi, 'PR'],
  [/\bbite\b/gi, 'byte'],
  [/\bbike\b/gi, 'byte'],
  [/\bQ\b/g, 'queue'],
  [/\bGlobal's\b/g, 'globals'],
  [/\bJulia\b/g, 'Yulia'],
  [/\bMalik\b/gi, 'malloc'],
  [/\bwaldemar\b/g, 'Waldemar'],
  [/\bsegment er\b/gi, 'segmenter'],
  [/\bgraphene\b/gi, 'grapheme'],
  [/\blip see\b/gi, 'libc'],
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
