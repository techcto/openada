# OpenADA MCP AgentCore

Marketplace listing draft and deployment handoff for **OpenADA MCP AgentCore**.

Configure the private Marketplace product identifier as the
`MP_AWS_AGENTCORE_PRODUCT_ID` repository variable. Marketplace product metadata
is kept out of the public repository; the changeset uses that private variable
when a release is submitted.

## Product Name

OpenADA MCP AgentCore

## Short Description

Connect Amazon Bedrock AgentCore to OpenADA's accessibility, language-quality, public scan, and improvement-history tools through a stateless Model Context Protocol server.

## Recommended Marketplace Configuration

- **Delivery method:** Container image
- **Compatible service:** Amazon Bedrock AgentCore Runtime
- **Agentic type:** MCP server
- **Container architecture:** `linux/arm64` (required by the current AgentCore MCP container contract)
- **Container port:** `8000`
- **MCP transport:** Stateless Streamable HTTP
- **Health endpoint:** `GET /ping`
- **MCP endpoint:** `POST /mcp`

## Product Overview

OpenADA MCP AgentCore gives AI agents a governed interface to OpenADA's public-web accessibility and language-quality capabilities. It is designed for organizations that want to use OpenADA from Amazon Bedrock AgentCore without operating a separate MCP server or building a custom integration.

The product is a lightweight MCP gateway. It forwards MCP requests to an OpenADA service selected by the customer:

- the hosted public OpenADA service for evaluation and public-page checks; or
- a private OpenADA ECS deployment for organization-controlled data paths and API policies.

OpenADA remains the system that performs the accessibility checks, language checks, bounded scans, durable scan tracking, and public directory operations. AgentCore supplies the managed runtime, agent integration, scaling, and AWS-native execution boundary.

## Customer Value

Public agencies, developers, and accessibility teams can ask an AI agent to:

- check a public page for accessibility findings;
- identify language-quality issues;
- start a bounded same-host website scan;
- monitor scan progress and retrieve the final report;
- browse public site scores and scan history; and
- compare page findings over time.

The service provides engineering signals and remediation guidance. It is not a legal determination, ADA certification, or substitute for human accessibility testing.

## Architecture

```text
Amazon Bedrock AgentCore Runtime
            |
            | MCP over stateless Streamable HTTP
            v
OpenADA MCP AgentCore container
            |
            | HTTPS, optional bearer authentication
            v
OpenADA MCP endpoint
            |
            v
OpenADA API, scan worker, Redis queue, and DynamoDB archive
```

The AgentCore container does not own the OpenADA database, Redis queue, or scan worker. This keeps the AgentCore product small and stateless while allowing it to sit on top of either the hosted service or a private OpenADA deployment.

## Runtime Configuration

The AgentCore runtime should provide these environment variables:

| Variable | Required | Description |
| --- | --- | --- |
| `OPENADA_MCP_URL` | Yes | OpenADA MCP endpoint, for example `https://openada.us/mcp` or a private deployment URL. |
| `OPENADA_API_KEY` | No | Bearer key for a protected OpenADA deployment. Leave empty for the anonymous public demo. |

The gateway listens on `0.0.0.0:8000`. AgentCore health checks use `GET /ping`; MCP clients use `POST /mcp`.

### Where The OpenADA API Key Comes From

For the private ECS product, set the `ApiKeys` parameter when launching or
updating `openada.yaml` or `openada-existing.yaml`. The API container receives
that value as `OPENADA_API_KEYS`. Generate a long random value, store it in your
secret manager, and use the same value as `OpenAdaApiKey` when launching this
AgentCore product. OpenADA accepts it as either `Authorization: Bearer <key>` or
`X-API-Key: <key>`.

For a one-time value, generate one locally with:

```bash
openssl rand -hex 32
```

The public `https://openada.us/mcp` demo is anonymous, so it does not require an
`OpenAdaApiKey`. Protected customer deployments should always set one.

## Authentication And SigV4

SigV4 is handled at the Amazon Bedrock AgentCore Runtime boundary. Customers invoke
the deployed runtime with an AWS SDK, CLI, or another AWS-integrated client using
IAM permissions; AWS signs that runtime request with SigV4 before AgentCore forwards
the MCP payload to the container. The gateway does not need AWS access keys and does
not need to reimplement SigV4 verification for normal AgentCore use.

The gateway has a separate outbound authentication hop to OpenADA:

- Set `OPENADA_API_KEY` when the selected OpenADA endpoint requires `Authorization:
  Bearer <key>` or `X-API-Key: <key>`.
- Leave it empty only when connecting to an intentionally anonymous OpenADA endpoint.
- Never place AWS credentials or OpenADA keys in the image or source repository.

The AgentCore execution role needs permission to pull the image and write runtime
logs. The IAM principal invoking the runtime needs the appropriate scoped
`bedrock-agentcore:InvokeAgentRuntime` permission (and the command invocation
permission when that API is used) on the deployed runtime ARN. Use IAM roles or
federated credentials for these calls instead of long-lived keys in application
configuration.

This product does not require a custom `mcp-aws-v1` token or an STS presigned-URL
verifier. That pattern can be added later only if OpenADA exposes a separate direct
caller endpoint outside AgentCore; it is not part of the AgentCore container
contract.

## Customer Deployment

1. Subscribe to **OpenADA MCP AgentCore** in AWS Marketplace.
2. Choose **Launch with Amazon Bedrock AgentCore Runtime**.
3. Set `OPENADA_MCP_URL` to the hosted or private OpenADA MCP endpoint.
4. Set `OPENADA_API_KEY` when the selected OpenADA deployment requires authentication.
5. Create the AgentCore runtime and connect it to the customer agent or orchestrator.
6. Ask the agent to check a page or start a site scan.

For programmatic invocation, use an AWS-authenticated AgentCore client with an IAM
role that is allowed to invoke this runtime. SigV4 belongs on that AWS service call,
not in the MCP JSON-RPC body.

For a private deployment, launch OpenADA first with the OpenADA ECS CloudFormation template, configure its DNS and HTTPS endpoint, then use that endpoint as `OPENADA_MCP_URL`.

When the OpenADA endpoint is internal to a VPC, choose `NetworkMode=VPC` and
provide private subnet IDs and security groups. Allow the selected AgentCore
security group to reach the OpenADA service security group on HTTPS. VPC mode
also requires the normal ECR, S3, CloudWatch Logs, DNS, and NAT or VPC endpoint
connectivity required by the selected AgentCore runtime configuration.

## Security And Privacy

- The gateway forwards requests only to the configured OpenADA MCP URL.
- API keys are supplied as runtime environment secrets and are not stored in source control.
- AWS SigV4 credentials remain with the invoking IAM identity and are not passed into
  the gateway container.
- The public OpenADA service accepts public URLs only and applies bounded crawl protections.
- A private OpenADA deployment can enforce API keys, CORS restrictions, allowed scan hosts, and its own AWS networking controls.
- Customers should review the OpenADA privacy policy, terms, and the privacy practices of any pages they submit for analysis.

## Limitations

- Automated accessibility findings do not cover every WCAG or ADA requirement.
- A scan result is not a legal opinion or compliance certification.
- The AgentCore gateway requires a reachable OpenADA MCP endpoint.
- Site crawls are asynchronous and bounded by the OpenADA deployment's scan settings.
- Customer-managed private OpenADA deployments are responsible for their own AWS costs, networking, credentials, and data-retention settings.

## Support And Documentation

- Product site: https://openada.us
- MCP connection guide: https://openada.us/docs/mcp
- API reference: https://openada.us/api-reference
- Accessibility guidance: https://openada.us/docs
- Source repository: https://github.com/techcto/openada
- Issue tracking: https://github.com/techcto/openada/issues
- AgentCore MCP contract: https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-mcp-protocol-contract.html
- AgentCore VPC configuration: https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/agentcore-vpc.html

## Listing Copy

### Product Description

OpenADA MCP AgentCore connects Amazon Bedrock AgentCore Runtime to OpenADA's accessibility and language-quality service through a stateless Model Context Protocol server. Give AI agents a practical way to check public pages, start bounded website scans, monitor progress, retrieve findings, and compare accessibility improvement over time.

The product runs as a managed AgentCore container and connects to either the hosted OpenADA service or a private OpenADA ECS deployment. Customers provide the OpenADA MCP URL and, when needed, a protected-deployment API key. No OpenADA database or crawler needs to be installed inside the AgentCore runtime.

OpenADA combines axe-core accessibility checks, LanguageTool-compatible language analysis, public scan history, durable asynchronous progress, and developer-friendly APIs. Results are engineering guidance for remediation and are not a legal determination or certification of ADA compliance.

### Suggested Search Terms

`accessibility`, `ADA`, `WCAG`, `web accessibility`, `language quality`, `MCP`, `Model Context Protocol`, `Amazon Bedrock AgentCore`, `website scanner`, `public sector accessibility`, `government website compliance`, `AI accessibility tools`

### Suggested Release Notes

Initial OpenADA MCP AgentCore release. Adds a stateless ARM64 MCP gateway for Amazon Bedrock AgentCore Runtime, IAM/SigV4 runtime invocation, configurable OpenADA endpoint routing, optional bearer authentication for private OpenADA deployments, `/ping` health checks, and access to OpenADA page checks, site scans, scan progress, and public directory tools.

## Separate From OpenADA Private

OpenADA MCP AgentCore is a separate Marketplace product from OpenADA Private. OpenADA Private is the full ECS deployment containing the UI, API, asynchronous worker, Redis queue, and DynamoDB archive. OpenADA MCP AgentCore is the managed AI-agent integration layer that sits on top of an OpenADA endpoint.
