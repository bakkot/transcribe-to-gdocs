import path from 'node:path';
import fs from 'node:fs';

import { authenticate } from '@google-cloud/local-auth';
import { OAuth2Client, type Credentials } from 'google-auth-library';
import { google } from 'googleapis';

// this holds the docs API OAuth secret
// needs to be a full path for google's dumb authenticate code to work
const GDOCS_APPLICATION_SECRET_PATH = path.join(import.meta.dirname, 'gdocs-client-oauth-secret.json');

const appCreds = JSON.parse(fs.readFileSync(GDOCS_APPLICATION_SECRET_PATH, 'utf8')) as {
  installed: {
    client_id: string,
    client_secret: string,
    redirect_uris: string[],
  }
};

// oauth token will be cached here
const TOKEN_PATH = path.join(import.meta.dirname, 'GENERATED_TOKEN.json');
const SCOPES = ['https://www.googleapis.com/auth/documents'];

let lastGoodReplacements = '';
let lastBadReplacements = '';
let fixup = (x: string) => x;
function reloadFixup() {
  let src = fs.readFileSync('./replacements.js', 'utf8');
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

async function authorizeGdocsClient() {
  try {
    let credentials = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8')) as Credentials;
    let client = new OAuth2Client({
      clientId: appCreds.installed.client_id,
      clientSecret: appCreds.installed.client_secret,
    });
    client.credentials = credentials;

    // confirm it this actually works before returning
    await client.getAccessToken();
    return client;
  } catch {
    let client = await authenticate({
      scopes: SCOPES,
      keyfilePath: GDOCS_APPLICATION_SECRET_PATH,
    });
    if (!client.credentials) {
      throw new Error('could not auth: no credentials');
    }
    fs.writeFileSync(
      TOKEN_PATH,
      JSON.stringify(client.credentials),
      'utf8'
    );

    return client;
  }
}

export async function initGdocsClient(documentId: string) {
  if (!reloadFixup()) {
    // if this happens once we're running we should tolerate it, but here we can afford to require it to work
    throw new Error('failed to load replacements');
  }
  setInterval(reloadFixup, 2000);
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
  } catch (e: any) {
    if (!e.message.includes('Insert text requests must specify text to insert.')) {
      console.error('Failed to write to document - do you have sufficient permissions?');
      console.error('Message: ' + e.message);
      throw e;
    }
  }

  return async (text: string) => {
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
