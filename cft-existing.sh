#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE="${OPENADA_EXISTING_CFT_TEMPLATE:-$ROOT_DIR/devops/cloudformation/openada-existing.yaml}"
STACK_NAME="${OPENADA_EXISTING_STACK_NAME:-openada-existing-addon}"
AWS_REGION="${AWS_REGION:-us-east-1}"

usage() {
  cat <<'EOF'
Usage:
  ./cft-existing.sh test       Run offline checks
  ./cft-existing.sh publish    Upload both CFTs and deployment docs to S3
  ./cft-existing.sh validate  Validate with AWS CloudFormation
  ./cft-existing.sh deploy    Deploy services to the existing cluster/ALB
  ./cft-existing.sh events    Show recent add-on stack events
  ./cft-existing.sh outputs   Show add-on stack outputs

Required deployment values:
  OPENADA_EXISTING_VPC_ID
  OPENADA_EXISTING_CLUSTER       Existing ECS cluster name or ARN
  OPENADA_EXISTING_ALB_SG        Existing ALB security group ID
  OPENADA_EXISTING_LISTENER_ARN  Existing HTTP or HTTPS listener ARN
  OPENADA_EXISTING_SUBNETS       Comma-separated ECS service subnet IDs
  OPENADA_HOST_HEADER             Dedicated hostname, for example ada.example.com
  OPENADA_UI_IMAGE                Published UI image URI
  OPENADA_API_IMAGE               Published API image URI
  OPENADA_WORKER_IMAGE            Published scan worker image URI

Optional values:
  OPENADA_DESIRED_COUNT
  OPENADA_ASSIGN_PUBLIC_IP        ENABLED or DISABLED
  OPENADA_API_KEYS
  LANGUAGETOOL_UPSTREAM_URL
  OPENADA_CORS_ORIGINS
  OPENADA_PUBLIC_SCANS_ENABLED
  OPENADA_SCAN_ALLOWED_HOSTS
  OPENADA_UI_LISTENER_PRIORITY
  OPENADA_API_LISTENER_PRIORITY
  OPENADA_REDIS_HOST              Existing Redis endpoint reachable by ECS
  OPENADA_REDIS_PORT              Existing Redis port (default: 6379)
  OPENADA_REDIS_PASSWORD          Optional Redis password
  OPENADA_REDIS_TLS               true or false (default: false)
EOF
}

die() {
  printf 'Error: %s\n' "$*" >&2
  exit 1
}

offline_test() {
  [[ -f "$TEMPLATE" ]] || die "CloudFormation template not found: $TEMPLATE"

  local required
  for required in \
    'AWS::ECS::TaskDefinition' \
    'AWS::ECS::Service' \
    'AWS::ElasticLoadBalancingV2::ListenerRule' \
    'Cluster' \
    'ListenerArn' \
    'HostHeader' \
    'UiImage' \
    'ApiImage' \
    'WorkerImage'; do
    rg -q "$required" "$TEMPLATE" || die "Template check failed: missing $required"
  done

  if command -v cfn-lint >/dev/null 2>&1; then
    cfn-lint -t "$TEMPLATE"
  else
    printf 'Warning: cfn-lint is not installed; static checks passed.\n'
  fi

  printf 'Existing-cluster CFT offline test passed: %s\n' "$TEMPLATE"
}

validate() {
  offline_test
  aws cloudformation validate-template \
    --template-body "file://$TEMPLATE" \
    --region "$AWS_REGION"
}

publish() {
  "$ROOT_DIR/cft.sh" publish
}

deploy() {
  publish
  validate

  : "${OPENADA_EXISTING_VPC_ID:?Set OPENADA_EXISTING_VPC_ID before deploying.}"
  : "${OPENADA_EXISTING_CLUSTER:?Set OPENADA_EXISTING_CLUSTER before deploying.}"
  : "${OPENADA_EXISTING_ALB_SG:?Set OPENADA_EXISTING_ALB_SG before deploying.}"
  : "${OPENADA_EXISTING_LISTENER_ARN:?Set OPENADA_EXISTING_LISTENER_ARN before deploying.}"
  : "${OPENADA_EXISTING_SUBNETS:?Set OPENADA_EXISTING_SUBNETS before deploying.}"
  : "${OPENADA_HOST_HEADER:?Set OPENADA_HOST_HEADER before deploying.}"
  : "${OPENADA_UI_IMAGE:?Set OPENADA_UI_IMAGE before deploying.}"
  : "${OPENADA_API_IMAGE:?Set OPENADA_API_IMAGE before deploying.}"
  : "${OPENADA_WORKER_IMAGE:?Set OPENADA_WORKER_IMAGE before deploying.}"
  : "${OPENADA_REDIS_HOST:?Set OPENADA_REDIS_HOST before deploying.}"

  local parameters=(
    "VpcId=$OPENADA_EXISTING_VPC_ID"
    "Cluster=$OPENADA_EXISTING_CLUSTER"
    "LoadBalancerSecurityGroup=$OPENADA_EXISTING_ALB_SG"
    "ListenerArn=$OPENADA_EXISTING_LISTENER_ARN"
    "ServiceSubnets=$OPENADA_EXISTING_SUBNETS"
    "HostHeader=$OPENADA_HOST_HEADER"
    "UiImage=$OPENADA_UI_IMAGE"
    "ApiImage=$OPENADA_API_IMAGE"
    "WorkerImage=$OPENADA_WORKER_IMAGE"
    "RedisHost=$OPENADA_REDIS_HOST"
  )

  [[ -n "${OPENADA_DESIRED_COUNT:-}" ]] && parameters+=("DesiredCount=$OPENADA_DESIRED_COUNT")
  [[ -n "${OPENADA_ASSIGN_PUBLIC_IP:-}" ]] && parameters+=("AssignPublicIp=$OPENADA_ASSIGN_PUBLIC_IP")
  [[ -n "${OPENADA_API_KEYS:-}" ]] && parameters+=("ApiKeys=$OPENADA_API_KEYS")
  [[ -n "${LANGUAGETOOL_UPSTREAM_URL:-}" ]] && parameters+=("LanguageToolUpstreamUrl=$LANGUAGETOOL_UPSTREAM_URL")
  [[ -n "${OPENADA_CORS_ORIGINS:-}" ]] && parameters+=("CorsAllowedOrigins=$OPENADA_CORS_ORIGINS")
  [[ -n "${OPENADA_PUBLIC_SCANS_ENABLED:-}" ]] && parameters+=("PublicScansEnabled=$OPENADA_PUBLIC_SCANS_ENABLED")
  [[ -n "${OPENADA_OPENAI_APPS_CHALLENGE_TOKEN:-}" ]] && parameters+=("OpenAiAppsChallengeToken=$OPENADA_OPENAI_APPS_CHALLENGE_TOKEN")
  [[ -n "${OPENADA_SCAN_ALLOWED_HOSTS:-}" ]] && parameters+=("ScanAllowedHosts=$OPENADA_SCAN_ALLOWED_HOSTS")
  [[ -n "${OPENADA_UI_LISTENER_PRIORITY:-}" ]] && parameters+=("UiListenerPriority=$OPENADA_UI_LISTENER_PRIORITY")
  [[ -n "${OPENADA_API_LISTENER_PRIORITY:-}" ]] && parameters+=("ApiListenerPriority=$OPENADA_API_LISTENER_PRIORITY")
  [[ -n "${OPENADA_REDIS_PORT:-}" ]] && parameters+=("RedisPort=$OPENADA_REDIS_PORT")
  [[ -n "${OPENADA_REDIS_PASSWORD:-}" ]] && parameters+=("RedisPassword=$OPENADA_REDIS_PASSWORD")
  [[ -n "${OPENADA_REDIS_TLS:-}" ]] && parameters+=("RedisTls=$OPENADA_REDIS_TLS")

  aws cloudformation deploy \
    --template-file "$TEMPLATE" \
    --stack-name "$STACK_NAME" \
    --region "$AWS_REGION" \
    --capabilities CAPABILITY_NAMED_IAM \
    --no-fail-on-empty-changeset \
    --parameter-overrides "${parameters[@]}"
}

case "${1:-test}" in
  test) offline_test ;;
  publish) publish ;;
  validate) validate ;;
  deploy) deploy ;;
  events) aws cloudformation describe-stack-events --stack-name "$STACK_NAME" --region "$AWS_REGION" ;;
  outputs) aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$AWS_REGION" --query 'Stacks[0].Outputs' ;;
  -h|--help|help) usage ;;
  *) usage >&2; exit 2 ;;
esac
