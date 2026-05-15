# Live transcribe to google docs

Transcribe your microphone to Google Docs in real time using [Soniox](https://soniox.com/). (See branches for other services.)

As of this writing Soniox is on the pareto frontier for accuracy x cost for realtime transcriptions, and also provides diarization, which is very helpful.

If you don't need the ability to edit transcripts in realtime, you may prefer to use one of the many other, more polished transcription services.

## Setup

### Local

Have node installed.

`npm install` to install dependencies. This intentionally pins a rather outdated version of the `googleapis` package because I couldn't figure out how to do authentication with the newer one, sorry.

If you want to record meetings or other audio playing from your computer, you will also need to figure out how to route your audio out to your audio in, because this only transcribes your audio in (with [`node-record-lpcm16`](https://www.npmjs.com/package/node-record-lpcm16) wrapping `rec`). On MacOS I use the excellent [BlackHole Audio](https://github.com/ExistentialAudio/BlackHole) tool.

If you want to also listen to the meeting on the same computer, you'll need [a multi-output device](https://github.com/ExistentialAudio/BlackHole/wiki/Multi-Output-Device), which on MacOS you can do with built-in tools.

I don't have a good solution for also transcribing your actual microphone so you can participate and be transcribed as well. Technically this is easy to do with [an aggregate input device](https://github.com/ExistentialAudio/BlackHole/wiki/Aggregate-Device), but this will add your audio stream to the transcript even when you aren't actively participating (i.e., it's not conditioned on you being unmuted in the meeting, because it has no awareness of the meeting). If you have a hardware switch for your mic this could be OK. I just use a second computer.

### Google

(Note: Google changes their pages distressingly often. This may no longer be the process. The goal is to create a project and an OAuth client such that you have a `.json` with `"installed": { "client_id": ..., "client_secret": ..., ... }` and your project has the `.../auth/documents` scope.)

[Create a Google Cloud project](https://console.cloud.google.com/projectcreate) if you don't already have one you want to use.

Go to the [APIs & Services](https://console.developers.google.com/apis/dashboard) page on the Cloud console. Make sure you're in the right project at the top-left. Click "Data Access" on the left sidebar, "Add or remove scopes", and search for or manually add `.../auth/documents` ("See, edit, create, and delete all your Google Docs documents"). Click "save" at the bottom of the page.

On the left sidebar of the APIs & Services page, click "Clients", then "Create client", then pick type "Desktop app" and give it a name you will remember (this is not user-exposed). Click "Download JSON". Move the resulting file to the top level of this project and name it `gdocs-client-oauth-secret.json`.

### Soniox

Sign up on [their website](https://soniox.com/), enable billing, give it some money (it costs ~$0.12/hr so $10 will cover > 80 hours of transcribing), get an API key, and put it in SONIOX_KEY.txt. Unlike Google, this is a normal company which wants you to give them money, so they don't make it complicated.

## Running

`node run.ts doc_id [--tab "tab name"]`

The `doc_id` is the `1fOSJp9hZLoR2BhiE0da87bLtoBBgcvGdi063IU1wqW8` part of doc's URL, as in `https://docs.google.com/document/d/1fOSJp9hZLoR2BhiE0da87bLtoBBgcvGdi063IU1wqW8/edit`. Make sure it's a document you have permission to edit.

The tab name is optional; if omitted it will write to the first tab.

The first time you run it, or if you haven't used it in a while, it should pop up a browser window to ask you to grant access. It will have a big "Google hasn’t verified this app" warning you can click through by clicking "advanced" then "go to (your app)". The subsequent permissions screen should ask for permissions to "See, edit, create, and delete all your Google Docs documents" and no other permissions if you followed the instructions above. Grant it and you should be up and running.

Text will be printed to the console as it runs, and should be appearing in the specified tab of the specified document. If the transcription makes a particular error repeatedly, you can add replacement rules in `relacements.js`. This file is automatically reloaded every few seconds.

Sometimes the stream just dies for no discernible reason, so I run it in a loop with `while true; do [run the thing]; sleep 1; done`. (Don't forget the `sleep 1` so you can still C-c it.)
