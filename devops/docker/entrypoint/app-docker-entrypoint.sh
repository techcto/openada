#!/bin/sh

case $1 in
  dev)
    echo "Dev Mode"
    npm run dev
    ;;
  prod)
    echo "Prod Mode"
    npm run start
    ;;
  *)
    exec "$@"
    ;;
esac
