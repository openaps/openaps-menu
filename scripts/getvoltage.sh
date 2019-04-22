#!/bin/bash

command -v socat >/dev/null 2>&1 || { echo >&2 "I require socat but it's not installed. Aborting."; exit 1; }

RESPONSE=`echo '{"command":"read_voltage"}' | socat -,ignoreeof ~/src/openaps-menu/socket-server.sock | sed -n 's/.*"response":\([^}]*\)}/\1/p'`
[[ $RESPONSE == "{}" ]] && unset RESPONSE
[[ $RESPONSE = *[![:space:]]* ]] && echo $RESPONSE || echo '{"batteryVoltage":3340,"battery":99}'
# the OR at the end of the above line uploads a fake voltage (3340) and percentage (99), to work around a problem with nighscout crashing when receiving a null value
#./getvoltage.sh | sed -n 's/.*"response":\([^}]*\)}/\1/p'
