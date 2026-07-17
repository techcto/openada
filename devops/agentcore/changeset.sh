#!/usr/bin/env bash
set -euo pipefail

: "${RELEASE_VERSION:?Set RELEASE_VERSION to the version being submitted.}"

ECR_REGISTRY="${MP_AWS_ECR:-709825985650.dkr.ecr.us-east-1.amazonaws.com}"
AGENTCORE_REPOSITORY="${OPENADA_AGENTCORE_REPOSITORY:-solodev/openada-agentcore}"
AGENTCORE_PRODUCT_ID="${MP_AWS_AGENTCORE_PRODUCT_ID:-}"

if [[ -z "${AGENTCORE_PRODUCT_ID}" ]]; then
  echo "MP_AWS_AGENTCORE_PRODUCT_ID is required" >&2
  exit 1
fi
IMAGE_URI="${ECR_REGISTRY}/${AGENTCORE_REPOSITORY}:${RELEASE_VERSION}"

DETAILS_JSON=$(cat <<JSON
{
  "Version": {
    "VersionTitle": "${RELEASE_VERSION}",
    "ReleaseNotes": "${RELEASE_VERSION} Version"
  },
  "DeliveryOptions": [
    {
      "DeliveryOptionTitle": "Container image",
      "Details": {
        "EcrDeliveryOptionDetails": {
          "ContainerImages": ["${IMAGE_URI}"],
          "CompatibleServices": ["Bedrock-AgentCore"],
          "AgenticType": ["MCP_SERVER"],
          "Description": "Deploy OpenADA MCP AgentCore as a container image on Amazon Bedrock AgentCore Runtime",
          "UsageInstructions": "Configure OPENADA_MCP_URL with the hosted or private OpenADA MCP endpoint. Set OPENADA_API_KEY when the endpoint requires an OpenADA API key. See https://github.com/techcto/openada/tree/main/devops/agentcore/README.md",
          "EnvironmentVariables": [
            {
              "Name": "OPENADA_MCP_URL",
              "Description": "HTTPS URL of the hosted or private OpenADA MCP endpoint that the gateway forwards to."
            },
            {
              "Name": "OPENADA_API_KEY",
              "Description": "Optional OpenADA API key for a protected private OpenADA MCP endpoint."
            }
          ]
        }
      }
    }
  ]
}
JSON
)

aws marketplace-catalog start-change-set \
  --catalog AWSMarketplace \
  --change-set "$(jq -cn \
    --arg product "$AGENTCORE_PRODUCT_ID" \
    --argjson details "$DETAILS_JSON" \
    '[{"ChangeType":"AddDeliveryOptions","Entity":{"Identifier":$product,"Type":"ContainerProduct@1.0"},"Details":($details|tojson)}]')"
