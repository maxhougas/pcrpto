#!/bin/sh

kill $(ps -eo pid,comm | grep npm | grep -o '^ *[0-9]*') $(ps -eo pid,comm | grep node | grep -o '^ *[0-9]*')
