#!/usr/bin/env bash

set -e

QUERY='SPARQL\n'
GRAPH=''

echo "$DBA_PASSWORD" > /settings/dba_password

/opt/virtuoso-opensource/bin/virtuoso-t -f +checkpoint-only +pwdold dba +pwddba "$DBA_PASSWORD"

echo "Launching first instance for data filling"
/opt/virtuoso-opensource/bin/virtuoso-t +wait

ps -aux
pid=$(ps -aux | grep '/opt/virtuoso-opensource/bin/virtuoso-t +wait' | awk '{print $2}')
echo "First instance launch in backgroung with PID $pid"

if [ -e $1 ]
then
    echo "Reading file $1..."
    while IFS= read -r line; do
        entryGraph=$(echo $line | awk -F '\,\ ' '{print $2}')
        entry=$(echo $line | awk -F '\,\ ' '{print $1}')
        if [ -z "$entryGraph" ]
        then 
            GRAPH=entry
            QUERY=$QUERY"create graph <$GRAPH>;\n"
        else
            if [ -z "$GRAPH" ]
            then
                s=$(echo $line | awk -F '\,\ ' '{print $1}')
                p=$(echo $line | awk -F '\,\ ' '{print $2}')
                o=$(echo $line | awk -F '\,\ ' '{print $3}')

                if [ -z "$(echo $o | grep -Eo '[a-zA-Z0-9]+://[a-zA-Z0-9./?=_%:-]*')" ] 
                then 
                    QUERY=$QUERY"INSERT DATA { <$s> <$p> '$o' };\n"
                else 
                    QUERY=$QUERY"INSERT DATA { <$s> <$p> <$o> };\n"
                fi
            else 
                s=$(echo $line | awk -F '\,\ ' '{print $1}')
                p=$(echo $line | awk -F '\,\ ' '{print $2}')
                o=$(echo $line | awk -F '\,\ ' '{print $3}')

                if [ -z "$(echo $o | grep -Eo '[a-zA-Z0-9]+://[a-zA-Z0-9./?=_%:-]*')" ] 
                then 
                    QUERY=$QUERY"INSERT DATA { GRAPH <$GRAPH> { <$s> <$p> '$o' } };\n"
                else 
                    QUERY=$QUERY"INSERT DATA { GRAPH <$GRAPH> { <$s> <$p> <$o> } };\n"
                fi
            fi
        fi
    done < $1
    QUERY=$QUERY"EXIT;\n"
    echo "Finished reading file, now injecting query..."
    printf "$QUERY" | isql -P "$DBA_PASSWORD"
    echo "Query sucessfully injected!"

    printf "shutdown;\n" | isql -P "$DBA_PASSWORD"

    echo "Stopped first instance, now launching the real instance"
    /opt/virtuoso-opensource/bin/virtuoso-t -f 
else 
    echo 'No files provided'
fi
#