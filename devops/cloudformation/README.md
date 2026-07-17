# OpenADA Private Quickstart

Deploy OpenADA Private from AWS Marketplace as a complete web-accessibility
service with a UI, API, asynchronous scan worker, Redis queue, and durable
DynamoDB scan history.

[Subscribe to OpenADA Private in AWS Marketplace](https://aws.amazon.com/marketplace/pp/prodview-uggjdlrhsme2e), then choose the deployment mode that matches your AWS environment:

OpenADA stores public directory metadata and asynchronous scan history in four on-demand DynamoDB tables: sites, pages, immutable scan summaries, and scan jobs. Site scans use BullMQ over Redis so the API returns immediately and the UI can reconnect to progress after a task restart.

| Mode | Command | Creates | Reuses |
| --- | --- | --- | --- |
| New standalone environment | `./cmd.sh cft-new deploy` | ECS cluster, ALB, Redis queue, worker, security groups, task services | Nothing |
| Existing environment | `./cmd.sh cft-existing deploy` | OpenADA services, worker, target groups, rules, task roles, logs, scan-jobs table | ECS cluster, ALB, VPC, subnets, reachable Redis |

The standalone mode is implemented by `openada.yaml`. The existing-environment mode is implemented by `openada-existing.yaml`. The standalone template creates a small Redis queue; the existing-environment template expects a reachable Redis endpoint.

## OpenADA MCP AgentCore

The separate `OpenADA MCP AgentCore` product is a stateless ARM64 gateway for Amazon Bedrock AgentCore Runtime. It forwards MCP requests to the OpenADA MCP endpoint supplied at launch and does not replace the ECS UI, API, worker, Redis, or DynamoDB services.

Use `devops/cloudformation/openada-agentcore-runtime.yaml` after the AgentCore container image has been published. Set `OpenAdaMcpUrl` to the private OpenADA MCP URL and `OpenAdaApiKey` to the same random value configured as `ApiKeys` on the private OpenADA stack. Select `NetworkMode=VPC` with private subnets and security groups when the OpenADA endpoint is internal to a VPC. AgentCore invocation uses AWS IAM/SigV4; the gateway does not need AWS access keys.

## Publish test images to AWS ECR

For a manual ECR image push, authenticate to the target registry and use a new
version tag. Marketplace repositories commonly use immutable tags, so do not
reuse a published version:

```bash
export AWS_REGION=us-east-1
export MP_AWS_ECR=709825985650.dkr.ecr.us-east-1.amazonaws.com
export OPENADA_UI_REPOSITORY=solodev/openada-ui
export OPENADA_API_REPOSITORY=solodev/openada-api
export OPENADA_WORKER_REPOSITORY=solodev/openada-worker
./cmd.sh docker push 0.1.10
```

The command builds and pushes the three `linux/amd64` images to AWS ECR. Normal
release tags use the GitHub Actions release workflow and publish the versioned
Marketplace images automatically.

## Publish CloudFormation files

The release workflow publishes rendered, versioned templates to `openada-us`. For a manual upload, use the same bucket:

```bash
export AWS_PROFILE=<your-aws-profile>
export OPENADA_CFT_BUCKET=openada-us
./cmd.sh cft-new publish
```

Both `cft-new deploy` and `cft-existing deploy` publish the CFT files before validating or deploying.

The release templates resolve their defaults to the versioned Marketplace images in `709825985650.dkr.ecr.us-east-1.amazonaws.com/solodev/*`. You can still override `UiImage`, `ApiImage`, and `WorkerImage` for a local or alternate registry deployment. The publishing identity needs `s3:PutObject` and `s3:AbortMultipartUpload` for the CloudFormation and widget prefixes, plus `s3:GetBucketLocation` for the bucket. A ready-to-attach policy is included at `devops/iam/openada-cft-publish-policy.json`.

The deployment identity also needs DynamoDB table lifecycle permissions (`CreateTable`, `DeleteTable`, `DescribeTable`, `UpdateTable`, continuous-backup, and tag actions) because CloudFormation creates the directory tables. These are included in `devops/iam/openada-deploy-policy.json`.

## Existing ECS cluster

Use `openada-existing.yaml` when the AWS account already has the VPC, ECS cluster, ALB, listener, and service subnets. This template creates only the OpenADA task definitions, ECS services, target groups, listener rules, task security group, IAM task roles, and log groups. It does not create a cluster, load balancer, RDS instance, Redis instance, or database schema.

The OpenADA UI and API are routed by a dedicated host header. Use a hostname covered by the existing ALB certificate, such as `ada.example.com`, and create its DNS record pointing at the existing ALB.

Public URL scans are enabled by default. Set `OPENADA_PUBLIC_SCANS_ENABLED=false` to disable them, or set `OPENADA_SCAN_ALLOWED_HOSTS` to a comma-separated hostname allowlist. Set `OPENADA_API_KEYS` when scan submissions should require a bearer token or `X-API-Key` header. The widget is opt-out: use `data-openada-auto="false"` and call `window.OpenADA.init()` manually when a site owner wants an explicit scan action.

Run the offline check first:

```bash
./cmd.sh cft-existing test
```

Then export the existing resource identifiers and published image URIs without committing them:

```bash
export AWS_REGION=us-east-1
export OPENADA_EXISTING_STACK_NAME=openada-existing-addon
export OPENADA_EXISTING_VPC_ID=vpc-...
export OPENADA_EXISTING_CLUSTER=existing-cluster
export OPENADA_EXISTING_ALB_SG=sg-...
export OPENADA_EXISTING_LISTENER_ARN=arn:aws:elasticloadbalancing:...
export OPENADA_EXISTING_SUBNETS=subnet-...,subnet-...
export OPENADA_HOST_HEADER=ada.example.com
export OPENADA_UI_IMAGE=709825985650.dkr.ecr.us-east-1.amazonaws.com/solodev/openada-ui:1.0.0
export OPENADA_API_IMAGE=709825985650.dkr.ecr.us-east-1.amazonaws.com/solodev/openada-api:1.0.0
export OPENADA_WORKER_IMAGE=709825985650.dkr.ecr.us-east-1.amazonaws.com/solodev/openada-worker:1.0.0
export OPENADA_REDIS_HOST=redis.internal.example
```

Check the template against AWS, then deploy:

```bash
./cmd.sh cft-existing validate
./cmd.sh cft-existing deploy
./cmd.sh cft-existing outputs
```

The listener priorities must be unused on the existing listener. Override them with `OPENADA_UI_LISTENER_PRIORITY` and `OPENADA_API_LISTENER_PRIORITY` when the defaults `100` and `101` are already occupied.

## Asynchronous site scans

The homepage sends site scans to `/scan?url=...`. The scan page starts `POST /api/v1/scans`, receives a job id, and polls `GET /api/v1/scans/{jobId}`. The worker updates page counts, the current URL, queued pages, failures, and the final result in DynamoDB. Completed reports are available at `/report?jobId=...` and include a date picker for earlier scans of the same normalized URL. The Print / save PDF action uses the browser print dialog so the report can be archived without a PDF service in the stack.

## Fresh standalone stack

Use `openada.yaml` only for a standalone environment. It creates its own ECS cluster, ALB, service discovery namespace, task roles, and security groups.
