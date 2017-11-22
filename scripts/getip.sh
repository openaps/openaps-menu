#!/bin/bash

IP=$(ip -f inet -o addr show wlan0|cut -d\  -f 7 | cut -d/ -f 1)
echo -e "Current IP Address:\n$IP\n"
echo -e "To connect: ssh\npi@$IP\n"
