#!/bin/bash
echo "Start installing environment for chat room"
echo ""

killall -9 node
/usr/bin/mongo admin --eval "db.shutdownServer()"
apt-get update
apt-get -y -q --purge remove nodejs
apt-get -y -q --purge remove mongodb

apt-get -y -q install mongodb-org
mkdir -p /data/db

apt-get -y -q install nodejs
apt-get -y -q install npm

npm install -g supervisor
cd node-server && npm install
npm dedupe

cd /path/to/ && openssl genrsa -des3 -out server.key 1024
cd /path/to/ && openssl req -new -key server.key -out server.csr
cd /path/to/ && openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt
cd /path/to/ && cp server.key server.key.orig
cd /path/to/ && openssl rsa -in server.key.orig -out server.key