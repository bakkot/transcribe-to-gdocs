# Live transcribe to google docs

Transcribe your microphone to Google Docs in real time using [Soniox](https://soniox.com/). (See branches for other services.)

As of this writing Soniox is on the pareto frontier for accuracy x cost for realtime transcriptions, and also provides diarization, which is very helpful.

If you don't need the ability to edit transcripts in realtime, you may prefer to use one of the many other, more polished transcription services.

## Setup

### Local

Have node installed.

`npm install` to install dependencies. This intentionally pins a rather outdated version of the `googleapis` package because I couldn't figure out how to do authentication with the newer one, sorry.

You will also need to figure out how to route your audio out to your audio in, because this only transcribes your audio in (with [`node-record-lpcm16`](https://www.npmjs.com/package/node-record-lpcm16) wrapping `rec`). On MacOS I use the excellent [BlackHole Audio](https://github.com/ExistentialAudio/BlackHole) tool.

### Google

(Note: these instructions are old and Google changes their pages distressingly often. This may no longer be the process. The goal is to create a project and an OAuth client such that you have a `.json` with `"installed": { "client_id": ..., "client_secret": ..., ... }`.)

Create a Google Cloud project and enable the Google Docs API for your project. You can do this from the [APIs & Services](https://console.developers.google.com/apis/dashboard) page on the Cloud console. Make sure you're in the right project at the top, then click "Enable APIs and Services", search for the Google Docs API, and click Enable.

Set up the app to allow users to grant it permission to edit documents on their behalf. From the [APIs & Services](https://console.developers.google.com/apis/dashboard) page, click "OAuth Consent Screen" in the left menu, click "Clients", then "Create client", then pick type "Desktop app". Click "Download Provide a name and email to be displayed to users and a developer contact, then click Save and Continue. On the Scopes page, select the ".../auth/documents" scope ("View and manage your Google Docs documents"). Ignore the warning about verification for now. Click Save and Continue until you get to the Summary page. Don't worry about registration for now, just click Back to Dashboard.

Finally, acquire the OAuth secret for your application. From the [APIs & Services](https://console.developers.google.com/apis/dashboard), select "Credentials", click Create Credentials at the top, select "OAuth Client ID", set the type to "Desktop app", give it a name, and click "create". It will tell you the ID and secret, but it's easier to download the full JSON. Save it to a file named `gdocs-client-oauth-secret.json` in this directory.

### Soniox

Sign up on [their website](https://soniox.com/), enable billing, give it some money, get an API key, and put it in SONIOX_KEY.txt. Unlike Google, this is a normal company which wants you to give them money, so they don't make it complicated.

## Running

`node run.ts doc_id [--tab "tab name"]`

The `doc_id` is the `1fOSJp9hZLoR2BhiE0da87bLtoBBgcvGdi063IU1wqW8` part of doc's URL, as in `https://docs.google.com/document/d/1fOSJp9hZLoR2BhiE0da87bLtoBBgcvGdi063IU1wqW8/edit`. Make sure it's a document you have permission to edit.

The tab name is optional; if omitted it will write to the first tab.

The first time you run it, or if you haven't used it in a while, it should pop up a browser window to ask you to grant access. It will have a big "Google hasn’t verified this app" warning you can click through by clicking "advanced" then "go to (your app)". The subsequent permissions screen should ask for permissions to "See, edit, create, and delete all your Google Docs documents" and no other permissions if you followed the instructions above. Grant it and you should be up and running.

Text will be printed to the console as it runs, and should be appearing in the specified tab of the specified document. If the transcription makes a particular error repeatedly, you can add replacement rules in `relacements.js`. This file is automatically reloaded every few seconds.
