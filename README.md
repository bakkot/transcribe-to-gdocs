# Transcribe to Google Docs

This project lets you transcribe your audio input to Google Docs using Google's Cloud Speech API. You can edit the document in realtime (with a lag of a few seconds). If you don't need the ability to edit transcripts in realtime, you may prefer to use one of the many other, more polished transcription services.

The Cloud Speech API is not free, so you will need to provide your own credentials to use this project.


## Setup

### Local setup

As with any node project, `npm install` to install dependencies.

You will also need to install `sox` and have it available on your `$PATH`. On MacOS you can install it with Homebrew as `brew install sox`.


### Project setup

Create a Google Cloud project, enable the Speech-To-Text API for that project, create a service account, and aquire private key for that service account. You can do that all in one step by clicking the "Set up a project" button behind [this link](https://cloud.google.com/speech-to-text/docs/quickstart-client-libraries#before-you-begin). Then copy the JSON with the private key for the service account to a file named `speech-service-account-key.json` in this directory.

Enable the Google Docs API for your project. You can do this from the [APIs & Services](https://console.developers.google.com/apis/dashboard) page on the Cloud console. Make sure you're in the right project at the top, then click "Enable APIs and Services", search for the Google Docs API, and click Enable.

Set up the app to allow users to grant it permission to edit documents on their behalf. From the [APIs & Services](https://console.developers.google.com/apis/dashboard) page, click "OAuth Consent Screen" in the left menu, click "External", and press "Create". Provide a name and email to be displayed to users and a developer contact, then click Save and Continue. On the Scopes page, select the ".../auth/documents" scope ("View and manage your Google Docs documents"). Ignore the warning about verification for now. Click Save and Continue until you get to the Summary page. Don't worry about registration for now, just click Back to Dashboard.

Finally, acquire the OAuth secret for your application. From the [APIs & Services](https://console.developers.google.com/apis/dashboard), select "Credentials", click Create Credentials at the top, select "OAuth Client ID", set the type to "Desktop app", give it a name, and click "create". It will tell you the ID and secret, but it's easier to click through and the click the download icon to the right of the newly created credential. Copy that JSON to a file named `gdocs-client-oauth-secret.json` in this directory.

## Replacements

The file `replacements.js` defines a function which transforms snippets as they come in, which is useful if the transcription makes consistent mistakes. The current set of replacements is optimized for [TC39](http://tc39.es/)'s needs, so you will almost certainly want to replace it.

Changes to that file are loaded automatically; you don't need to restart the transcription.

## Use

`node run.js`

This will ask for the ID of a Google Doc to transcribe to. This is the `1fOSJp9hZLoR2BhiE0da87bLtoBBgcvGdi063IU1wqW8` part of doc's URL, as in `https://docs.google.com/document/d/1fOSJp9hZLoR2BhiE0da87bLtoBBgcvGdi063IU1wqW8/edit`. Make sure it's a document you have permission to edit.

If this is the first time running it, you'll then be asked to authorize an account. (The resulting credential is stored in `GENERATED_TOKEN.json`, so you should only need to do this once.) Go the URL it provides and grant permissions. You'll need to click through the big "This app isn't verified" warning (under "advanced"), unless you've verified your application. Ultimately you should get a string you will need to copy back to the terminal.

That's it! It will then run forever, transcribing your microphone to the doc. Kill it with control-C when you're done.

Keep in mind that this [costs money](https://cloud.google.com/speech-to-text/pricing). Specifically, since this is configured to use the fancy "video" model (which seemed to work best in my experience), it [will cost](https://cloud.google.com/speech-to-text/pricing#pricing_table) $0.009 every 15 seconds, or about $2.16 an hour.


## Transcribing audio from your computer

This records audio _in_, not audio _out_. So it won't directly help with, e.g., transcribing a stream you're viewing on your computer. You'll need to use a tool like [JACK](https://jackaudio.org/) or [BlackHole](https://github.com/ExistentialAudio/BlackHole) (MacOS only) to route your audio out to your audio in.
