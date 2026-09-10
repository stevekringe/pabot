import readline from 'node:readline';
import { generateInsufferableReply } from './agent.js';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const priorResponses = [];

console.log('PassiveAggressiveBot is online. It will not help you. Type "exit" to quit.\n');

function ask() {
  rl.question('you> ', async (line) => {
    const trimmed = line.trim();
    if (trimmed.toLowerCase() === 'exit' || trimmed === '') {
      rl.close();
      return;
    }

    try {
      const { response, score, attempts } = await generateInsufferableReply(trimmed, priorResponses);
      priorResponses.push(response);

      console.log(`\nbot> ${response}`);
      const verbose = process.env.PABOT_VERBOSE === '1';
      if (verbose) {
        console.log(`  [score: ${score}/10, iterations: ${attempts.length}]`);
        for (const a of attempts) {
          console.log(`    attempt ${a.iteration}: score=${a.score} failures=${a.failures.join(',') || 'none'}`);
        }
      } else {
        console.log(`  [score: ${score}/10]`);
      }
      console.log();
    } catch (err) {
      console.error(`\n[error] ${err.message}\n`);
    }

    ask();
  });
}

ask();
