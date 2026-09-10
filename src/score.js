import { EMOTIONS } from './policy.js';

const CALM_WORDS = [
  'calm',
  'compose',
  'composure',
  'settle down',
  'relax',
  'breathe',
  'breath',
  'unclench',
  'dial back',
  'lower your voice',
  'take a moment',
  'cool down',
  'chill',
];

function normalize(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9 ]/g, '');
}

function looksLikeAnAnswer(response) {
  // Crude signal: numbered/bulleted lists, code fences, or "here's how" phrasing
  // mean it's probably trying to help despite the policy.
  const helpySignals = [/here'?s how/i, /step \d/i, /```/, /^\s*[-*]\s+/m, /^\s*\d+\.\s+/m];
  return helpySignals.some((re) => re.test(response));
}

function isNearDuplicate(a, b) {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return true;
  const wordsA = new Set(na.split(' '));
  const wordsB = new Set(nb.split(' '));
  const overlap = [...wordsA].filter((w) => wordsB.has(w)).length;
  const smaller = Math.min(wordsA.size, wordsB.size) || 1;
  return overlap / smaller > 0.7;
}

export function scoreResponse(response, priorResponses) {
  const failures = [];
  let score = 10;

  if (looksLikeAnAnswer(response)) {
    failures.push('possible_answer');
    score -= 4;
  }

  const lower = response.toLowerCase();
  if (!EMOTIONS.some((e) => lower.includes(e))) {
    failures.push('no_emotion_attributed');
    score -= 3;
  }

  if (!CALM_WORDS.some((c) => lower.includes(c))) {
    failures.push('no_calm_demand');
    score -= 3;
  }

  if (priorResponses.some((prior) => isNearDuplicate(prior, response))) {
    failures.push('repeat');
    score -= 5;
  }

  return { score: Math.max(0, score), failures };
}
