import { AgentMailClient } from "agentmail";
import { config } from "dotenv";

config();

async function main() {
  const client = new AgentMailClient({ apiKey: process.env.AGENTMAIL_API_KEY });
  const inbox = await client.inboxes.create({ username: "REDPC", clientId: "redpc-custom-gemini" });
  console.log("Inbox ID:", inbox.inboxId);
  console.log("Email Address:", inbox.emailAddress);
}

main().catch(console.error);