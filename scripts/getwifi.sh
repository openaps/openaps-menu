#!/bin/bash

WIFI=$(iwgetid -r)
echo -e "Current Wifi Network:\n$WIFI\n"
echo -e "Connect to the same\nnetwork before\nssh'ing in\n"
