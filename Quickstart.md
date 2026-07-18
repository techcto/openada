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

OpenADA Private is the customer-deployed ECS product. Use the same AWS account
for the Marketplace subscription and the CloudFormation launch.

1. [Subscribe to OpenADA Private in AWS Marketplace](https://aws.amazon.com/marketplace/pp/prodview-uggjdlrhsme2e).
2. Choose an AWS Region where the OpenADA Marketplace delivery is available,
   then choose the deployment that matches your account. The launch links open
   the CloudFormation console in `us-east-1` because the public templates are
   hosted there; switch to your target deployment Region before creating the
   stack when necessary:

<table>
  <tr>
    <td width="50%"><strong>New ECS environment</strong><br />Creates a complete standalone OpenADA stack.<br /><br /><a href="https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/create/review?templateURL=https://openada-us.s3.us-east-1.amazonaws.com/cloudformation/openada.yaml&amp;stackName=openada"><img src="https://raw.githubusercontent.com/solodev/aws/master/pages/images/solodev-launch-btn.png" width="200" alt="Launch a new OpenADA ECS environment" /></a></td>
    <td width="50%"><strong>Existing ECS environment</strong><br />Adds OpenADA services to an existing environment.<br /><br /><a href="https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/create/review?templateURL=https://openada-us.s3.us-east-1.amazonaws.com/cloudformation/openada-existing.yaml&amp;stackName=openada-existing"><img src="https://raw.githubusercontent.com/solodev/aws/master/pages/images/solodev-launch-btn.png" width="200" alt="Launch OpenADA in an existing ECS environment" /></a></td>
  </tr>
</table>

3. Keep the prefilled Marketplace image defaults. Do not replace them with Docker
   Hub images or local image names.
4. Complete the required VPC, subnet, load balancer, cluster, and Redis fields
   shown by the selected template, then acknowledge IAM resource creation and
   create the stack.
5. Open the `WebsiteUrl` output after the ECS services report healthy.

For `ApiKeys`, leave the field blank only when intentionally running an
anonymous public demo. For a private or production deployment, generate a
random value and paste it into the hidden CloudFormation field:

```bash
openssl rand -hex 32
```

The resulting value becomes `OPENADA_API_KEYS`. Clients use it as
`Authorization: Bearer <key>` or `X-API-Key: <key>`. If AgentCore connects to
this private deployment, use the same value for its `OpenAdaApiKey` setting.

The [OpenADA Private CloudFormation Quickstart](devops/cloudformation/README.md)
lists the exact fields for both deployment modes, HTTPS, API keys, scan limits,
and post-launch checks.

The standalone product includes the UI, API, asynchronous scan worker, Redis
queue, DynamoDB directory archive, CloudWatch logs, and an Application Load
Balancer. Private deployments can require API keys and restrict crawl hosts.

## Connect AgentCore

[Subscribe to OpenADA MCP AgentCore in AWS Marketplace](https://aws.amazon.com/marketplace/pp/prodview-2bjfvhksfwuwq), then use the
[OpenADA MCP AgentCore Quickstart](devops/agentcore/README.md).

<a href="https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/create/review?templateURL=https://openada-us.s3.us-east-1.amazonaws.com/cloudformation/openada-agentcore-runtime.yaml&amp;stackName=openada-agentcore"><img src="https://raw.githubusercontent.com/solodev/aws/master/pages/images/solodev-launch-btn.png" width="200" alt="Launch the OpenADA MCP AgentCore runtime stack" /></a>

Use [OpenADA Private Quickstart](devops/cloudformation/README.md) for the ECS
service, or [OpenADA MCP AgentCore Quickstart](devops/agentcore/README.md) for
the stateless AI-agent gateway.

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
