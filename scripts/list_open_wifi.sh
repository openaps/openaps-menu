#!/bin/bash

wpa_cli scan_res | grep ESS | egrep -v '\[WPA' | sort -grk 3 | head | awk -F '\t' '{print $NF}' | uniq
