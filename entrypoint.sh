#!/usr/bin/env bash

set -e 

if [[ ! -f virtuoso.ini ]]; then
    curl https://raw.githubusercontent.com/WoodenMaiden/sparql-virtuoso-action/master/virtuoso.ini -o /tmp/mnt/virtuoso.ini
fi


export DBA_PASSWORD="$1"
export DAV_PASSWORD="$2"


docker run -e DBA_PASSWORD="$DBA_PASSWORD" \
    -e DAV_PASSWORD="$DAV_PASSWORD" \
    -v /tmp/mnt:/database \
    --name virtuoso \
    openlink/virtuoso-opensource-7 \
    /opt/virtuoso-opensource/bin/virtuoso-t -f +checkpoint-only +pwdold dba +pwddba "$DBA_PASSWORD"

docker stop virtuoso
docker commit virtuoso database:latest # in order to keep changes and run a different CMD
docker rm -f virtuoso

docker run -e DBA_PASSWORD="$DBA_PASSWORD" \
    -e DAV_PASSWORD="$DAV_PASSWORD" \
    -v /tmp/mnt:/database \
    --name virtuoso -d \
    -p 1111:1111 \
    -p 8890:8890 \
    database:latest \
    /opt/virtuoso-opensource/bin/virtuoso-t +wait +foreground 


if [ -n "$3" ]
then
   ./populate.sh "$3"
fi

echo "Instance available at http://localhost:8890"