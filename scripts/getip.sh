#!/bin/bash

wlan0IP=$(ip -f inet -o addr show wlan0|cut -d\  -f 7 | cut -d/ -f 1)
bnep0IP=$(ip -f inet -o addr show bnep0|cut -d\  -f 7 | cut -d/ -f 1)
echo -e "Current WiFi IP:\n$wlan0IP\n"
echo -e "Current BT IP:\n$bnep0IP\n"
