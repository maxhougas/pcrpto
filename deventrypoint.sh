#!/bin/sh

cd /home/user/pcrpto/server
node index.js &> ~/logsrv &
cd /home/user/pcrpto/client
npm run dev-https &> ~/logcli &
