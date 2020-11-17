// This file is based in part on https://github.com/googleapis/nodejs-speech/blob/eafbadd3b22943dd1002c0f523f4d06d15bb9928/samples/infiniteStreaming.js

'use strict';

let fs = require('fs').promises;

let { Writable } = require('stream');
let recorder = require('node-record-lpcm16');
let speech = require('@google-cloud/speech').v1p1beta1;
let readline = require('readline');
let { google } = require('googleapis');

// TODO ask user to set this environment variable
// this holds the speech API credentials (should be an object with `"type": "service_account"`)
process.env.GOOGLE_APPLICATION_CREDENTIALS='./speech-service-account-key.json';

// this holds the docs API OAuth secret
const GDOCS_APPLICATION_SECRET_PATH = './gdocs-client-oauth-secret.json';

// oauth token will be cached here
const TOKEN_PATH = './GENERATED_TOKEN.json';



let delay = ms => new Promise(res => setTimeout(res, ms));

function ask(question) {
  let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise(res => {
    rl.question(question, id => {
      rl.close();
      res(id);
    });
  });
}


async function infiniteStream(append, {
  encoding = 'LINEAR16',
  sampleRateHertz = 16000,
  languageCode = 'en-US',
  streamingLimit = 29000/2,
} = {}) {

  let client = new speech.SpeechClient();

  let config = {
    encoding,
    sampleRateHertz,
    languageCode,
    enableAutomaticPunctuation: true,
    model: 'video', // NB this is 50% more expensive
  };

  let request = {
    config,
    interimResults: true,
  };

  let recognizeStream = null;
  let restartCounter = 0;
  let deferredChunks = [];

  function startStream() {
    recognizeStream = client
      .streamingRecognize(request)
      .on('error', err => {
        if (err.code === 11) {
          // restartStream();
        } else {
          console.error('API request error ' + err);
        }
      })
      .on('data', getSpeechCallback());

    setTimeout(restartStream, streamingLimit);
  }

  let activeQueueTimer = null;
  function getSpeechCallback() {
    // could we do this in a more clever way? yes. maybe we should eventually, but I don't care enough right now.
    let queue = [];
    let lock = false;
    let prev = '';
    activeQueueTimer = setInterval(async () => {
      if (queue.length === 0) {
        return;
      }
      if (lock) {
        return;
      }
      lock = true;

      let next = queue.shift();

      // Unfortunately the gdocs API's claimed `targetRevisionId` thing does not work at all, so we're stuck with just appending.
      // The speech API doesn't finalize until a long time in, but early stuff tends not to change.
      // So assume all but the last BUFFER characters can be committed. Sometimes this leads to weird typos, but it's worth it to have transcripts be more live.
      let BUFFER = 20;
      switch (next.type) {
        case 'init': {
          let text = next.text.substring(0, next.text.length - BUFFER);
          console.log('init', JSON.stringify(text));
          // await init(next.text);
          await append(text);
          prev = text;
          break;
        }
        case 'update': {
          let text = next.text.substring(0, next.text.length - BUFFER);
          console.log('update', JSON.stringify(text));
          // await update(next.text);
          await append(text.substring(prev.length));
          prev = text;

          break;
        }
        case 'finish': {
          console.log('finish', JSON.stringify(next.text));
          // await finish(next.text);
          await append(next.text.substring(prev.length));
          prev = '';
          break;
        }
      }

      lock = false;
    }, 1100);

    let shouldInit = true;
    return stream => {
      let stdoutText = '';
      if (stream.results[0].alternatives[0]) {
        stdoutText = stream.results[0].alternatives[0].transcript;
      }
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
            recognizeStream.write(chunk);
          }
          deferredChunks = [];
        }
        recognizeStream.write(chunk);
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


async function initGdocsClient(documentId) {
  let secret = await fs.readFile(GDOCS_APPLICATION_SECRET_PATH, 'utf8');
  let auth = await authorizeGdocsClient(JSON.parse(secret));

  const docs = google.docs({ version: 'v1', auth });

  try {
    // The API doesn't seem to expose permissions queries
    // So test for writing permissions by writing the empty string to the end of the document
    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [{
          insertText: {
            text: '',
            endOfSegmentLocation: {
              segmentId: '',
            },
          },
        }],
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
    if (text === '') {
      return;
    }
    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [{
          insertText: {
            text: makeReplacements(text),
            endOfSegmentLocation: {
              segmentId: '',
            },
          },
        }],
      },
    });
  };
};

const REPLACEMENTS = [
  [/\s+/g, ' '],
  [/ dot /gi, '.'],
  [/javascript/gi, 'JavaScript'],
  [/\bC[- ]sharp\b/gi, 'C#'], // Ron
  [/\b(a)ssessor\b/gi, (text, a) => `${a}ccessor`], // Ron
  [/\bsho(?:e|ot?)\b/gi, 'SYG'], // Shu
  [/\ba sink\b/gi, 'async'],
  [/\bsink\b/gi, 'sync'],
  [/\bDominic\b/g, 'Domenic'],
  [/\bapi(s)\b/g, (text, a) => `API${s}`],
]

function makeReplacements(text) {
  for (let args of REPLACEMENTS) {
    text = text.replaceAll.apply(text, args);
  }
  return text;
}

async function authorizeGdocsClient(credentials) {
  let { client_secret, client_id, redirect_uris } = credentials.installed;
  let oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  try {
    let token = await fs.readFile(TOKEN_PATH, 'utf8');
    oAuth2Client.setCredentials(JSON.parse(token));
  } catch {
    let authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/documents'],
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    let code = await ask('Enter the code from that page here: ');

    let token = (await oAuth2Client.getToken(code)).tokens;
    await fs.writeFile(TOKEN_PATH, JSON.stringify(token), 'utf8');
    oAuth2Client.setCredentials(token);
  }
  return oAuth2Client;
}

(async () => {
  let docId = await ask('Google Docs id: ');
  let append = await initGdocsClient(docId.trim());
  infiniteStream(append);  
})().catch(e => {
  console.error(e);
  process.exit(1);
});
