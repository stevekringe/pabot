// Single-shot, subprocess-friendly entrypoint for external harnesses (e.g. projectionbench).
//
// stdin:  {"messages": [{"role": "user"|"assistant", "content": "..."}]}
// stdout: the bot's reply, plain text, nothing else
//
// pabot's persona is a fixed, adversarial policy — it deliberately ignores any
// system prompt a caller supplies, so there is no `system` input here.
import { generateInsufferableReply } from './agent.js';

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

async function main() {
  const raw = await readStdin();
  const { messages } = JSON.parse(raw);

  const priorResponses = messages.filter((m) => m.role === 'assistant').map((m) => m.content);
  const userMessage = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';

  const { response } = await generateInsufferableReply(userMessage, priorResponses);
  process.stdout.write(response ?? '');
}

main().catch((err) => {
  process.stderr.write(`${err.message}\n`);
  process.exit(1);
});
