---
name: Gemini Live API model vs. speechConfig.languageCode mismatch
description: Not every Gemini Live (bidiGenerateContent) model accepts every speechConfig.languageCode; picking the wrong one closes the socket with a 1007 error after setup.
---

## The pattern
Gemini's Live API (`BidiGenerateContent`) supports several models (e.g. `gemini-2.5-flash-native-audio-latest`, `gemini-2.5-flash-native-audio-preview-*`, `gemini-3.1-flash-live-preview`, `gemini-3.5-live-translate-preview`), but they don't all support the same `generationConfig.speechConfig.languageCode` values. Requesting a non-Amharic-capable model with `languageCode: 'am-ET'` connects fine, accepts the `setup` message, then closes with code 1007 and reason `Unsupported language code 'am-ET' for model <name>` — this looks identical to "live voice not configured" or "session ended" from the client's perspective, so it's easy to misdiagnose as an auth/config problem rather than a model-capability mismatch.

**Why:** the model name is just a string constant in server code; nothing statically checks it against the language actually requested at runtime, and a prior decision to use a specific model for its multilingual quality can silently drift (e.g. reverted to an older model name) without breaking anything until someone requests the unsupported language.

**How to apply:** when a Live API session closes right after setup with a 1007/"unsupported language" reason, check the `LIVE_MODEL` constant against the actually-requested `languageCode` — don't assume the deployed model matches what a comment or changelog says it should be. List current bidi-capable models via `GET /v1beta/models?key=...` (filter for `bidiGenerateContent` in `supportedGenerationMethods`) and pick one that supports the needed language. In EthioProperty's Ask-AI live voice (`extensions/gemini-ai.js`), `gemini-2.5-flash-native-audio-latest` rejects `am-ET`; `gemini-3.1-flash-live-preview` accepts it.
