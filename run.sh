#!/bin/sh
# sometimes the stream just dies for no discernible reason, so run it in a loop

if [ "$#" -lt 1 ]; then
  echo 'usage: ./run.sh doc_id [--tab "tab name"]' >&2
  exit 1
fi

while true; do
  node run.ts "$@"
  sleep 1
done
