#!/bin/sh

ip route | grep -o 'default via \([0-9]\{0,3\}\.\)\{3\}[0-9]\{0,3\}' | grep -o '\([0-9]\{0,3\}\.\)\{3\}[0-9]\{0,3\}'
