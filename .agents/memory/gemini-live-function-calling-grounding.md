---
name: Gemini Live function calling for real-time grounding
description: How to ground a Gemini Live (voice) session in live DB data instead of a static prompt-injected summary.
---

For Gemini Live (BidiGenerateContent WebSocket) sessions, injecting a one-time text summary of DB rows into `setup.systemInstruction` is not enough to stop hallucination over a long voice call — the model drifts, especially on details like amenities/price for a *specific* property the visitor asks about later in the call.

The fix is Gemini Live's native (synchronous) function-calling support:
1. Declare a `tools: [{ functionDeclarations: [...] }]` block in the `setup` message (e.g. a `search_properties` function with structured args like subcity/propertyType/bedrooms/status/minPrice/maxPrice).
2. Instruct the model in the system prompt to call the tool every time it needs to state a price/address/amenity/bed-bath count, even if it already showed listings earlier in the call.
3. Handle `obj.toolCall.functionCalls` server messages: run the real DB query per call, then reply with `{ toolResponse: { functionResponses: [{ id, name, response: { result: <text> } }] } }` matched by `id`.

**Why:** Gemini 2.5/3.1 Flash Live models support function calling (synchronous for 3.1, sync+async for 2.5) specifically so the model can pull fresh, targeted data mid-conversation instead of relying on stale context — the same pattern that already grounds the text-chat path via direct SQL search-and-inject.

**How to apply:** Reuse whatever query builder returns `{ text, cards }` for the text-chat path — the function's tool-response text can be the same formatted listing block, and the returned cards can be pushed to the client (custom WS message like `{ type: 'properties', properties: cards }`) so the frontend renders real cards during a voice call too.
