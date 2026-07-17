# OpenADA

[![CI](https://github.com/techcto/openada/actions/workflows/ci.yml/badge.svg)](https://github.com/techcto/openada/actions/workflows/ci.yml)
[![Publish Containers](https://github.com/techcto/openada/actions/workflows/publish-containers.yml/badge.svg)](https://github.com/techcto/openada/actions/workflows/publish-containers.yml)
[![Open in GitHub](https://img.shields.io/badge/Open%20in-GitHub-181717?logo=github)](https://github.com/techcto/openada)
[![Run Container Publish](https://img.shields.io/badge/Run%20container%20publish-GitHub%20Actions-2088FF?logo=githubactions&logoColor=white)](https://github.com/techcto/openada/actions/workflows/publish-containers.yml)

OpenADA is a hosted accessibility and language-quality service for the web. It gives CMS products one stable API for WCAG audits and LanguageTool-compatible spelling and grammar checks, then turns public site scans into a transparent, date-based archive anyone can browse.

## Contest Pitch

### The 30-Second Demo

Paste a public URL, choose a crawl size, and press **Scan site**. OpenADA queues the work, shows live progress while pages are checked, and redirects to a public report. A visitor can then move through the archive:

`site -> scan date -> pages -> page findings -> the same page across time`

Try it live:

- [OpenADA checker](https://openada.us/)
- [Public directory](https://openada.us/directory)
- [Solodev archive](https://openada.us/directory/www.solodev.com)
- [Public API reference](https://openada.us/api-reference)
- [ADA guidance](https://openada.us/docs)

### Why This Wins

**Technological implementation.** OpenADA is a real, deployed service rather than a static demo. Codex was used as an engineering collaborator across the full loop: understanding the existing CMS provider contract, shaping the API, building the crawler and durable scan workflow, iterating on the UI, writing CloudFormation and container workflows, debugging production behavior, and verifying the live AWS deployment. The result is a working Next.js UI, API service, asynchronous scan worker, Redis-backed queue, DynamoDB archive, public widget, OpenAPI document, and Docker/GitHub Actions release path.

**Design.** The product has a complete workflow: a search-style URL entry point, a fast five-page default for first-time testing, adjustable crawl limits, progress feedback, a report route, a directory with latest scores, sorted page results, color-coded grades, page-level findings, historical scan selection, printable reports, API reference, and human-readable guidance. It is designed for repeated use by editors, developers, accessibility teams, and the public.

**Potential impact.** CMS teams should not need to install and maintain a separate Java service just to give authors spelling checks, or build a second accessibility pipeline for published pages. OpenADA gives Solodev CMS a stable provider endpoint today and gives WordPress, Drupal, custom build systems, public agencies, and site owners the same low-friction integration path. The public archive also makes accessibility progress visible over time instead of hiding every scan inside a private dashboard.

**Quality of the idea.** Most accessibility tools produce a private score and stop there. OpenADA combines accessibility, language quality, CMS integration, a public API, and an open web archive. The archive makes a website’s improvement legible: not just “what is my score now?”, but “which pages changed, what failed, and did the site improve from the last scan?” That public, time-based layer is the project’s distinctive idea.

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

Use Node.js 24 LTS for local development and container parity.

```bash
./cmd.sh install
./cmd.sh dev
```

For an automated local container smoke test, run `./cmd.sh compose-test`. It builds both images, waits for the API health check, verifies the UI, sends a combined ADA/language request, and tears the stack down afterward. Docker Engine and `curl` must be available locally.

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

`POST /api/v2/check` follows the LanguageTool `/v2/check` response shape. This is the compatibility endpoint used by Solodev CMS.

`POST /api/v1/scans` accepts a public `url`, runs both checks, and records the site, page, and scan in the public directory. Set `crawl: true` to follow same-host links from the starting page; the bounded crawl scans up to 100 pages (`maxPages`, default 50). `GET /api/v1/directory` lists recorded sites; add `?site=example.com` for its pages and recent scans. The machine-readable OpenAPI document is available at `/api/openapi`.

Every ADA result includes a letter grade derived from the numeric score: `A+` (97-100), `A` (93-96), `B` (85-92), `C` (70-84), `D` (50-69), or `F` (0-49). Public scans are enabled by default in the standalone template; set `OPENADA_PUBLIC_SCANS_ENABLED=false` to disable them, or set `OPENADA_SCAN_ALLOWED_HOSTS=example.com,another.example` to limit allowed hosts. `OPENADA_API_KEYS` protects scan submissions when configured.

Set `OPENADA_API_KEYS` to a comma-separated list to require `Authorization: Bearer <key>` or `X-API-Key: <key>`. Set `OPENADA_CORS_ORIGINS` to a comma-separated allowlist in production.

## Solodev CMS Integration

The CMS already resolves the active `languagetool` provider setting and posts editor text to `{endpoint_url}/v2/check`. Configure the provider’s `endpoint_url` to the OpenADA API base URL, for example:

```text
https://openada.example.com/api
```

The CMS then calls `https://openada.example.com/api/v2/check`; no local LanguageTool container is required. Keep `axe_core` enabled for editor-side browser feedback, and use OpenADA’s `/api/v1/ada/check` for server-side, batch, or remote page audits.

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

## GitHub Container Publishing

`.github/workflows/publish-containers.yml` publishes both images to ECR on pushes to `main`/`master` and on `v*` tags. Configure:

- GitHub Actions secret `AWS_ROLE_TO_ASSUME`, an IAM role trusted by GitHub's OIDC provider
- Optional repository variables `AWS_REGION`, `OPENADA_UI_REPOSITORY`, and `OPENADA_API_REPOSITORY`

The role needs ECR repository, image upload, and CloudFormation deployment permissions only if you extend the workflow to deploy the stack. The current workflow publishes images; deployment remains an explicit `./cft.sh deploy` step.

`.github/workflows/publish-dockerhub.yml` publishes public images on `v*` tags or manual dispatch:

```text
docker.io/techcto/openada-ui:<version>
docker.io/techcto/openada-api:<version>
```

Configure GitHub secrets `DOCKERHUB_USERNAME=techcto` and `DOCKERHUB_TOKEN` with a Docker Hub access token. Use ECR images for the AWS stack when possible; Docker Hub images remain useful for public discovery and local testing.

## Contest Note

OpenADA is intentionally focused: it contains only the UI, API, scan worker, deployment, documentation, and public widget needed to make the service real. It does not carry inherited CMS modules or a local LanguageTool runtime.

See [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) for the open-source notices for axe-core, LanguageTool, and Playwright.
