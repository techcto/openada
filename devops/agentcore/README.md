# OpenADA MCP AgentCore Quickstart

Connect Amazon Bedrock AgentCore Runtime to OpenADA's accessibility,
language-quality, public-scan, and improvement-history tools through a
stateless Model Context Protocol server.

[Subscribe to OpenADA MCP AgentCore in AWS Marketplace](https://aws.amazon.com/marketplace/pp/prodview-2bjfvhksfwuwq)
in the AWS account where you will run the service. The public launch template
is hosted in the product's S3 distribution bucket; choose an AWS Region where
Amazon Bedrock AgentCore Runtime is available and where the OpenADA endpoint
can be reached.

<a href="https://console.aws.amazon.com/cloudformation/home#/stacks/create/review?templateURL=https://openada-us.s3.amazonaws.com/cloudformation/openada-agentcore-runtime.yaml&amp;stackName=openada-agentcore"><img src="https://raw.githubusercontent.com/solodev/aws/master/pages/images/solodev-launch-btn.png" width="200" alt="Launch the OpenADA MCP AgentCore runtime stack" /></a>

The button opens the CloudFormation launch form with `openada-agentcore` as
the suggested stack name. Subscribe before launching, keep the prefilled
container image, and complete the OpenADA connection settings.

## What This Stack Does

OpenADA MCP AgentCore is a managed AI-agent integration layer. It gives an
Amazon Bedrock AgentCore agent an MCP connection to OpenADA without requiring
you to operate a separate MCP gateway.

The runtime forwards requests to an OpenADA service selected by you:

- the hosted public service at `https://openada.us/mcp`; or
- a private OpenADA ECS deployment in your AWS account.

OpenADA performs the accessibility checks, language checks, bounded website
scans, durable scan tracking, and public directory operations. AgentCore
provides the managed runtime, AWS authentication boundary, and agent
integration.

## Before You Launch

1. Subscribe to [OpenADA MCP AgentCore in AWS Marketplace](https://aws.amazon.com/marketplace/pp/prodview-2bjfvhksfwuwq).
2. Choose the AWS Region where you want the AgentCore runtime and OpenADA
   connection to run. The CloudFormation console opens in its current Region;
   change it before creating the stack when necessary.
3. Decide whether the runtime will connect to the hosted public service or a
   private OpenADA MCP endpoint.
4. If using a private endpoint, subscribe to [OpenADA Private](https://aws.amazon.com/marketplace/pp/prodview-uggjdlrhsme2e)
   and launch that ECS service first.
5. Make sure the deployment identity can create the IAM roles, Lambda
   provisioner, CloudWatch log resources, and AgentCore runtime resources in
   the selected account.

## CloudFormation Settings

The launch form contains these settings:

| Setting | Required | Value |
| --- | --- | --- |
| `ContainerImageUri` | Yes | Leave the Marketplace-provided default unchanged. |
| `OpenAdaMcpUrl` | Yes | `https://openada.us/mcp` for the public service, or the HTTPS MCP URL of a private OpenADA deployment. |
| `OpenAdaApiKey` | Conditional | The API key for a protected private OpenADA deployment. Leave empty only for an intentionally anonymous endpoint. |
| `NetworkMode` | Yes | `PUBLIC` for an internet-accessible HTTPS endpoint, or `VPC` for a private OpenADA endpoint. |
| `VpcSubnets` | VPC only | Comma-separated private subnet IDs that can reach OpenADA. |
| `VpcSecurityGroups` | VPC only | Comma-separated security groups that allow HTTPS traffic to OpenADA. |

The template creates the AgentCore runtime, its execution role, a runtime
provisioner, and CloudWatch logging permissions. It does not create the
OpenADA ECS service, Redis queue, or DynamoDB archive.

## Connecting To OpenADA Private

When launching [OpenADA Private](https://aws.amazon.com/marketplace/pp/prodview-uggjdlrhsme2e),
set its `ApiKeys` parameter to a long random value. Use the same value as
`OpenAdaApiKey` in this stack. OpenADA accepts that value as either:

```text
Authorization: Bearer <key>
X-API-Key: <key>
```

Generate a value locally with:

```bash
openssl rand -hex 32
```

Use the private service's HTTPS MCP URL as `OpenAdaMcpUrl`. For a private ALB,
choose `NetworkMode=VPC`, select subnets with a route to the OpenADA service,
and allow HTTPS from the AgentCore security group to the OpenADA security
group.

## Using The Runtime

After CloudFormation completes, connect the runtime to an Amazon Bedrock agent
or another supported AgentCore client. The runtime exposes:

- `GET /ping` for health checks;
- `POST /mcp` for stateless Streamable HTTP MCP requests; and
- the OpenADA tools for page checks, site scans, scan progress, public
  directory results, and historical comparisons.

## Test Without A Chat UI

The AWS console's generic AgentCore example uses a `prompt` field. OpenADA is
an MCP server, so send JSON-RPC messages instead. In AWS, open **Amazon
Bedrock AgentCore > Agents > Runtime**, select the runtime, choose the
`DEFAULT` endpoint, and select **Test**. The direct URL format is:

```text
https://<region>.console.aws.amazon.com/bedrock-agentcore/agents/<runtime-id>/test
```

Leave Session ID empty for the first request and run these requests in order.

For the current OpenADA smoke-test runtime, the direct AWS console test page is:

<https://us-east-1.console.aws.amazon.com/bedrock-agentcore/agents/openada_agentcore_test-J7KdSNCs5r/test>

Use the runtime created in your own account for a customer deployment; this
link is provided so an AWS Marketplace reviewer can follow the exact console
workflow without searching for the test runtime.

Initialize the MCP connection:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-06-18",
    "capabilities": {},
    "clientInfo": {
      "name": "aws-console",
      "version": "1.0.0"
    }
  }
}
```

List the available tools:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list",
  "params": {}
}
```

Check a public page:

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "openada_check_page",
    "arguments": {
      "url": "https://openada.us/"
    }
  }
}
```

For a repeatable terminal smoke test, use the AWS CLI. The caller needs
`bedrock-agentcore:InvokeAgentRuntime` for the runtime ARN. Replace the ARN
and Region with the outputs from your stack:

```bash
export OPENADA_AGENTCORE_RUNTIME_ARN='arn:aws:bedrock-agentcore:REGION:ACCOUNT_ID:runtime/RUNTIME_ID'
export AWS_REGION='us-east-1'

aws bedrock-agentcore invoke-agent-runtime \
  --agent-runtime-arn "$OPENADA_AGENTCORE_RUNTIME_ARN" \
  --content-type 'application/json' \
  --accept 'application/json, text/event-stream' \
  --mcp-protocol-version '2025-06-18' \
  --payload '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"openada-smoke-test","version":"1.0.0"}}}' \
  /tmp/openada-agentcore-initialize.txt \
  --cli-binary-format raw-in-base64-out

cat /tmp/openada-agentcore-initialize.txt
```

Once initialization returns HTTP 200, paste this payload into the same console
input to discover tools:

```json
{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}
```

Then call `openada_check_page` with the page-check payload above. The response
is Streamable HTTP SSE, so look for the `data:` line in the output file. A
successful result contains `sourceUrl`, an ADA numeric score, a letter grade,
and the accessibility and language findings. Site scans return a job ID
immediately; call `openada_get_scan_status` with that job ID until the status
is `completed` or `failed`.

For a visual protocol inspector, run `npx @modelcontextprotocol/inspector` and
connect it to the OpenADA MCP endpoint. Use `https://openada.us/mcp` for the
hosted public service or the private deployment's MCP URL when testing the
full private path. The AgentCore runtime itself is authenticated by AWS
SigV4; do not put AWS credentials in the MCP JSON body.

Example requests to an agent include:

- Check this public page for accessibility and language findings.
- Scan this website and report progress until the crawl is complete.
- Show the latest score and the previous scan for this site.
- Compare this page's findings across its historical scans.

The runtime is stateless. Scan jobs, findings, page records, and history remain
in the selected OpenADA service.

## Authentication And Network Security

AWS IAM and SigV4 apply at the AgentCore invocation boundary. The caller uses
an AWS-authenticated AgentCore client; AWS signs the runtime request. AWS
credentials are not placed in the MCP request body or the container image.

The gateway uses `OpenAdaApiKey` only for its outbound request to a protected
OpenADA endpoint. Store it as a protected CloudFormation parameter and do not
put it in source control.

For `PUBLIC` mode, the OpenADA endpoint must be reachable over HTTPS from the
runtime. For `VPC` mode, provide private subnets and security groups with the
required routes, DNS resolution, and HTTPS connectivity. The runtime also
needs the normal AWS permissions for image pulls and CloudWatch Logs.

## Limitations

- Automated findings do not cover every WCAG or ADA requirement.
- A scan result is engineering guidance, not a legal opinion, certification,
  or substitute for human accessibility testing.
- Site crawls are asynchronous and bounded by the OpenADA deployment's scan
  settings.
- Customer-managed OpenADA Private deployments are responsible for their AWS
  networking, retention, credentials, and operating costs.

## Support And Documentation

- Product site: https://openada.us
- MCP connection guide: https://openada.us/docs/mcp
- API reference: https://openada.us/api-reference
- Accessibility guidance: https://openada.us/docs
- Source repository: https://github.com/techcto/openada
- Issue tracking: https://github.com/techcto/openada/issues
- AgentCore MCP contract: https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-mcp-protocol-contract.html
- AgentCore VPC configuration: https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/agentcore-vpc.html
