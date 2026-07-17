# OpenADA Quickstart

OpenADA provides accessibility and language-quality checks for public web pages,
websites, APIs, and AI-agent workflows.

## Try The Hosted Service

1. Open the [public checker](https://openada.us/).
2. Paste a public page or website URL.
3. Choose the number of same-site pages to crawl.
4. Select **Scan site** and follow the progress page to the dated report.

The hosted MCP endpoint is `https://openada.us/mcp`. The public demo is
anonymous and is intended for public-page testing.

## Run Locally

Requirements: Docker Desktop with Compose.

```bash
docker compose up --build
```

Open the UI at `http://localhost:3000` and the API at
`http://localhost:3001/api/health`.

## Deploy OpenADA Private

[Subscribe to OpenADA Private in AWS Marketplace](https://aws.amazon.com/marketplace/pp/prodview-uggjdlrhsme2e), then choose one of the public CloudFormation launch paths:

- [New ECS environment](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/create/review?templateURL=https://openada-us.s3.us-east-1.amazonaws.com/cloudformation/openada.yaml)
- [Existing ECS environment](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/create/review?templateURL=https://openada-us.s3.us-east-1.amazonaws.com/cloudformation/openada-existing.yaml)

Use the [OpenADA Private CloudFormation Quickstart](devops/cloudformation/README.md)
for VPC, subnet, Redis, HTTPS, API-key, and existing-cluster requirements.

The standalone product includes the UI, API, asynchronous scan worker, Redis
queue, DynamoDB directory archive, CloudWatch logs, and an Application Load
Balancer. Private deployments can require API keys and restrict crawl hosts.

## Connect AgentCore

[Subscribe to OpenADA MCP AgentCore in AWS Marketplace](https://aws.amazon.com/marketplace/pp/prodview-2bjfvhksfwuwq), then use the
[OpenADA MCP AgentCore Quickstart](devops/agentcore/README.md).

Configure:

```text
OPENADA_MCP_URL=https://openada.us/mcp
OPENADA_API_KEY=
```

For a private OpenADA deployment, set `OPENADA_MCP_URL` to its HTTPS MCP
endpoint and set `OPENADA_API_KEY` to the same value configured as the private
stack's `ApiKeys` parameter. AgentCore handles IAM and SigV4 at the runtime
boundary; the gateway does not need AWS access keys.

## API And MCP

- [API reference](https://openada.us/api-reference)
- [MCP connection guide](https://openada.us/docs/mcp)
- [ADA guidance](https://openada.us/docs)
- [Public directory](https://openada.us/directory)
- [Source repository](https://github.com/techcto/openada)

OpenADA results are engineering signals for remediation. They are not a legal
opinion, ADA certification, or substitute for manual accessibility testing.
