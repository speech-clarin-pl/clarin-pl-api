#!/usr/bin/env bash

docker run -d --rm -v $PWD/repo:/work --net="host" --env DB_HOST=localhost --env TOOLS=/ --name=worker speechclarinpl/website-worker
