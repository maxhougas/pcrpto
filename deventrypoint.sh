#!/bin/sh

cd ~/pcrpto/server
node index.js &> ~/logsrv &
cd ~/pcrpto/client
npm run dev &> ~/logcli &
