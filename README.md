# Deepgram Voice Agent Medical Assistant Demo

A demo that shows the [Deepgram Voice Agent API](https://developers.deepgram.com/docs/voice-agent) being used to power a Medical Assistant Voice Agent.

![ui-image](./images/med-assistant.png)

## What is Deepgram?

[Deepgram’s](https://deepgram.com/) voice AI platform provides APIs for speech-to-text, text-to-speech, and full speech-to-speech voice agents. Over 200,000+ developers use Deepgram to build voice AI products and features.

## Sign-up to Deepgram

Before you start, it's essential to generate a Deepgram API key to use in this project. [Sign-up now for Deepgram and create an API key](https://console.deepgram.com/signup?jump=keys).


## Prerequisites

- [Node v20](https://nodejs.org/en/download/) or higher
- Optional: [yarn](https://classic.yarnpkg.com/en/docs/install)

## Getting started

Fork or Clone this repo.

Install project dependencies:

```sh

npm install

```

Run the demo locally:

>  usage:write is the only required Deepgram API scope.

1. Make a copy of `env.example` and create a file called `.env`
2. Set your `DEEPGRAM_API_KEY` environment variable in the new `.env` file.
3. Run:

```sh
npm run build

npm run dev
```

4. visit `http://localhost:3000/` to interact with the demo.

## Issue Reporting

If you have found a bug or if you have a feature request, please report them at this repository issues section. Please do not report security vulnerabilities on the public GitHub issue tracker. The [Security Policy](./SECURITY.md) details the procedure for contacting Deepgram.

## Getting Help

We love to hear from you so if you have questions, comments or find a bug in the project, let us know! You can either:

- [Open an issue in this repository](https://github.com/deepgram-starters/voice-agent-medical-assistant-demo/issues/new)
- [Join the Deepgram Github Discussions Community](https://github.com/orgs/deepgram/discussions)
- [Join the Deepgram Discord Community](https://discord.gg/xWRaCDBtW4)

## Author

[Deepgram](https://deepgram.com)

## License

This project is licensed under the MIT license. See the [LICENSE](./LICENSE) file for more info.
