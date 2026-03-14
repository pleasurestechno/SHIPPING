import { AgentMailClient } from "agentmail";
import { config } from "dotenv";

config();

async function main() {
  const client = new AgentMailClient({ apiKey: process.env.AGENTMAIL_API_KEY });
  const inbox = await client.inboxes.create({ username: "redpc", clientId: "redpc-custom-gemini-v2" });
  console.log("Inbox ID:", inbox.inboxId || inbox.id);
  console.log("Full Object:", JSON.stringify(inbox, null, 2));
}

main().catch(console.error);