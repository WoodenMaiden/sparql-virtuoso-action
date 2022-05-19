#!/usr/bin/env bash

if [ -e $1 ]
then
    while IFS= read -r line; do
        echo $line
    done < $1
else 
    echo 'fail'
fi