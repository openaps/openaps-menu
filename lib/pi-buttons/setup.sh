#!/bin/sh

if [ ! -w /sys/class/gpio/export ]; then
    echo "$0 must be run with GPIO permissions (typically gpio group membership or root/sudo)"
    exit 1
fi

for gpionum in 17 22 27; do	
  if [ ! -d /sys/class/gpio/gpio${gpionum} ]; then
    echo "exporting GPIO ${gpionum}"
    echo ${gpionum} > /sys/class/gpio/export
  else
    echo "GPIO ${gpionum} already exported"
  fi
done

for gpionum in 17 22; do
  if [ "$(/bin/cat /sys/class/gpio/gpio${gpionum}/direction)" != "in" ]; then
    echo "setting GPIO ${gpionum} direction to inwards"
    echo in > /sys/class/gpio/gpio${gpionum}/direction
  else
    echo "GPIO ${gpionum} already direction inwards"
  fi
  if [ "$(/bin/cat /sys/class/gpio/gpio${gpionum}/edge)" != "both" ]; then
    echo "setting GPIO ${gpionum} signal edge to both"
    echo both > /sys/class/gpio/gpio${gpionum}/edge
  else
    echo "GPIO ${gpionum} signal edge already both"
  fi
done


if [ "$(/bin/cat /sys/class/gpio/gpio27/direction)" != "out" ]; then
  echo "setting GPIO 27 direction to outwards"
  echo out > /sys/class/gpio/gpio27/direction
else
  echo "GPIO 27 already direction outwards"
fi

if [ ! -x $(dirname $0)/buttons ]; then
  echo "building buttons executable"
  /usr/bin/make -C $(dirname $0)
else
  echo "buttons executable exists"
fi
