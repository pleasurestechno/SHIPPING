# AgentMail Setup

- API key stored in `.env.local` as `AGENTMAIL_API_KEY`.
- Install SDKs as needed:
  ```powershell
  pip install agentmail python-dotenv
  npm install agentmail dotenv
  ```
- Sample Python snippet:
  ```python
  import os
  from dotenv import load_dotenv
  from agentmail import AgentMail

  load_dotenv()
  client = AgentMail(api_key=os.getenv("AGENTMAIL_API_KEY"))
  inbox = client.inboxes.create(client_id="redpc-inbox-v1")
  ```
- Use `client.inboxes.messages.send(...)` to send mail, `messages.list(...)` to read.
