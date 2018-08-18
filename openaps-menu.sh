#!/bin/bash -e

topdir=$(dirname $0)
buttonsdir=${topdir}/lib/pi-buttons

# GPIO setup and buttons utility build
${buttonsdir}/setup.sh

${buttonsdir}/buttons &
exec node ${topdir}/index.js
