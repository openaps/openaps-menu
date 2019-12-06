#! /bin/bash
# Author: juehv
#
# License: AGPLv3

VOLTAGE=$(jq .voltage ~/myopenaps/monitor/battery.json)
RESERVOIR=$(jq . ~/myopenaps/monitor/reservoir.json)

echo "Voltage: ${VOLTAGE}v"
echo "Reservoir: ${RESERVOIR}U"
