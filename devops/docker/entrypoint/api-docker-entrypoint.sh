#!/bin/sh

case "$1" in
  dev)
    npm run dev
    ;;
  prod)
    npm run start
    ;;
  *)
    exec "$@"
    ;;
esac
