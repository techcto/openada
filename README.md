# OpenADA

[![CI](https://github.com/techcto/openada/actions/workflows/ci.yml/badge.svg)](https://github.com/techcto/openada/actions/workflows/ci.yml)
[![Publish Containers](https://github.com/techcto/openada/actions/workflows/publish-containers.yml/badge.svg)](https://github.com/techcto/openada/actions/workflows/publish-containers.yml)
[![Open in GitHub](https://img.shields.io/badge/Open%20in-GitHub-181717?logo=github)](https://github.com/techcto/openada)
[![Run Container Publish](https://img.shields.io/badge/Run%20container%20publish-GitHub%20Actions-2088FF?logo=githubactions&logoColor=white)](https://github.com/techcto/openada/actions/workflows/publish-containers.yml)

OpenADA is a small hosted service for accessibility and language quality checks. It gives CMS products one stable API for WCAG audits and LanguageTool-compatible spelling and grammar checks.

## What It Does

- Runs `axe-core` against submitted HTML in the API container.
- Returns LanguageTool-compatible results from `POST /api/v2/check`.
- Supports a combined `POST /api/v1/check` request for HTML editors and page workflows.
- Runs as two containers: a Next.js UI and a Next.js API, with a small DynamoDB-backed public scan directory.
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
The public scan directory is available at `http://localhost:3000/directory`, and the API reference is at `http://localhost:3000/api-reference`.

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

`POST /api/v1/scans` accepts a public `url`, runs both checks, and records the site, page, and scan in the public directory. Set `crawl: true` to follow same-host links from the starting page; the bounded crawl scans up to 10 pages (`maxPages`, default 5). `GET /api/v1/directory` lists recorded sites; add `?site=example.com` for its pages and recent scans. The machine-readable OpenAPI document is available at `/api/openapi`.

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
- UI and API target groups with health checks
- Private Cloud Map DNS for UI-to-API calls
- CloudWatch log groups for both containers
- Three on-demand DynamoDB tables for sites, pages, and immutable scan records
- Optional ACM HTTPS listener

Build and publish `openada-ui` and `openada-api` images, then deploy the stack with the image URIs, VPC, public subnets, and private service subnets. The template does not install Java LanguageTool, MySQL, Redis, or a local service. DynamoDB stores only public directory metadata and scan summaries; Redis or OpenSearch can be added later as cache/search layers.

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

OpenADA is intentionally self-contained: it has no database, queue, local LanguageTool runtime, or inherited application modules.
