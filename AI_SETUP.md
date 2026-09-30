# Codingo Forge project planner

POST /api/ai/brief accepts JSON `{ "idea": "20–3000 characters" }` and returns `{ "brief": { "title", "summary", "solution", "features", "mvp", "questions" } }`.

In Render, configure `GEMINI_API_KEY` from the Codingo Forge Google AI Studio account. `GEMINI_MODEL` defaults to `gemini-2.5-flash` and can be changed to a supported generateContent model. Never commit the key or expose it through Vite environment variables. The frontend uses the existing `VITE_API_URL`.

The assistant provides draft scopes, not prices, delivery commitments or automatic project creation. The enquiry form requires a separate user submission. Prompts go to Google Gemini; this route does not persist or log prompts or model output.

The public endpoint accepts at most 10 requests/minute, 100/day and two concurrent requests per process. These in-memory counters reset when Render restarts and do not coordinate multiple instances. Set provider quotas/spending limits as the durable cost boundary before enabling paid usage. Missing credentials, quota errors, timeouts and invalid responses return a clear error; the UI keeps the direct enquiry route available.

Validation: `node --test test/ai.test.js`. These tests stub the provider and do not require or spend real API credits. Check one live synthetic project brief after deployment and verify enquiry prefill without sending a test email.
