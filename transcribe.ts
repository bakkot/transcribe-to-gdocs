import fs from 'fs';
import path from 'path';
import { SonioxNodeClient, type SttSessionConfig, type RealtimeResult } from '@soniox/node';

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
};

// mixes in logic for splitting speakers, etc, because I don't care
export async function transcribeMicrophone(callback: (text: string) => void) {
  const session = client.realtime.stt(config);

  let buff = '';
  function flush(text: string) {
    buff += text;
    if (buff == '') return;
    // console.log(JSON.stringify(buff));
    const match = buff.match(/^(.*[^A-Za-z0-9])([A-Za-z0-9]*)$/s);
    if (match) {
      callback(match[1]);
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
          res = '';
          speaker = token.speaker;
        }
        res += token.text;
      }
    }
    flush(res);
  });


  session.on('error', (err) => {
    console.error('Session error:', err);
    process.exit(1);
  });

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
    });

  await session.sendStream(recStream);
}
