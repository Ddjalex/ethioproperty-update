---
name: Gemini-only AI policy (EthioProperty / Prime Addis)
description: Product decision that every AI feature must use Gemini exclusively, with no other AI/TTS vendor as fallback — even for Amharic.
---

The user explicitly rejected using Google Translate's free TTS (or any Google Cloud TTS) as an Amharic fallback for either the text-chat "speak" button or the live voice-to-voice call, after it was added to work around Gemini's earlier native-audio Amharic issues.

**Why:** the earlier attempt (removed) used Google Translate's TTS endpoint as a fallback because an older Gemini native-audio model handled Amharic poorly. Once the live model was upgraded, Gemini's own audio (both Live API native audio and the `/api/ai/tts` endpoint) turned out to handle Amharic correctly on its own — verified end-to-end with real Amharic prompts producing fluent, correct responses. The non-Gemini fallback was unnecessary and against the user's explicit preference.

**How to apply:** for this project, keep all Gemini AI backend logic (chat, streaming chat, TTS, live voice) inside `extensions/gemini-ai.js`, separate from the rest of `extensions/features.js`. Do not reintroduce Google Translate TTS, Google Cloud TTS, or any other AI/voice vendor as a fallback for any AI feature — if a language or voice quality problem appears again, fix it via Gemini model choice, voice selection, or prompt tuning, not by adding another provider.
