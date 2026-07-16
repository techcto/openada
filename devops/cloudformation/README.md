# OpenADA deployment modes

OpenADA stores public directory metadata in three on-demand DynamoDB tables created by the stack: sites, pages, and immutable scan summaries. The check endpoints still work independently of the directory.

Choose one deployment mode:

| Mode | Command | Creates | Reuses |
| --- | --- | --- | --- |
| New standalone environment | `./cmd.sh cft-new deploy` | ECS cluster, ALB, security groups, task services | Nothing |
| Existing environment | `./cmd.sh cft-existing deploy` | OpenADA services, target groups, rules, task roles, logs | ECS cluster, ALB, VPC, subnets |

The standalone mode is implemented by `openada.yaml`. The existing-environment mode is implemented by `openada-existing.yaml`. Neither mode creates an RDS database, Redis cluster, or search cluster for OpenADA.

## Publish test images

After logging in to Docker Hub, build and publish both production images without committing first:

```bash
docker login
./cmd.sh docker push latest
```

The command publishes `techcto/openada-ui:latest` and `techcto/openada-api:latest` for `linux/amd64`. Set `DOCKERHUB_NAMESPACE` or `DOCKER_PLATFORM` to override the defaults.

## Publish CloudFormation files

Set the bucket name if it is not `openada`, then upload both deployment modes and this README:

```bash
export AWS_PROFILE=<your-aws-profile>
export OPENADA_CFT_BUCKET=openada
./cmd.sh cft-new publish
```

Both `cft-new deploy` and `cft-existing deploy` publish the CFT files before validating or deploying.

The publishing identity needs `s3:PutObject` and `s3:AbortMultipartUpload` for the CloudFormation and widget prefixes, plus `s3:GetBucketLocation` for the bucket. A ready-to-attach policy is included at `devops/iam/openada-cft-publish-policy.json`.

## Existing ECS cluster

Use `openada-existing.yaml` when the AWS account already has the VPC, ECS cluster, ALB, listener, and service subnets. This template creates only the OpenADA task definitions, ECS services, target groups, listener rules, task security group, IAM task roles, and log groups. It does not create a cluster, load balancer, RDS instance, Redis instance, or database schema.

The OpenADA UI and API are routed by a dedicated host header. Use a hostname covered by the existing ALB certificate, such as `ada.example.com`, and create its DNS record pointing at the existing ALB.

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
export OPENADA_UI_IMAGE=docker.io/techcto/openada-ui:1.0.0
export OPENADA_API_IMAGE=docker.io/techcto/openada-api:1.0.0
```

Check the template against AWS, then deploy:

```bash
./cmd.sh cft-existing validate
./cmd.sh cft-existing deploy
./cmd.sh cft-existing outputs
```

The listener priorities must be unused on the existing listener. Override them with `OPENADA_UI_LISTENER_PRIORITY` and `OPENADA_API_LISTENER_PRIORITY` when the defaults `100` and `101` are already occupied.

## Fresh standalone stack

Use `openada.yaml` only for a standalone environment. It creates its own ECS cluster, ALB, service discovery namespace, task roles, and security groups.
