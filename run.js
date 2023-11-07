// This file is based in part on https://github.com/googleapis/nodejs-speech/blob/eafbadd3b22943dd1002c0f523f4d06d15bb9928/samples/infiniteStreaming.js

'use strict';

let fs = require('fs').promises;
let path = require('path');
let process = require('process');
let { readFileSync, writeFileSync } = require('fs');

let { Writable } = require('stream');
let recorder = require('node-record-lpcm16');
let speech = require('@google-cloud/speech').v2;
let { authenticate } = require('@google-cloud/local-auth');
let { google } = require('googleapis');

// TODO ask user to set this environment variable
// this holds the speech API credentials (should be an object with `"type": "service_account"`)
process.env.GOOGLE_APPLICATION_CREDENTIALS = './speech-service-account-key.json';

// this holds the docs API OAuth secret
// needs to be a full path for google's dumb authenticate code to work
const GDOCS_APPLICATION_SECRET_PATH = path.join(process.cwd(), '/gdocs-client-oauth-secret.json');

const appCreds = JSON.parse(readFileSync(GDOCS_APPLICATION_SECRET_PATH, 'utf8'));
const { project_id } = appCreds.installed;

// oauth token will be cached here
const TOKEN_PATH = './GENERATED_TOKEN.json';
const SCOPES = ['https://www.googleapis.com/auth/documents'];

async function infiniteStream(
  append,
  {
    sampleRateHertz = 16000,
    streamingLimit = 290_000 /* ms */, // no more than 300000 i.e. 5 minutes
    // streamingLimit = 60_000 /* ms */,
  } = {}
) {
  let client = new speech.SpeechClient();

  const recognitionConfig = {
    // autoDecodingConfig removes the need to specify audio encoding.
    // This field only needs to be present in the recognitionConfig
    autoDecodingConfig: {},
    languageCodes: ['en-US'],
    model: 'latest_long',
    features: {
      profanityFilter: true,
      enableAutomaticPunctuation: true,
    },
  };
  const streamingConfig = {
    config: recognitionConfig,
    streamingFeatures: {
      interimResults: true,
    },
  };

  const configRequest = {
    // default recognizer https://cloud.google.com/speech-to-text/v2/docs/recognizers#send_requests_without_recognizers
    recognizer: `projects/${project_id}/locations/global/recognizers/_`,
    streamingConfig: streamingConfig,
  };

  let recognizeStream = null;
  let restartCounter = 0;
  let deferredChunks = [];


  function startStream() {
    recognizeStream = client
      ._streamingRecognize() // yes, with the underscore, for some reason
      .on('error', err => {
        if (err.code === 11) {
          // restartStream();
        } else {
          console.log(err);
          console.error('API request error ' + err);
          process.exit(1);
        }
      })
      .on('data', getSpeechCallback());

    // https://github.com/GoogleCloudPlatform/nodejs-docs-samples/blob/main/speech/transcribeStreaming.v2.js#L68
    recognizeStream.write(configRequest);

    setTimeout(restartStream, streamingLimit);
  }

  let activeQueueTimer = null;
  function getSpeechCallback() {
    // could we do this in a more clever way? yes. maybe we should eventually, but I don't care enough right now.
    let queue = [];
    let lock = false;
    let prev = '';
    let prevSkip = 0;
    activeQueueTimer = setInterval(async () => {
      if (queue.length === 0) {
        return;
      }
      if (lock) {
        return;
      }
      lock = true;

      try {
        // Unfortunately the gdocs API's claimed `targetRevisionId` thing does not work at all, so we're stuck with just appending.
        let toAppend = '';
        for (let [index, next] of queue.entries()) {
          switch (next.type) {
            case 'init':
            case 'update': {
              if (next.type === 'init') {
                prevSkip = 0;
              }
              if (index < queue.length - 1) {
                break;
              }
              let words = next.text.split(' ');
              let text = words.slice(prevSkip);
              if (text.length == 0) {
                break;
              }
              prevSkip += text.length;
              text = ' ' + text.join(' ').trim();

              toAppend += text;

              break;
            }
            case 'finish': {
              let words = next.text.split(' ');
              let text = ' ' + words.slice(prevSkip).join(' ').trim();

              console.log('finish', JSON.stringify(next.text));

              toDisk(next.text);
              toAppend += text;
              prevSkip = 0;
              break;
            }
          }
        }
        queue = [];
        console.log('appending', JSON.stringify(toAppend));
        await append(toAppend);
      } finally {
        lock = false;
      }
    }, 1100);

    let shouldInit = true;
    return stream => {
      let stdoutText = '';
      if (stream.results[0].alternatives[0]) {
        stdoutText = stream.results[0].alternatives[0].transcript;
      }
      // console.log(require('util').inspect(stream.results, { depth: Infinity }));
      if (stream.results[0].isFinal) {
        queue.push({ type: 'finish', text: stdoutText });
        shouldInit = true;
      } else if (shouldInit) {
        queue.push({ type: 'init', text: stdoutText });
        shouldInit = false;
      } else {
        if (queue.length > 0 && queue[queue.length - 1].type === 'update') {
          queue[queue.length - 1].text = stdoutText;
        } else {
          queue.push({ type: 'update', text: stdoutText });
        }
      }
    };
  }

  let audioInputStreamTransform = new Writable({
    write(chunk, encoding, next) {
      if (recognizeStream) {
        if (deferredChunks.length > 0) {
          for (let chunk of deferredChunks) {
            // yes, it wants json+base64 data; no I don't know why
            recognizeStream.write({ audio: chunk.toString('base64') });
          }
          deferredChunks = [];
        }
        recognizeStream.write({ audio: chunk.toString('base64') });
      } else {
        deferredChunks.push(chunk);
      }

      next();
    },

    final() {
      if (recognizeStream) {
        recognizeStream.end();
      }
    },
  });

  function restartStream() {
    if (recognizeStream) {
      recognizeStream.end();
      let oldInterval = activeQueueTimer;
      setTimeout(() => clearInterval(oldInterval), 10000); // give it ten seconds to finish draining
      activeQueueTimer = null;
      recognizeStream = null;
    }

    restartCounter++;

    process.stdout.write(`### ${streamingLimit * restartCounter}: RESTARTING REQUEST\n`);

    startStream();
  }

  // Start recording and send the microphone input to the Speech API
  recorder
    .record({
      sampleRateHertz: sampleRateHertz,
      threshold: 0, // Silence threshold
      silence: 1000,
      keepSilence: true,
      recordProgram: 'rec', // Try also "arecord" or "sox"
    })
    .stream()
    .on('error', err => {
      console.error('Audio recording error ' + err);
    })
    .pipe(audioInputStreamTransform);

  console.log('');
  console.log('Listening, press Ctrl+C to stop.');
  console.log('=========================================================');

  startStream();
}

function toDisk(text) {
  let file = './backup.txt';
  let contents = '';
  try {
    // sync to avoid races with itself
    contents = readFileSync(file, 'utf8') + '\n';
  } catch {
    contents = '';
  }
  writeFileSync(file, contents + text, 'utf8');
}

let lastGoodReplacements = '';
let lastBadReplacements = '';
let fixup = text => text;

function reloadFixup() {
  let src = readFileSync('./replacements.js', 'utf8');
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

async function initGdocsClient(documentId) {
  let auth = await authorizeGdocsClient();

  const docs = google.docs({ version: 'v1', auth });

  try {
    // The API doesn't seem to expose permissions queries
    // So test for writing permissions by writing the empty string to the end of the document
    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              text: '',
              endOfSegmentLocation: {
                segmentId: '',
              },
            },
          },
        ],
      },
    });
  } catch (e) {
    if (!e.message.includes('Insert text requests must specify text to insert.')) {
      console.error('Failed to write to document - do you have sufficient permissions?');
      console.error('Message: ' + e.message);
      process.exit(1);
    }
  }

  return async text => {
    if (text.trim() === '') {
      return;
    }
    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              text: fixup(text),
              endOfSegmentLocation: {
                segmentId: '',
              },
            },
          },
        ],
      },
    });
  };
}

async function authorizeGdocsClient() {
  try {
    let token = await fs.readFile(TOKEN_PATH, 'utf8');
    return google.auth.fromJSON(JSON.parse(token));
  } catch {
    let client = await authenticate({
      scopes: SCOPES,
      keyfilePath: GDOCS_APPLICATION_SECRET_PATH,
    });
    if (!client.credentials) {
      throw new Error('could not auth: no credentials');
    }
    let key = appCreds.installed;
    await fs.writeFile(
      TOKEN_PATH,
      JSON.stringify({
        type: 'authorized_user',
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: client.credentials.refresh_token,
      }),
      'utf8'
    );

    return client;
  }
}

(async () => {
  if (process.argv.length < 3) {
    console.error('provide the doc ID as an argument');
    process.exit(1);
  }
  if (!reloadFixup()) {
    // if this happens once we're running we should tolerate it, but here we can afford to require it to work
    process.exit(1);
  }
  let docId = process.argv[2];
  let append = await initGdocsClient(docId.trim());

  // could we watch instead of polling? maybe, but whatever.
  setInterval(reloadFixup, 2000);
  infiniteStream(append);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
