#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE="${OPENADA_CFT_TEMPLATE:-$ROOT_DIR/devops/cloudformation/openada.yaml}"
STACK_NAME="${OPENADA_STACK_NAME:-openada}"
AWS_REGION="${AWS_REGION:-us-east-1}"
CFT_BUCKET="${OPENADA_CFT_BUCKET:-openada-us}"

usage() {
  cat <<'EOF'
Usage:
  ./cft.sh test                  Run standalone CFT checks and cfn-lint when installed
  ./cft.sh publish               Upload both CFTs and deployment docs to S3
  ./cft.sh validate              Validate with AWS CloudFormation
  ./cft.sh deploy                Create a new standalone ECS cluster and ALB
  ./cft.sh events                Show recent stack events
  ./cft.sh outputs               Show stack outputs
  ./cft.sh destroy               Delete the stack and wait for completion

Deploy parameters:
  OPENADA_VPC_ID                 VPC id
  OPENADA_PUBLIC_SUBNETS         Comma-separated public subnet ids
  OPENADA_SERVICE_SUBNETS        Comma-separated ECS subnet ids
  OPENADA_UI_IMAGE               UI ECR image URI
  OPENADA_API_IMAGE              API ECR image URI
  OPENADA_WORKER_IMAGE           Scan worker ECR image URI
  OPENADA_DESIRED_COUNT          Optional ECS desired count
  OPENADA_CERTIFICATE_ARN        Optional ACM certificate ARN
  OPENADA_API_KEYS               Optional comma-separated API keys
  OPENADA_CORS_ORIGINS            Optional CORS allowlist
  OPENADA_PUBLIC_SCANS_ENABLED    true or false (default: true)
  OPENADA_SCAN_ALLOWED_HOSTS       Optional comma-separated scan host allowlist
  OPENADA_REDIS_AUTH_TOKEN         Optional Redis AUTH token for a new standalone stack
  OPENADA_OPENAI_APPS_CHALLENGE_TOKEN Optional OpenAI Apps domain verification token
  LANGUAGETOOL_UPSTREAM_URL       Optional LanguageTool-compatible upstream
  OPENADA_CFT_BUCKET              S3 bucket for CFT uploads (default: openada-us)
EOF
}

die() {
  printf 'Error: %s\n' "$*" >&2
  exit 1
}

require_template() {
  [[ -f "$TEMPLATE" ]] || die "CloudFormation template not found: $TEMPLATE"
}

offline_test() {
  require_template

  local required
  for required in \
    'AWSTemplateFormatVersion' \
    'AWS::ECS::Cluster' \
    'AWS::ECS::TaskDefinition' \
    'AWS::ECS::Service' \
    'AWS::ElasticLoadBalancingV2::LoadBalancer' \
    'AWS::ElasticLoadBalancingV2::Listener' \
    'UiImage' \
    'ApiImage' \
    'WorkerImage'; do
    rg -q "$required" "$TEMPLATE" || die "Template check failed: missing $required"
  done

  for required_file in \
    "$ROOT_DIR/devops/docker/Dockerfile.app" \
    "$ROOT_DIR/devops/docker/Dockerfile.api" \
    "$ROOT_DIR/devops/docker/Dockerfile.worker" \
    "$ROOT_DIR/package-lock.json" \
    "$ROOT_DIR/api/package-lock.json"; do
    [[ -f "$required_file" ]] || die "Build input missing: $required_file"
  done

  if command -v cfn-lint >/dev/null 2>&1; then
    cfn-lint -t "$TEMPLATE"
  else
    printf 'Warning: cfn-lint is not installed; static checks passed.\n'
  fi

  printf 'CFT offline test passed: %s\n' "$TEMPLATE"
}

validate() {
  offline_test
  aws cloudformation validate-template \
    --template-body "file://$TEMPLATE" \
    --region "$AWS_REGION"
}

publish() {
  require_template
  : "${CFT_BUCKET:?Set OPENADA_CFT_BUCKET before publishing CFT files.}"

  aws s3 cp "$ROOT_DIR/devops/cloudformation/openada.yaml" \
    "s3://${CFT_BUCKET}/cloudformation/openada.yaml" \
    --region "$AWS_REGION" --no-progress
  aws s3 cp "$ROOT_DIR/devops/cloudformation/openada-existing.yaml" \
    "s3://${CFT_BUCKET}/cloudformation/openada-existing.yaml" \
    --region "$AWS_REGION" --no-progress
  aws s3 cp "$ROOT_DIR/devops/cloudformation/README.md" \
    "s3://${CFT_BUCKET}/cloudformation/README.md" \
    --region "$AWS_REGION" --no-progress
  aws s3 cp "$ROOT_DIR/ada.sh" \
    "s3://${CFT_BUCKET}/ada.sh" \
    --content-type text/plain \
    --cache-control 'public,max-age=300' \
    --region "$AWS_REGION" --no-progress
  aws s3 cp "$ROOT_DIR/devops/widget/openada-widget.js" \
    "s3://${CFT_BUCKET}/widgets/openada-widget.js" \
    --content-type application/javascript \
    --cache-control 'public,max-age=300' \
    --region "$AWS_REGION" --no-progress
  printf 'Published OpenADA CFT files and widget to s3://%s/\n' "$CFT_BUCKET"
}

deploy() {
  publish
  validate

  : "${OPENADA_VPC_ID:?Set OPENADA_VPC_ID before deploying.}"
  : "${OPENADA_PUBLIC_SUBNETS:?Set OPENADA_PUBLIC_SUBNETS before deploying.}"
  : "${OPENADA_SERVICE_SUBNETS:?Set OPENADA_SERVICE_SUBNETS before deploying.}"
  : "${OPENADA_UI_IMAGE:?Set OPENADA_UI_IMAGE before deploying.}"
  : "${OPENADA_API_IMAGE:?Set OPENADA_API_IMAGE before deploying.}"
  : "${OPENADA_WORKER_IMAGE:?Set OPENADA_WORKER_IMAGE before deploying.}"

  local parameters=(
    "VpcId=$OPENADA_VPC_ID"
    "PublicSubnets=$OPENADA_PUBLIC_SUBNETS"
    "ServiceSubnets=$OPENADA_SERVICE_SUBNETS"
    "UiImage=$OPENADA_UI_IMAGE"
    "ApiImage=$OPENADA_API_IMAGE"
    "WorkerImage=$OPENADA_WORKER_IMAGE"
  )

  [[ -n "${OPENADA_DESIRED_COUNT:-}" ]] && parameters+=("DesiredCount=$OPENADA_DESIRED_COUNT")
  [[ -n "${OPENADA_CERTIFICATE_ARN:-}" ]] && parameters+=("CertificateArn=$OPENADA_CERTIFICATE_ARN")
  [[ -n "${OPENADA_API_KEYS:-}" ]] && parameters+=("ApiKeys=$OPENADA_API_KEYS")
  [[ -n "${OPENADA_CORS_ORIGINS:-}" ]] && parameters+=("CorsAllowedOrigins=$OPENADA_CORS_ORIGINS")
  [[ -n "${OPENADA_PUBLIC_SCANS_ENABLED:-}" ]] && parameters+=("PublicScansEnabled=$OPENADA_PUBLIC_SCANS_ENABLED")
  [[ -n "${OPENADA_SCAN_ALLOWED_HOSTS:-}" ]] && parameters+=("ScanAllowedHosts=$OPENADA_SCAN_ALLOWED_HOSTS")
  [[ -n "${LANGUAGETOOL_UPSTREAM_URL:-}" ]] && parameters+=("LanguageToolUpstreamUrl=$LANGUAGETOOL_UPSTREAM_URL")
  [[ -n "${OPENADA_REDIS_AUTH_TOKEN:-}" ]] && parameters+=("RedisAuthToken=$OPENADA_REDIS_AUTH_TOKEN")
  [[ -n "${OPENADA_OPENAI_APPS_CHALLENGE_TOKEN:-}" ]] && parameters+=("OpenAiAppsChallengeToken=$OPENADA_OPENAI_APPS_CHALLENGE_TOKEN")

  aws cloudformation deploy \
    --template-file "$TEMPLATE" \
    --stack-name "$STACK_NAME" \
    --region "$AWS_REGION" \
    --capabilities CAPABILITY_NAMED_IAM \
    --no-fail-on-empty-changeset \
    --parameter-overrides "${parameters[@]}"
}

require_template
case "${1:-test}" in
  test) offline_test ;;
  publish) publish ;;
  validate) validate ;;
  deploy) deploy ;;
  events) aws cloudformation describe-stack-events --stack-name "$STACK_NAME" --region "$AWS_REGION" ;;
  outputs) aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$AWS_REGION" --query 'Stacks[0].Outputs' ;;
  destroy) aws cloudformation delete-stack --stack-name "$STACK_NAME" --region "$AWS_REGION"; aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME" --region "$AWS_REGION" ;;
  -h|--help|help) usage ;;
  *) usage >&2; exit 2 ;;
esac
