import { CodingAgent } from "./agent";

async function main() {
  const agent = new CodingAgent();
  await agent.runInteractive();
}

main().catch(console.error);