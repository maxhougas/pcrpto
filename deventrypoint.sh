#!/bin/sh

cd /home/user/pcrpto/server
node index.js &> /home/user/logsrv &
cd /home/user/pcrpto/client
npm run dev-https &> /home/user/logcli &
