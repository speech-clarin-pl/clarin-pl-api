#!/usr/bin/env bash

docker run -d --rm -v /home/test/PROJEKTY/CLARIN/clarin-pl-api/repo:/work --net="host" --env DB_HOST=localhost --env TOOLS=/ --name=worker speechclarinpl/website-worker
