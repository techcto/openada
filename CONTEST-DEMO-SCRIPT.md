# OpenADA Contest Demo Recording Script

This is a 3 to 4 minute recording plan for the OpenAI Build Week submission.
Keep the browser at a readable zoom, use a public test URL, and never show AWS
credentials, API keys, private endpoints, or customer data.

## Before Recording

- Open `https://openada.us/` in a clean browser window.
- Have the [MCP guide](https://openada.us/docs/mcp), [API reference](https://openada.us/api-reference),
  and [AWS Marketplace AgentCore listing](https://aws.amazon.com/marketplace/pp/prodview-2bjfvhksfwuwq)
  ready in separate tabs.
- If showing local development, run `docker compose up --build` from the
  repository root and use `http://localhost:3000`.
- Turn off notifications and hide browser bookmarks or account information.

## Recording Flow

### 1. The problem and the product

**Show:** the OpenADA homepage and the contest banner.

**Say:** “OpenADA was built from scratch for OpenAI Build Week with GPT-5.6
Luna and Codex. Public agencies and small organizations need a practical way
to find accessibility and language problems across real websites without a
large procurement budget.”

### 2. Scan a website

**Show:** paste a public URL, leave the default at five pages, and select
**Scan site**.

**Say:** “A public URL starts an asynchronous same-site crawl. The request does
not hang while pages are checked; the scan route reports queue and page
progress, then opens the durable report.”

Pause briefly on the progress screen, then show the report and the public
directory. Open one scan, one page, the findings, and the historical page
picker. Mention that reports are printable and can be saved as PDF.

### 3. Show the developer surface

**Show:** `/api-reference` and the OpenAPI JSON link.

**Say:** “The same engine is available through a combined accessibility and
language API, focused ADA and LanguageTool-compatible endpoints, a crawl API,
and a public directory API.”

### 4. Show MCP in ChatGPT and Claude

**Show:** the MCP guide, then the ChatGPT Developer Mode custom app screen.
Use `https://openada.us/mcp` as the Server URL and connect without
authentication for the public demo.

**Say:** “We tested this as a real custom MCP connection in ChatGPT Developer
Mode. The model can discover the tools and ask OpenADA to inspect a public
page or start a bounded site scan.”

Use this safe prompt:

```text
Check https://openada.us/ for accessibility and language issues. Return a concise summary with the score, top issues, and practical remediation steps. Do not scan beyond one page unless I ask.
```

**Show:** Claude **Settings > Connectors > Add custom connector** with the same
`https://openada.us/mcp` Remote MCP server URL.

**Say:** “The same stateless MCP endpoint also works with Claude's custom
connector flow, so the service is useful from multiple AI clients rather than
being tied to one chat interface.”

### 5. Show AWS AgentCore

**Show:** the approved [OpenADA MCP AgentCore Marketplace listing](https://aws.amazon.com/marketplace/pp/prodview-2bjfvhksfwuwq)
and the AgentCore Quickstart. Do not open a screen containing account IDs,
tokens, or private configuration values.

**Say:** “For teams that need an AWS-native boundary, OpenADA MCP AgentCore is
an approved Marketplace product. It places the MCP gateway in Amazon Bedrock
AgentCore Runtime and can connect to the public service or a private OpenADA
deployment. AWS IAM and SigV4 protect the runtime boundary while OpenADA keeps
the accessibility and scan logic.”

### 6. Show local reproducibility

**Show:** the terminal with `docker compose up --build`, then the local UI.

**Say:** “The full stack is reproducible locally with one command. Compose
starts the UI, API, worker, Redis queue, and DynamoDB Local archive; local
tables are created automatically so the demo does not require an AWS account.”

### 7. Close with the impact

**Show:** the directory or the homepage.

**Say:** “OpenADA turns accessibility from a private score into a public,
dated improvement record. It gives developers and public-service teams a free
place to start, a real API for automation, MCP access for AI assistants, and a
private AWS path when they need stronger operational boundaries. This is the
working product Codex helped us build for the contest.”

## Final Checklist

- The live homepage, scan progress, report, directory, and page detail were shown.
- The API reference and MCP endpoint were shown.
- ChatGPT Developer Mode and Claude custom connector were both demonstrated.
- The AWS AgentCore Marketplace approval and subscribe link were shown.
- No credentials, tokens, private URLs, or customer information appeared.
- The final spoken claim is about engineering guidance, not legal compliance certification.
