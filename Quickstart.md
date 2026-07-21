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

## Prepare OpenADA Private

OpenADA Private is the planned customer-deployed ECS product. Its CloudFormation
templates are prepared for a future Marketplace release; the currently live
options are the public service/API and the approved AgentCore product.

1. Choose an AWS Region where you plan to run the ECS deployment, then choose
   the deployment that matches your account. The launch links use
   the CloudFormation console's current Region and a global S3 URL for the
   public template. Select your target deployment Region before creating the
   stack:

<table>
  <tr>
    <td width="50%"><strong>New ECS environment</strong><br />Creates a complete standalone OpenADA stack.<br /><br /><a href="https://console.aws.amazon.com/cloudformation/home#/stacks/create/review?templateURL=https://openada-us.s3.amazonaws.com/cloudformation/openada.yaml&amp;stackName=openada"><img src="https://raw.githubusercontent.com/solodev/aws/master/pages/images/solodev-launch-btn.png" width="200" alt="Launch a new OpenADA ECS environment" /></a></td>
    <td width="50%"><strong>Existing ECS environment</strong><br />Adds OpenADA services to an existing environment.<br /><br /><a href="https://console.aws.amazon.com/cloudformation/home#/stacks/create/review?templateURL=https://openada-us.s3.amazonaws.com/cloudformation/openada-existing.yaml&amp;stackName=openada-existing"><img src="https://raw.githubusercontent.com/solodev/aws/master/pages/images/solodev-launch-btn.png" width="200" alt="Launch OpenADA in an existing ECS environment" /></a></td>
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

[Subscribe to OpenADA MCP AgentCore in AWS Marketplace](https://aws.amazon.com/marketplace/pp/prodview-2bjfvhksfwuwq?sr=0-1&ref_=ucaf&applicationId=AWSMPContessa), then use the
[OpenADA MCP AgentCore Quickstart](devops/agentcore/README.md).

<a href="https://console.aws.amazon.com/cloudformation/home#/stacks/create/review?templateURL=https://openada-us.s3.amazonaws.com/cloudformation/openada-agentcore-runtime.yaml&amp;stackName=openada-agentcore"><img src="https://raw.githubusercontent.com/solodev/aws/master/pages/images/solodev-launch-btn.png" width="200" alt="Launch the OpenADA MCP AgentCore runtime stack" /></a>

Use [OpenADA Private Quickstart](devops/cloudformation/README.md) for the ECS
service, or [OpenADA MCP AgentCore Quickstart](devops/agentcore/README.md) for
the stateless AI-agent gateway.

The public MCP endpoint has also been verified as a custom connection in
ChatGPT Developer Mode and Claude's **Add custom connector** flow. Use
`https://openada.us/mcp` and follow the client-specific steps in the
[MCP connection guide](https://openada.us/docs/mcp).

Configure:

```text
OPENADA_MCP_URL=https://openada.us/mcp
OPENADA_API_KEY=
```

For a private OpenADA deployment, set `OPENADA_MCP_URL` to its HTTPS MCP
endpoint and set `OPENADA_API_KEY` to the same value configured as the private
stack's `ApiKeys` parameter. AgentCore handles IAM and SigV4 at the runtime
boundary; the gateway does not need AWS access keys.

### Test AgentCore Without A Chat UI

In AWS, open **Amazon Bedrock AgentCore > Agents > Runtime**, select the
runtime, choose `DEFAULT`, and select **Test**. The direct URL format is:

```text
https://<region>.console.aws.amazon.com/bedrock-agentcore/agents/<runtime-id>/test
```

Leave Session ID blank and paste these MCP JSON-RPC requests in order:

```json
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"aws-console","version":"1.0.0"}}}
```

```json
{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}
```

```json
{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"openada_check_page","arguments":{"url":"https://openada.us/"}}}
```

The last request should return an ADA score, letter grade, and accessibility
and language findings. For a site crawl, call `openada_scan_site`, save the
returned job ID, and call `openada_get_scan_status` until the status is
`completed` or `failed`. The full AgentCore walkthrough is in
[`devops/agentcore/README.md`](devops/agentcore/README.md).

## API And MCP

- [API reference](https://openada.us/api-reference)
- [MCP connection guide](https://openada.us/docs/mcp)
- [ADA guidance](https://openada.us/docs)
- [Public directory](https://openada.us/directory)
- [Source repository](https://github.com/techcto/openada)

OpenADA results are engineering signals for remediation. They are not a legal
opinion, ADA certification, or substitute for manual accessibility testing.
