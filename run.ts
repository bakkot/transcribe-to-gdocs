import fs from 'fs';
import path from 'path';
import process from 'process';
import { parseArgs } from 'node:util';
import { SonioxNodeClient, RealtimeUtteranceBuffer, type SttSessionConfig, type RealtimeResult } from '@soniox/node';

// @ts-expect-error
import recorder from 'node-record-lpcm16';

const KEY = fs.readFileSync(path.join(import.meta.dirname, './SONIOX_KEY.txt'), 'utf8').trim();

const client = new SonioxNodeClient({ api_key: KEY });

const config: SttSessionConfig = {
  model: 'stt-rt-v4',
  language_hints: ['en'],

  enable_language_identification: false,

  enable_speaker_diarization: true,

  context: {
    general: [
      { key: 'domain', value: 'Technical' },
      { key: 'topic', value: 'Specification of JavaScript' },
    ],
    terms: [],
  },

  enable_endpoint_detection: false,
  audio_format: 'auto',
  /*
  config.audio_format = 'pcm_s16le';
  config.sample_rate = 16000;
  config.num_channels = 1;
  */
};

// Render a single utterance as readable text.
// function renderUtterance(utterance) {
//   return utterance.segments
//     .map((segment) => {
//       const speaker = segment.speaker ? `Speaker ${segment.speaker}:` : '';
//       const isTranslation = segment.tokens[0]?.translation_status === 'translation';
//       const lang = segment.language ? `${isTranslation ? '[Translation] ' : ''}[${segment.language}]` : '';
//       return `${speaker} ${lang} ${segment.text.trimStart()}`;
//     })
//     .join('\n');
// }

// Create a real-time STT session.
const session = client.realtime.stt(config);

// Utterance buffer collects tokens and flushes complete utterances on endpoints.
// const buffer = new RealtimeUtteranceBuffer();


let buff = '';
function flush(text: string) {
  buff += text;
  const match = buff.match(/^(.*\s)(\S*)$/);
  if (match) {
    console.log(match[1]);
    buff = match[2];
  }
}

let speaker: string | undefined = '1';
session.on('result', (result: RealtimeResult) => {
  let res = '';
  for (let token of result.tokens) {
    if (token.is_final) {
      if (token.speaker !== speaker) {
        flush(res + '\n\n');
        speaker = token.speaker;
      }
      res += token.text;
    }
  }
  flush(res);
  // console.dir(result, { depth: Infinity });
  // buffer.addResult(result);
});


session.on('finished', () => {
  // Flush any remaining tokens after the session ends.
  // const utterance = buffer.markEndpoint();
  // if (utterance) {
  //   console.log(renderUtterance(utterance));
  // }
  console.log('Session finished.');
});

session.on('error', (err) => {
  console.error('Session error:', err);
});

// Connect to the Soniox realtime API.
console.log('Connecting to Soniox...');
await session.connect();
console.log('Session started.');


const recStream = recorder
  .record({
    sampleRateHertz: 16000,
    threshold: 0, // Silence threshold
    silence: 1000,
    keepSilence: true,
    recordProgram: 'rec', // Try also "arecord" or "sox"
  })
  .stream()
  .on('error', (err: any) => {
    console.error('Audio recording error ' + err);
  })


await session.sendStream(recStream);
