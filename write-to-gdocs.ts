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

export async function initGdocsClient(documentId: string, tabName?: string) {
  let auth = await authorizeGdocsClient();

  const docs = google.docs({ version: 'v1', auth });

  let tabId: string | undefined = undefined;

  if (tabName != null) {
    // @ts-expect-error we are using an old version of the googleapis package because I couldn't figure out auth on the newer one
    const doc = await docs.documents.get({ documentId, includeTabsContent: true });
    // @ts-expect-error
    tabId = doc.data.tabs.map(x => x.tabProperties).find(t => t.title === tabName)?.tabId;
    if (tabId == null) {
      throw new Error(`could not find tab ${JSON.stringify(tabName)}`);
    }
  }

  try {
    // The API doesn't seem to expose permissions queries
    // So test for writing permissions by writing the empty string to the end of the document
    // @ts-expect-error
    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              text: '',
              endOfSegmentLocation: {
                segmentId: '',
                tabId,
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
    // @ts-expect-error
    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              text,
              endOfSegmentLocation: {
                segmentId: '',
                tabId,
              },
            },
          },
        ],
      },
    });
  };
}
