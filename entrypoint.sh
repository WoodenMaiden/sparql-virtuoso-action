#!/usr/bin/env bash

set -e 

echo "$1" > /settings/dba_password
echo "$2" > /settings/dav_password

export DBA_PASSWORD="$1"
export DAV_PASSWORD="$2"

/opt/virtuoso-opensource/bin/virtuoso-t -f +checkpoint-only +pwdold dba +pwddba "$DBA_PASSWORD"

if [ -n "$3" ]
then
   /populate.sh "$3"
fi

echo "Launching the instance"
/opt/virtuoso-opensource/bin/virtuoso-t -f 