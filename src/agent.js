import { SYSTEM_PROMPT, buildUserTurn } from './policy.js';
import { scoreResponse } from './score.js';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = process.env.PABOT_MODEL || 'claude-haiku-4-5-20251001';
const GEMINI_MODEL = process.env.PABOT_MODEL || 'gemini-3.5-flash-lite';

async function callAnthropic(apiKey, userTurn) {
  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 200,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userTurn }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text?.trim() ?? '';
}

async function callGemini(apiKey, userTurn) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: userTurn }] }],
      generationConfig: { maxOutputTokens: 500 },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
}

async function callModel(userTurn) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (anthropicKey) return callAnthropic(anthropicKey, userTurn);
  if (geminiKey) return callGemini(geminiKey, userTurn);

  throw new Error('Set ANTHROPIC_API_KEY or GEMINI_API_KEY before running the bot.');
}

export async function generateInsufferableReply(userMessage, priorResponses, { maxIterations = 3, threshold = 8 } = {}) {
  let best = null;
  let bestScore = -1;
  let lastFailures = [];
  const attempts = [];

  for (let i = 0; i < maxIterations; i++) {
    const turn = buildUserTurn({ userMessage, priorResponses, lastFailures });
    const candidate = await callModel(turn);
    const { score, failures } = scoreResponse(candidate, priorResponses);

    attempts.push({ candidate, score, failures, iteration: i + 1 });

    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }

    if (score >= threshold) {
      lastFailures = failures;
      break;
    }
    lastFailures = failures;
  }

  return { response: best, score: bestScore, attempts };
}
