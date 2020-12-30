#!/usr/bin/env bash
docker run -d --rm -v $PWD/repo:/work --net="host" --env DB_HOST=localhost --env DB_NAME=workers --env TOOLS=/ --name=worker speechclarinpl/website-worker
