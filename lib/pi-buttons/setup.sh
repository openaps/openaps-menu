#!/bin/sh

echo 17 > /sys/class/gpio/export
echo 22 > /sys/class/gpio/export
echo 27 > /sys/class/gpio/export

sleep 3

echo "in" > /sys/class/gpio/gpio17/direction
echo "both" > /sys/class/gpio/gpio17/edge

echo "in" > /sys/class/gpio/gpio27/direction
echo "both" > /sys/class/gpio/gpio27/edge

echo "out" > /sys/class/gpio/gpio22/direction
