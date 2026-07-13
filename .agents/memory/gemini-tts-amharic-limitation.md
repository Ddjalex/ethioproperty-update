---
name: Gemini TTS Amharic limitation
description: Gemini TTS models do not support am-ET; Amharic text must be routed to browser SpeechSynthesis.
---

## Rule
Never send Amharic (am-ET) text to the Gemini TTS endpoint (`/api/ai/tts`). Gemini TTS models accept the request silently but render Amharic script with English phonology.

**Why:** Amharic (am-ET) is not in the Gemini TTS supported language list. The API does not return an error — it silently produces English-accented audio. This caused the AI assistant greeting to sound English even when Amharic was selected.

**How to apply:**
- In `speakWithGemini()` (frontend patch), detect Amharic with `hasAmharic(text)` and call `speakWithBrowser(text, 'am-ET', 0.9)` directly — skip the Gemini TTS fetch entirely.
- The backend `/api/ai/tts` endpoint should always use `languageCode: 'en-US'`; it is only called for English text after this fix.
- The Gemini *Live* model (`gemini-3.1-flash-live-preview`) is separate and may support Amharic audio natively via system instruction. Use `inputAudioTranscription.languageCode: 'am-ET'` and a bilingual Amharic+English system instruction for the live session.
