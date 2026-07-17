#!/usr/bin/env bash
set -euo pipefail

: "${MP_AWS_MARKETPLACE_PRODUCT_ID:?Set MP_AWS_MARKETPLACE_PRODUCT_ID to the OpenADA Marketplace product ID.}"
: "${RELEASE_VERSION:?Set RELEASE_VERSION to the release version.}"
: "${MP_AWS_ECR:?Set MP_AWS_ECR to the ECR registry.}"
: "${UI_REPOSITORY:?Set UI_REPOSITORY to the UI ECR repository.}"
: "${API_REPOSITORY:?Set API_REPOSITORY to the API ECR repository.}"
: "${WORKER_REPOSITORY:?Set WORKER_REPOSITORY to the worker ECR repository.}"

DETAILS_JSON="$(jq -n \
  --arg version "$RELEASE_VERSION" \
  --arg ui "$MP_AWS_ECR/$UI_REPOSITORY:$RELEASE_VERSION" \
  --arg api "$MP_AWS_ECR/$API_REPOSITORY:$RELEASE_VERSION" \
  --arg worker "$MP_AWS_ECR/$WORKER_REPOSITORY:$RELEASE_VERSION" \
  '{
    Version: {
      VersionTitle: $version,
      ReleaseNotes: ("OpenADA " + $version + ": accessibility API, public scan archive, MCP integration, and container updates.")
    },
    DeliveryOptions: [{
      DeliveryOptionTitle: "ECS container images",
      Details: {
        EcrDeliveryOptionDetails: {
          ContainerImages: [$ui, $api, $worker],
          CompatibleServices: ["ECS"],
          Description: "OpenADA UI, API, and asynchronous scan worker containers for Amazon ECS.",
          UsageInstructions: "Deploy the OpenADA containers with the CloudFormation template and instructions at https://github.com/techcto/openada/tree/main/devops/cloudformation"
        }
      }
    }]
  }')"

DETAILS_JSON_STRING="$(printf '%s' "$DETAILS_JSON" | jq 'tostring')"

aws marketplace-catalog start-change-set \
  --catalog AWSMarketplace \
  --change-set "[{
    \"ChangeType\": \"AddDeliveryOptions\",
    \"Entity\": {
      \"Identifier\": \"$MP_AWS_MARKETPLACE_PRODUCT_ID\",
      \"Type\": \"ContainerProduct@1.0\"
    },
    \"Details\": $DETAILS_JSON_STRING
  }]"
