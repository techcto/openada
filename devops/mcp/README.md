# OpenADA MCP app

OpenADA exposes a public, Streamable HTTP MCP server at:

```text
https://openada.us/mcp
```

The server keeps the existing REST API and website intact while making the same accessibility archive available to ChatGPT and other MCP clients.

## Connect your AI coding partner

OpenADA is deliberately a remote, stateless Streamable HTTP server. You do not need to install an OpenADA package inside the client. Add this URL to an MCP-capable client:

```text
https://openada.us/mcp
```

The public demo is anonymous. A self-hosted or protected deployment can require `Authorization: Bearer <key>` or `X-API-Key: <key>` through `OPENADA_API_KEYS`.

### ChatGPT

In ChatGPT, open **Settings > Apps & Connectors > Advanced settings**, turn on **Developer mode**, then return to Apps & Connectors and choose **Create app** or **New Plugin**. Set the name to `OpenADA` and enter `https://openada.us/mcp` in **Server URL**. Use `/mcp`, not an `/sse` URL.

For the public demo, choose **None** or **No authentication** if that option is available and leave OAuth credentials empty. Review the custom MCP warning, check the acknowledgement, and choose **Create**. Start a new chat, enable OpenADA from the tools or connectors menu, and ask it to check a public page or inspect the directory.

For the public app directory, submit the same MCP URL through the [OpenAI Apps submission guide](https://learn.chatgpt.com/docs/submit-plugins). This repository includes the draft metadata and test cases in [`chatgpt-app-submission.json`](../../chatgpt-app-submission.json). Review the publisher, privacy, terms, availability, and test details in the portal before submitting.

### Codex CLI, desktop, or IDE

Codex supports Streamable HTTP servers from MCP settings. It also reads `~/.codex/config.toml`:

```toml
[mcp_servers.openada]
url = "https://openada.us/mcp"
default_tools_approval_mode = "writes"
```

Then run:

```bash
codex mcp list
```

Restart Codex and use `/mcp` in the TUI when you want to inspect active servers. The `writes` approval mode asks before starting a site scan while allowing read-only checks and directory lookups.

For a protected deployment, use `bearer_token_env_var` or an environment-backed HTTP header in the Codex MCP configuration. Do not commit a token to `config.toml`.

See the [official Codex MCP guide](https://developers.openai.com/codex/mcp) for desktop, IDE, CLI, and configuration-file options.

### Claude Code

Claude also supports a custom connector in its settings UI. Open **Settings > Connectors > Add custom connector**, set the name to `OpenADA`, and enter `https://openada.us/mcp` in **Remote MCP server URL**. Leave the optional OAuth Client ID and OAuth Client Secret blank for the public demo, then choose **Add** and enable OpenADA in a conversation.

Claude Code can also register the remote server from a project directory:

```bash
claude mcp add --transport http openada https://openada.us/mcp
claude mcp list
```

Use `/mcp` inside Claude Code to inspect the connection. For a protected deployment, add an environment-backed header according to your shell and security policy, for example:

```bash
claude mcp add --transport http openada https://openada.us/mcp --header "X-API-Key: $OPENADA_API_KEY"
```

See the [Claude Code MCP guide](https://code.claude.com/docs/en/mcp) for scopes, transports, and team configuration.

### MCP Inspector

To inspect the tools without an agent, run:

```bash
npx @modelcontextprotocol/inspector
```

Choose **Streamable HTTP** and enter `https://openada.us/mcp`. For Docker Compose, use `http://localhost:3001/mcp`.

### What the agent can do

- Check one public URL or submitted HTML and return an ADA score, letter grade, WCAG findings, and language findings.
- Start a bounded same-host crawl without blocking the request.
- Poll durable progress until a crawl is complete or failed.
- Browse a site’s latest score, scan history, pages, and stored findings.

Good starting prompts:

```text
Check https://example.gov for accessibility and language issues. Summarize the most serious findings and do not call the result a legal certification.

Start a 50-page scan for https://example.gov. Report progress while it runs, then tell me the final grade and the pages with the most serious findings.

Show the latest public scan history for www.example.gov and explain whether the score improved.
```

OpenADA only fetches public URLs, applies SSRF protections and same-host crawl limits, and exposes no destructive archive tool. Agents should never claim that a score proves legal compliance.

## Tools

- `openada_check_page`: check supplied HTML, text, or a public page URL with axe-core and LanguageTool-compatible checks.
- `openada_scan_site`: queue a same-host crawl and return a durable `jobId` immediately.
- `openada_get_scan_status`: read crawl progress, errors, score, grade, and page summaries.
- `openada_directory`: list public sites or inspect a site's scans, pages, and stored findings.

Site scans are asynchronous. The MCP client should call `openada_get_scan_status` until the job is `completed` or `failed`.

## Authentication

### Hosted public demo

The public endpoint at `https://openada.us/mcp` is intentionally anonymous so people can try OpenADA from ChatGPT, Codex, Claude, or another MCP client. Choose **None** or **No authentication** when the client offers that option. Do not add an API key to the hosted demo connection.

### Self-hosted or protected deployments

Set `OPENADA_API_KEYS` to a comma-separated list before exposing a deployment beyond a trusted test environment. The endpoint then accepts either `Authorization: Bearer <key>` or `X-API-Key: <key>`, using the same key list as the REST API. Keep keys in environment-backed secret storage and never commit them to the repository.

## Local smoke test

Start the API and worker with the repository's Docker Compose stack, then point an MCP client at `http://localhost:3001/mcp`. The MCP endpoint is stateless, so each request includes the JSON-RPC message and does not depend on in-memory job state.

## Submission checklist

The app submission still requires account-level actions in the OpenAI Apps submission portal:

1. Verify the developer identity and domain ownership for `openada.us`.
2. Submit the public MCP URL `https://openada.us/mcp`.
3. Provide the listing metadata in `openada-app.json`.
4. If the portal asks for domain verification, set the generated token as `OpenAiAppsChallengeToken` and deploy; it will be returned only at `/.well-known/openai-apps-challenge`.
5. Add the public website, support URL, privacy policy, terms, logo, starter prompts, and test cases.
6. Review the tool descriptions and confirm that automated checks are described as engineering guidance, not legal advice.
