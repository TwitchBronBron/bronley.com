---
layout: post
title: Raspberry PI as a Wifi Router
hideAffiliateDisclaimer: true
---

Connect to a wifi network with a raspberrypi running Raspbian Stretch, and then share that internet connection with the LAN port. 

I'm doing all of this from a fresh raspberrypi running Raspbian Stretch

1. Flash the latest version of [raspbian stretch lite ](https://downloads.raspberrypi.org/raspbian_lite_latest) (2019-04-08 at the time of this tutorial)
2. Run this script (changing any variables you want)

```bash
#run all commands as root
sudo su
#enable SSH service on startup. 0 means enabled
raspi-config nonint do_ssh 0

#OPTIONAL: change the device hostname (this is so I can target the pi with SSH nicely) 
printf "pi-wifi" > /etc/hostname
sed -i "s/raspberrypi/pi-wifi/g" /etc/hosts

#tell the PI what your wifi country code is
raspi-config nonint do_wifi_country US

# install all the latest updates 
apt-get update -y && apt-get upgrade -y && apt-get dist-upgrade -y && apt full-upgrade -y
reboot
```

```bash
#run all commands as root
sudo su

#connect to the wifi network
cat > /etc/wpa_supplicant/wpa_supplicant.conf <<EOF
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1
country=US

EOF

#connect to the wifi network now by reloading having wpa_cli reload the .conf file
wpa_cli -i wlan0 reconfigure


#install the DHCP server (dnsmasq)
apt-get install dnsmasq -y


```

