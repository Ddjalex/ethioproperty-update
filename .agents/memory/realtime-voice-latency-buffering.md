---
name: Real-time voice (Gemini Live / WebRTC-style) startup latency
description: Root cause pattern for "AI takes too long to start listening/responding" in voice-to-voice features, and the fix.
---

## The pattern
In a browser-mic → WebSocket-proxy → live model API pipeline (e.g. Gemini Live API), a common mistake is gating `getUserMedia()` (mic capture start) behind the full handshake: open our own WS → server builds prompt/context → server opens upstream WS to the model provider → provider's setup round-trip completes → server relays "ready" → *only then* does the client request the mic and start capturing.

This serializes several network round-trips (browser↔our server↔model provider) in front of mic capture, so real speech spoken right after the user taps "start" is dropped/lost, and there's a highly noticeable startup delay — which looks like both "slow to respond" and "doesn't detect my voice" bugs, even though they have one root cause.

**Why:** getUserMedia + audio pipeline setup (permission prompt aside) can run entirely in parallel with the server-side handshake; there's no dependency between them until you actually need to *send* a captured chunk upstream.

**How to apply:** Kick off `getUserMedia()` immediately when the user starts the session, in parallel with the WS/setup handshake. Buffer captured chunks client-side (a plain array) while the handshake is in flight, gated by a "connecting" flag; flush the buffer the moment the server signals ready, then switch to direct send. Also invalidate in-flight `getUserMedia()` promises with a monotonically increasing token so a stop/cancel during the permission prompt doesn't leave an orphaned stream open when the promise resolves late. Applied this fix in the EthioProperty Ask-AI live voice widget (`ai-voice-assistant-patch.js` / `extensions/features.js`).
