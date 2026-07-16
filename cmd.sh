#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

usage() {
  cat <<'EOF'
Usage:
  ./cmd.sh install              Install UI and API dependencies
  ./cmd.sh build                Build UI and API
  ./cmd.sh test                 Run CFT checks, shell checks, and builds
  ./cmd.sh dev                  Start local Docker Compose services
  ./cmd.sh compose-test         Build, start, and smoke-test Compose services
  ./cmd.sh down                 Stop local Docker Compose services
  ./cmd.sh cft-new <command>    Test/deploy a new standalone ECS cluster and ALB
  ./cmd.sh cft-existing <cmd>   Test/deploy into an existing ECS cluster and ALB
  ./cmd.sh cft <command>        Compatibility alias for cft-new
  ./cmd.sh docker build [tag]   Build production images locally
  ./cmd.sh docker push [tag]    Build and push production images to Docker Hub
  ./cmd.sh git <command>        Run git.sh (status, audit, tag, ...)
  ./cmd.sh images [tag]         Build local UI and API images
EOF
}

case "${1:-help}" in
  install)
    npm --prefix "$ROOT_DIR" ci
    npm --prefix "$ROOT_DIR/api" ci
    ;;
  build)
    npm --prefix "$ROOT_DIR" run build
    npm --prefix "$ROOT_DIR/api" run build
    ;;
  test)
    "$ROOT_DIR/cft.sh" test
    bash -n "$ROOT_DIR/cmd.sh" "$ROOT_DIR/git.sh" "$ROOT_DIR/cft.sh"
    npm --prefix "$ROOT_DIR" run build
    npm --prefix "$ROOT_DIR/api" run build
    ;;
  dev)
    docker compose -f "$ROOT_DIR/docker-compose.yml" up --build
    ;;
  compose-test)
    cleanup() {
      docker compose -f "$ROOT_DIR/docker-compose.yml" down --remove-orphans
    }
    trap cleanup EXIT
    docker compose -f "$ROOT_DIR/docker-compose.yml" up --build -d
    for attempt in $(seq 1 30); do
      if curl --fail --silent "http://localhost:${API_PORT:-3001}/api/health" >/dev/null; then
        break
      fi
      if [[ "$attempt" == 30 ]]; then
        echo "API did not become healthy in time." >&2
        exit 1
      fi
      sleep 2
    done
    curl --fail --silent "http://localhost:${APP_PORT:-3000}" >/dev/null
    response="$(curl --fail --silent -X POST "http://localhost:${API_PORT:-3001}/api/v1/check" \
      -H 'Content-Type: application/json' \
      -d '{"html":"<main><img src=\"logo.png\"></main>","text":"This langauge needs a check."}')"
    printf '%s' "$response" | grep -q '"ada"'
    printf '%s' "$response" | grep -q '"language"'
    echo "Compose smoke test passed."
    ;;
  down)
    docker compose -f "$ROOT_DIR/docker-compose.yml" down --remove-orphans
    ;;
  cft)
    shift
    "$ROOT_DIR/cft.sh" "${1:-test}"
    ;;
  cft-new)
    shift
    "$ROOT_DIR/cft.sh" "${1:-test}"
    ;;
  cft-existing)
    shift
    "$ROOT_DIR/cft-existing.sh" "${1:-test}"
    ;;
  docker)
    docker_action="${2:-push}"
    tag="${3:-latest}"
    namespace="${DOCKERHUB_NAMESPACE:-techcto}"
    platform="${DOCKER_PLATFORM:-linux/amd64}"
    ui_image="${namespace}/openada-ui:${tag}"
    api_image="${namespace}/openada-api:${tag}"

    case "$docker_action" in
      build)
        docker build --platform "$platform" --target prod \
          -f "$ROOT_DIR/devops/docker/Dockerfile.app" \
          -t "$ui_image" "$ROOT_DIR"
        docker build --platform "$platform" --target prod \
          -f "$ROOT_DIR/devops/docker/Dockerfile.api" \
          -t "$api_image" "$ROOT_DIR"
        ;;
      push)
        "$ROOT_DIR/cmd.sh" docker build "$tag"
        docker push "$ui_image"
        docker push "$api_image"
        printf 'Published %s and %s\n' "$ui_image" "$api_image"
        ;;
      *)
        printf 'Usage: ./cmd.sh docker build [tag]\n'
        printf '       ./cmd.sh docker push [tag]\n' >&2
        exit 2
        ;;
    esac
    ;;
  git)
    shift
    "$ROOT_DIR/git.sh" "${1:-status}" "${2:-}"
    ;;
  images)
    tag="${2:-local}"
    docker build --target prod -f "$ROOT_DIR/devops/docker/Dockerfile.app" -t "openada-ui:$tag" "$ROOT_DIR"
    docker build --target prod -f "$ROOT_DIR/devops/docker/Dockerfile.api" -t "openada-api:$tag" "$ROOT_DIR"
    ;;
  -h|--help|help) usage ;;
  *) usage >&2; exit 2 ;;
esac
