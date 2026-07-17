```text
  ___  ____  _____ _   _    _    ____     _
 / _ \|  _ \| ____| \ | |  / \  |  _ \   / \
| | | | |_) |  _| |  \| | / _ \ | | | | / _ \
| |_| |  __/| |___| |\  |/ ___ \| |_| |/ ___ \
 \___/|_|   |_____|_| \_/_/   \_\____//_/   \_\
        OPEN ACCESS FOR THE PUBLIC WEB
```

# OpenADA

[![CI](https://github.com/techcto/openada/actions/workflows/ci.yml/badge.svg)](https://github.com/techcto/openada/actions/workflows/ci.yml)
[![Publish Containers](https://github.com/techcto/openada/actions/workflows/publish-containers.yml/badge.svg)](https://github.com/techcto/openada/actions/workflows/publish-containers.yml)
[![Open in GitHub](https://img.shields.io/badge/Open%20in-GitHub-181717?logo=github)](https://github.com/techcto/openada)
[![Run Container Publish](https://img.shields.io/badge/Run%20container%20publish-GitHub%20Actions-2088FF?logo=githubactions&logoColor=white)](https://github.com/techcto/openada/actions/workflows/publish-containers.yml)

OpenADA is a hosted accessibility and language-quality service for the web. It gives web developers, agencies, public entities, and site owners one stable API for WCAG audits and LanguageTool-compatible spelling and grammar checks, then turns public site scans into a transparent, date-based archive anyone can browse.

## The Problem

The Department of Justice's April 20, 2026 interim final rule extended the Title II compliance date to April 26, 2027 for covered public entities with populations of 50,000 or more, and to April 26, 2028 for smaller public entities and special district governments. The extension acknowledges the practical burden; it does not make accessible public services optional. Read the [Federal Register rule](https://www.federalregister.gov/documents/2026/04/20/2026-07663/extension-of-compliance-dates-for-nondiscrimination-on-the-basis-of-disability-accessibility-of-web).

This is a serious compliance and delivery problem, not a cosmetic feature request. Inaccessible public services can lead to complaints, Department of Justice enforcement, litigation, settlement obligations, attorneys' fees, and expensive remediation. The exact remedy depends on the facts and applicable law, but the financial and operational consequences are real. OpenADA does not determine legal compliance or liability; it helps teams find and fix concrete problems before they become harder and more expensive to address.

Every public website is part of a public service: applying for a permit, finding an emergency contact, paying a bill, registering for school, or understanding a local policy. When a site is inaccessible, residents with disabilities are shut out of the same services everyone else depends on.

This is a national delivery problem, not a niche feature request. State and local governments are working through the DOJ's web-accessibility requirements while facing limited budgets, small technology teams, aging websites, vendors, PDFs, forms, and thousands of pages that must be understood and improved.

Commercial accessibility platforms can be difficult for a small city, county, school district, library, or special district to afford. OpenADA is built around a simple public-interest proposition: every government should be able to scan its own website for free, see which pages need attention, understand the findings, and measure improvement over time. The project starts as free infrastructure for public entities and developers; optional enterprise API capacity can help fund continued public access later.

OpenADA is not a legal determination or a substitute for human accessibility testing, procurement review, or counsel. It is a practical starting point that turns a large, expensive, easy-to-ignore problem into a queue of concrete pages and findings.

## Contest Pitch

### The 30-Second Demo

Paste a public URL, choose a crawl size, and press **Scan site**. OpenADA queues the work, shows live progress while pages are checked, and redirects to a public report. A visitor can then move through the archive:

`site -> scan date -> pages -> page findings -> the same page across time`

![OpenADA public URL checker](assets/openada-checker.svg)

The checker makes the first step clear: paste a public page or website URL, choose how many same-site pages to scan, and start the crawl.

Try it live:

- [OpenADA checker](https://openada.us/)
- [Public directory](https://openada.us/directory)
- [Public API reference](https://openada.us/api-reference)
- [ADA guidance](https://openada.us/docs)

## Judging Criteria

### Technological Implementation

OpenADA is a real, deployed service rather than a static demo. Codex was used as an engineering collaborator across the full loop: shaping the API, building the crawler and durable scan workflow, iterating on the UI, writing CloudFormation and container workflows, debugging production behavior, and verifying the live AWS deployment. The result is a working Next.js UI, API service, asynchronous scan worker, Redis-backed queue, DynamoDB archive, public widget, OpenAPI document, and Docker/GitHub Actions release path.

### Design

The product has a complete workflow: a search-style URL entry point, a fast five-page default for first-time testing, adjustable crawl limits, progress feedback, a report route, a directory with latest scores, sorted page results, color-coded grades, page-level findings, historical scan selection, printable reports, API reference, and human-readable guidance. It is designed for repeated use by editors, developers, accessibility teams, and the public.

### Potential Impact

Public agencies and small organizations should not need a large procurement budget or a specialized accessibility team just to understand where their websites fail. OpenADA gives web developers, agencies, government teams, and site owners a low-friction API and free public scanning path for published pages. The public archive also makes accessibility progress visible over time instead of hiding every scan inside a private dashboard.

### Quality of the Idea

Most accessibility tools produce a private score and stop there. OpenADA combines accessibility, language quality, a public API, and an open web archive. The archive makes a website’s improvement legible: not just “what is my score now?”, but “which pages changed, what failed, and did the site improve from the last scan?” That public, time-based layer is the project’s distinctive idea.

### What The Judges Can Verify

- A live URL scan creates a durable asynchronous job and never blocks the web request while a crawl runs.
- The UI reports pages scanned, queued work, current URL, and crawl errors before redirecting to the archive.
- The main directory uses the newest completed site crawl for its score and page count.
- Each site has dated scans; each scan has sorted pages; each page has ADA and language findings plus historical versions.
- The API remains useful without the UI through `/api/v1/check`, `/api/v1/ada/check`, `/api/v2/check`, `/api/v1/scans`, and `/api/v1/directory`.
- The deployment can be reproduced from the repository with Docker, CloudFormation, and GitHub Actions.

## What It Does

- Runs `axe-core` against submitted HTML in the API container.
- Returns LanguageTool-compatible results from `POST /api/v2/check`.
- Supports a combined `POST /api/v1/check` request for HTML editors and page workflows.
- Runs as three focused containers: a Next.js UI, a Next.js API, and an asynchronous scan worker, with Redis for job delivery and DynamoDB for the public archive.
- Includes a hosted widget that can scan a public page and publish its score to the directory.
- Uses an optional managed LanguageTool-compatible upstream through `LANGUAGETOOL_UPSTREAM_URL`.

## Local Development

Install Docker Desktop, then run the full local stack from the repository root:

```bash
docker-compose up --build
```

Docker Compose builds the UI, API, worker, Redis, and LanguageTool-compatible services. Stop the stack with `docker-compose down`.

For an automated local container smoke test, run `./cmd.sh compose-test`. It builds the application containers, waits for the API health check, verifies the UI, sends a combined ADA/language request, and tears the stack down afterward.

Open `http://localhost:3000`. The API health check is `http://localhost:3001/api/health`.
The human-readable ADA guide is available at `http://localhost:3000/docs`.
The public scan directory is available at `http://localhost:3000/directory`, and the API reference is at `http://localhost:3000/api-reference`. The homepage starts site crawls at five pages by default; the selector supports 25, 50, and 100 pages.

The UI proxies `/api/*` to the API container. For a direct request:

```bash
curl -X POST http://localhost:3001/api/v1/check \
  -H 'Content-Type: application/json' \
  -d '{"html":"<main><img src=\"logo.png\"></main>","text":"This langauge needs a check."}'
```

## API Contract

`POST /api/v1/ada/check`

```json
{
  "html": "<main>...</main>",
  "url": "https://example.com/page",
  "wcagTags": ["wcag2a", "wcag2aa", "wcag21aa"]
}
```

`POST /api/v1/language/check` returns a compact `{ errors, issues, raw }` payload for application integrations.

`POST /api/v1/check` accepts `html`, optional `text`, `language`, `url`, and `wcagTags`, and returns both `ada` and `language` results. When `url` is supplied without `html`, OpenADA fetches the public HTML page with bounded redirects, a 15-second timeout, and a 2 MB response limit.

`POST /api/v2/check` follows the LanguageTool `/v2/check` response shape. This makes it easy for websites, publishing tools, and developer workflows to adopt OpenADA without changing their existing language-check integration.

`POST /api/v1/scans` accepts a public `url`, runs both checks, and records the site, page, and scan in the public directory. Set `crawl: true` to follow same-host links from the starting page; the bounded crawl scans up to 100 pages (`maxPages`, default 50). `GET /api/v1/directory` lists recorded sites; add `?site=example.com` for its pages and recent scans. The machine-readable OpenAPI document is available at `/api/openapi`.

Every ADA result includes a letter grade derived from the numeric score: `A+` (97-100), `A` (93-96), `B` (85-92), `C` (70-84), `D` (50-69), or `F` (0-49). Public scans are enabled by default in the standalone template; set `OPENADA_PUBLIC_SCANS_ENABLED=false` to disable them, or set `OPENADA_SCAN_ALLOWED_HOSTS=example.com,another.example` to limit allowed hosts. `OPENADA_API_KEYS` protects scan submissions when configured.

Set `OPENADA_API_KEYS` to a comma-separated list to require `Authorization: Bearer <key>` or `X-API-Key: <key>`. Set `OPENADA_CORS_ORIGINS` to a comma-separated allowlist in production.

## OpenADA For ChatGPT, Codex, And Claude

OpenADA also speaks [Model Context Protocol (MCP)](https://modelcontextprotocol.io/). This makes the public accessibility archive available inside AI coding tools instead of trapping it in a dashboard. Connect the Streamable HTTP endpoint:

```text
https://openada.us/mcp
```

The MCP server exposes four tools: check one public page, queue a same-host site scan, read durable scan progress, and browse the public directory. A scan returns a job ID immediately, so an agent can keep the user informed while the worker checks pages.

- **ChatGPT:** add the remote MCP URL from the Apps or Connectors flow, or submit it as the server URL in the [OpenAI Apps submission guide](https://learn.chatgpt.com/docs/submit-plugins).
- **Codex:** add the URL from MCP settings, or put `[mcp_servers.openada]` with `url = "https://openada.us/mcp"` in `~/.codex/config.toml`, then run `codex mcp list`.
- **Claude Code:** run `claude mcp add --transport http openada https://openada.us/mcp`, then verify with `claude mcp list` or `/mcp`.

See the full [MCP connection and submission guide](devops/mcp/README.md) and the public [MCP documentation](https://openada.us/docs#mcp). The anonymous public demo is limited to public URLs; production deployments can require `OPENADA_API_KEYS`. Automated results are engineering guidance, not legal advice or a compliance certification.

## Website Integration

Any website, application, publishing workflow, or build pipeline can post editor text or rendered page content to OpenADA. Point the integration at the OpenADA API base URL, for example:

```text
https://openada.example.com/api
```

Use `https://openada.example.com/api/v2/check` for LanguageTool-compatible checks, `/api/v1/ada/check` for server-side accessibility checks, and `/api/v1/check` when one request should return both. No local LanguageTool container is required. The same endpoints work for WordPress, Drupal, static sites, custom applications, CI pipelines, and any other web stack.

## AWS Deployment

`devops/cloudformation/openada.yaml` provisions:

- ECS Fargate cluster and task execution roles
- Public ALB with `/api/*` routed to the API service
- UI, API, and scan-worker services with health checks and durable job progress
- Private Cloud Map DNS for UI-to-API calls
- CloudWatch log groups for the application services
- Redis-backed scan queue and four on-demand DynamoDB tables for sites, pages, immutable scan records, and scan jobs
- Optional ACM HTTPS listener

Build and publish `openada-ui`, `openada-api`, and `openada-worker` images, then deploy the stack with the image URIs, VPC, public subnets, and private service subnets. The template does not install Java LanguageTool, MySQL, or a local LanguageTool service. Redis is used only for asynchronous scan delivery; DynamoDB stores public directory metadata, page findings, immutable scan records, and durable job progress. OpenSearch remains an optional future search layer, not a requirement for the free service.

The widget is published to `s3://openada/widgets/openada-widget.js` by `./cmd.sh cft-new publish`. Add it to a public page:

```html
<script src="https://openada.s3.us-east-1.amazonaws.com/widgets/openada-widget.js"></script>
```

The repository helpers cover the repeatable workflow:

```bash
./cmd.sh test
./cft.sh validate

export OPENADA_VPC_ID=vpc-0123456789abcdef0
export OPENADA_PUBLIC_SUBNETS=subnet-public-a,subnet-public-b
export OPENADA_SERVICE_SUBNETS=subnet-private-a,subnet-private-b
export OPENADA_UI_IMAGE=123456789012.dkr.ecr.us-east-1.amazonaws.com/openada/ui:TAG
export OPENADA_API_IMAGE=123456789012.dkr.ecr.us-east-1.amazonaws.com/openada/api:TAG
./cft.sh deploy
```

`./cft.sh test` performs offline structure checks and runs `cfn-lint` when installed. `./cft.sh validate` additionally calls AWS CloudFormation, so it requires AWS credentials and network access. Service subnets need NAT access to pull from ECR and send logs unless `AssignPublicIp=ENABLED` is used. Pass an ACM certificate ARN with `OPENADA_CERTIFICATE_ARN` for HTTPS; the stack redirects HTTP to HTTPS and emits the HTTPS endpoint.

## Contest Note

OpenADA is intentionally focused: it contains only the UI, API, scan worker, deployment, documentation, and public widget needed to make the service real. It does not carry unrelated application modules or a local LanguageTool runtime.

See [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) for the open-source notices for axe-core, LanguageTool, and Playwright.
