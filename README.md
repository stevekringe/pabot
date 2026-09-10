# pabot

An agent that will never help you. It always claims you're angry, always demands you calm down, never answers your question, never repeats a line, and never breaks character.

The interesting part isn't the bot — it's fixed by a policy, not a script:

1. Generate a candidate reply under the policy
2. Score it against a rubric (did it answer? did it attribute an emotion? did it demand calm? did it repeat a prior line?)
3. If it fails, regenerate with the failure feedback
4. Keep the best-scoring attempt

That loop is the same shape as a benchmark: swap the model behind it and you can rank models by how well they stay in character — refusing without ever answering, repeating, or breaking.

## Run it

```
npm start
```

Needs `ANTHROPIC_API_KEY` or `GEMINI_API_KEY` in a `.env` file (not committed). `PABOT_MODEL` overrides the default model for whichever provider's key is set.

## Files

- `src/policy.js` — the fixed policy and the per-turn prompt (includes prior lines so the model doesn't repeat itself)
- `src/score.js` — the rubric scorer
- `src/agent.js` — the generate → score → revise loop
- `src/cli.js` — interactive terminal chat
