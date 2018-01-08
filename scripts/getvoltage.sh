#!/bin/bash

command -v socat >/dev/null 2>&1 || { echo >&2 "I require socat but it's not installed. Aborting."; exit 1; }

RESPONSE=`echo '{"command":"read_voltage"}' | socat -,ignoreeof ~/src/openaps-menu/socket-server.sock | sed -n 's/.*"response":\([^}]*\)}/\1/p'`
echo $RESPONSE
#./getvoltage.sh | sed -n 's/.*"response":\([^}]*\)}/\1/p'
