#!/bin/bash

WIFI_IP=$(ip -f inet -o addr show wlan0|cut -d\  -f 7 | cut -d/ -f 1)
BT_IP=$(ip -f inet -o addr show bnep0|cut -d\  -f 7 | cut -d/ -f 1)
echo -e "\nCurrent WiFi IP:\n$WIFI_IP\n"
echo -e "\nCurrent BT IP:\n$BT_IP\n"
