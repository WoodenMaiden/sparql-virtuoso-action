#!/usr/bin/env bash

set -e 

#echo "$1" > /settings/dba_password
#echo "$2" > /settings/dav_password

export DBA_PASSWORD="$1"
export DAV_PASSWORD="$2"
#export START_COMMAND="docker run virtuoso"


docker run -e DBA_PASSWORD="$DBA_PASSWORD" \
    -e DAV_PASSWORD="$DAV_PASSWORD" \
    -v "$(pwd)":/database \
    --name virtuoso \
    openlink/virtuoso-opensource-7 \
    /opt/virtuoso-opensource/bin/virtuoso-t -f +checkpoint-only +pwdold dba +pwddba "$DBA_PASSWORD"

docker commit virtuoso database:latest # in order to keep changes and run a different CMD
docker rm -f virtuoso

if [ -n "$3" ]
then
   ./populate.sh "$3"
fi

echo "Launching the instance"
docker run -e DBA_PASSWORD="$DBA_PASSWORD" \
    -e DAV_PASSWORD="$DAV_PASSWORD" \
    -v "$(pwd)":/database \
    database:latest \
    /opt/virtuoso-opensource/bin/virtuoso-t