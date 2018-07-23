#!/bin/bash

(cd lib/pi-buttons/ && ./setup.sh && ./a.out) & node index.js
