#R
echo 34 > /sys/class/gpio/export
echo "out" > /sys/class/gpio/gpio34/direction
echo 1 > /sys/class/gpio/gpio34/value

#G
echo 15 > /sys/class/gpio/export
echo "out" > /sys/class/gpio/gpio15/direction
echo 1 > /sys/class/gpio/gpio15/value

#B
echo 35 > /sys/class/gpio/export
echo "out" > /sys/class/gpio/gpio35/direction
echo 1 > /sys/class/gpio/gpio35/value

#BTN
echo 52 > /sys/class/gpio/export
echo "in" > /sys/class/gpio/gpio52/direction

