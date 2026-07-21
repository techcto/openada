# OpenADA Private Quickstart

OpenADA Private is the prepared, upcoming customer-owned ECS deployment for a
complete web-accessibility service with a UI, API, asynchronous scan worker,
Redis queue, and durable DynamoDB scan history. Marketplace approval for this
product is still pending.

Choose the AWS Region where you plan to run the ECS services. The launch links
use the CloudFormation console's current Region and a global S3 URL for the
public template. Select your target deployment Region in the AWS console before
creating the stack.

## Choose A Deployment

Use **New ECS environment** when OpenADA should create its own ECS cluster,
load balancer, Redis queue, services, and supporting resources.

Use **Existing ECS environment** when the account already has an ECS cluster,
ALB, listener, service subnets, and a reachable Redis endpoint. OpenADA then
adds its UI, API, worker, task definitions, target groups, listener rules,
task roles, logs, and DynamoDB tables to that environment.

## Before You Launch

- Choose a deployment Region and use it consistently for
  the stack, ECS services, ALB, Redis, DynamoDB tables, logs, and ACM
  certificate.
- Use an AWS identity that can create the resources requested by the selected
  template, including ECS, IAM roles, EC2 security groups, Elastic Load
  Balancing, CloudWatch Logs, DynamoDB, and ElastiCache where applicable.
- Accept the IAM capability in the CloudFormation launch flow.
- For a new environment, have a VPC, public subnets in at least two
  availability zones, and service subnets with NAT or equivalent outbound
  access. ECS needs outbound access for Marketplace image pulls, logs, and
  public-page scans.
- For an existing environment, have an ECS cluster, an ALB listener, an ALB
  security group, service subnets, and a Redis endpoint reachable from those
  subnets. Listener priorities `100`, `101`, and `102` must be unused.
- For HTTPS, have an ACM certificate in the same Region as the ALB that covers
  the hostname you will use.

## Launch A New ECS Environment

Provide the VPC and subnet values requested by the form. The template creates
the ECS cluster, ALB, Redis queue, security groups, task roles, UI/API/worker
services, and DynamoDB directory tables.

<a href="https://console.aws.amazon.com/cloudformation/home#/stacks/create/review?templateURL=https://openada-us.s3.amazonaws.com/cloudformation/openada.yaml&amp;stackName=openada"><img src="https://raw.githubusercontent.com/solodev/aws/master/pages/images/solodev-launch-btn.png" width="200" alt="Launch a new OpenADA ECS environment" /></a>

Required network values include:

- `VpcId`
- at least two public subnets for the ALB
- service subnets with NAT or equivalent outbound access

Set `CertificateArn` for HTTPS. The certificate must be in the same Region as
the stack and cover the hostname that will point to the ALB.

## Add OpenADA To An Existing ECS Environment

Provide the existing environment values in the form. This template does not
create or modify the existing ECS cluster, VPC, ALB, or Redis infrastructure.

<a href="https://console.aws.amazon.com/cloudformation/home#/stacks/create/review?templateURL=https://openada-us.s3.amazonaws.com/cloudformation/openada-existing.yaml&amp;stackName=openada-existing"><img src="https://raw.githubusercontent.com/solodev/aws/master/pages/images/solodev-launch-btn.png" width="200" alt="Launch OpenADA in an existing ECS environment" /></a>

Required existing-environment values include:

- `VpcId`
- `Cluster`
- `LoadBalancerSecurityGroup`
- `ListenerArn`
- `ServiceSubnets`
- `HostHeader`, using a hostname covered by the existing ALB certificate
- `RedisHost`

Create a DNS record for `HostHeader` that points to the existing ALB. If the
default listener priorities are already in use, choose unused priorities in
the CloudFormation form.

## Security And API Keys

Keep the prefilled `UiImage`, `ApiImage`, and `WorkerImage` values unchanged.
They identify the subscribed Marketplace container delivery.

Set `ApiKeys` to a long random value before enabling access beyond a trusted
test. The value protects REST and MCP requests. It is not an AWS access key or
container registry credential.

Generate a value locally with:

```bash
openssl rand -hex 32
```

OpenADA accepts the configured value as either:

```text
Authorization: Bearer <key>
X-API-Key: <key>
```

The public directory experience is enabled by default. Set
`PublicScansEnabled` to `false` for a private-only service, or set
`ScanAllowedHosts` to a comma-separated allowlist of hosts that may be scanned.

## After The Stack Is Created

1. Wait for the UI, API, and worker ECS services to become healthy.
2. Open the `WebsiteUrl` stack output.
3. Verify the API at `<WebsiteUrl>/api/health`.
4. Open the public checker, paste a page or website URL, and choose a crawl
   size.
5. Use the directory to browse the latest completed score, dated scans, page
   findings, and historical improvement.

The API returns quickly when a site scan is submitted. The worker crawls
bounded same-host pages through Redis, records progress and failures, runs the
accessibility and language checks, and saves the completed report in DynamoDB.

## What OpenADA Provides

- A web UI for page checks and bounded website scans.
- A combined REST API for accessibility and language-quality checks.
- LanguageTool-compatible language checking.
- axe-core accessibility findings.
- An asynchronous crawler with progress updates.
- A public directory of sites, scans, pages, scores, and findings.
- Date-based scan history so teams can compare improvement over time.
- MCP access for AI tools, including the separate
  [OpenADA MCP AgentCore](../agentcore/README.md) product.

Automated findings are engineering guidance. They do not constitute a legal
opinion, ADA certification, or substitute for human accessibility testing.

## Existing Environment Network Notes

The UI and API are routed by the configured host header. The ECS service
subnets need to reach Redis and the public internet or approved scan targets.
The task execution role needs normal ECS image-pull and CloudWatch Logs access.
The load balancer security group must allow the intended public HTTPS traffic,
and the service security group must allow traffic from the load balancer.

For a private OpenADA MCP deployment, use the stack's HTTPS hostname and the
same `ApiKeys` value when configuring AgentCore's `OpenAdaMcpUrl` and
`OpenAdaApiKey` parameters.

## Support And Documentation

- Product site: https://openada.us
- MCP connection guide: https://openada.us/docs/mcp
- API reference: https://openada.us/api-reference
- Accessibility guidance: https://openada.us/docs
- Source repository: https://github.com/techcto/openada
- Issue tracking: https://github.com/techcto/openada/issues
