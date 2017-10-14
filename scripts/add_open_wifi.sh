#!/bin/bash

SSID=$1
WPA=/etc/wpa_supplicant/wpa_supplicant.conf
if [ -z $1 ]; then
    echo -e "No SSID\nprovided"
elif grep -q $SSID $WPA; then
    echo -e "SSID:\n$SSID\nis already configured"
elif ( echo -e "\nnetwork={\n  ssid=\"$SSID\"\n  key_mgmt=NONE\n}" >> $WPA \
       && grep -q $SSID $WPA ); then
    echo -e "SSID:\n$SSID\nconfigured\nsuccessfully"
else
    echo -e "Unable to\nconfigure SSID\n$SSID"
fi
