#!/usr/bin/env bash
TESTS=$(ls -1 ./test/)

set -e

if [[ "$1" == "--rebuild" ]]; then
    echo "Rebuilding test expectations..."
    REBUILD=true
elif [[ "$1z" != "z" ]]; then
    TESTS=$1
fi

mkdir -p tmp
for test in $TESTS
do
    if [[ ! -d ./test/$test ]]; then
        echo "Could not find test: $test"
        exit
    fi
    rm -f tmp/*

    echo - $test

    ./bin/run.sh slug ./test/$test/input tmp
    if [ "$REBUILD" = true ]; then
        cp ./tmp/representation.txt ./test/$test
        cp ./tmp/mapping.json ./test/$test
    else
        diff -urN ./test/$test/representation.txt tmp/representation.txt
        diff -urN ./test/$test/mapping.json tmp/mapping.json
    fi

done
rm -r tmp