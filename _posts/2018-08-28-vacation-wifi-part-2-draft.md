---
layout: post
title: Vacation Wifi Part 2
---
I got the  [CanaKit Raspberry PI 3 B+](https://www.amazon.com/gp/product/B07BC7BMHY/ref=as_li_ss_tl?ie=UTF8&linkCode=ll1&tag=bronley-20&linkId=b8875ab550f2eb7d5d90585afab9dd6d&language=en_US) package in the mail today. 

I installed the latest version of Raspbian Stretch Lite from [here](https://www.raspberrypi.org/downloads/raspbian/) and followed their instructions to flash the image onto the SD card. 

Then I added file to the root of the SD card called "SSH.txt" so that the SSH service was enabled by default. This service only starts once, and promptly deletes the ssh file, so I will need to remember to enable the SSH service to start on boot before I reboot the pi for the first time. 

Then I inserted the SD card.

I plugged the pi into my router using an ethernet cable. 

I logged on to my router and looked for a new device on the network called "raspberrypi" and noted its ip address. In this case, the new pi is connected using ip address 192.168.1.120.

Using PUTTY (or plain ssh if you have it available), connect to that ip address.


All of these commands are run as root, that is omitted  for brevity's sake
change the default password

Thanks to [this blog post](https://www.raspberrypi.org/documentation/configuration/wireless/access-point.md) for help with the wifi access point 

Thanks to [this post](http://www.raspberryconnect.com/network/item/333-raspberry-pi-hotspot-access-point-dhcpcd-method) for figuring out what to do differently for raspbian stretch (many of the tutorials no longer work for raspbian stretch)
Tweak some basic settings

```bash
#enable SSH service on startup. 0 means enabled
raspi-config nonint do_ssh 0

#set a new password
echo -e "romantic\nromantic" | passwd pi

#change the device hostname
printf "pi-wifi" > /etc/hostname
sed -i "s/raspberrypi/pi-wifi/g" /etc/hosts

#tell the PI what your wifi country code is
raspi-config nonint do_wifi_country US

# expand the root filesystem to fill SD card. This allows you to use your entire SD card
raspi-config nonint do_expand_rootfs

#remove hostapd before the upgrade to ensure a successful install later
apt-get remove --purge hostapd -yqq
apt-get remove --purge dnsmasq -yqq
# install all the latest updates (and auto-agree to those pesky "are you sure" messages). 
# Some of these are redundant, but they run very fast when unneeded, 
# and sometimes there are edge cases where one works after another, so why not just run them all every time
apt-get update -y && apt-get upgrade -y && apt-get dist-upgrade -y && apt full-upgrade -y

#reboot the pi to apply these changes
reboot

```


##Configure the wireless access point and dhcp server

Thanks to this script: https://gist.github.com/Lewiscowles1986/fecd4de0b45b2029c390

```bash

#force the onboard wireless to be identified as wlan2 (so we can dependably use wlan0 and wlan1 for the usb dongles)
cat > /etc/udev/rules.d/72-static-name.rules <<EOF
ACTION=="add", SUBSYSTEM=="net", DRIVERS=="brcmfmac", NAME="wlan2"
EOF

apt-get install hostapd dnsmasq -y

cat >> /etc/dhcpcd.conf <<EOF
interface wlan2
static ip_address=192.168.4.1/24
static routers=192.168.4.1
static domain_name_servers=192.168.4.1
#MAKE SURE THIS IS AT THE BOTTOM. Not having this line caused me so many headaches
denyinterfaces wlan2
EOF

cat > /etc/dnsmasq.conf <<EOF
interface=wlan2
  dhcp-range=192.168.4.2,192.168.4.20,255.255.255.0,24h
EOF

#configure the 2.4ghz wireless access point
cat > /etc/hostapd/hostapd.conf <<EOF
interface=wlan2
driver=nl80211
ssid=CamperWifi
hw_mode=g
channel=1
country_code=US
ieee80211d=1
wmm_enabled=0
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0
wpa=2
wpa_passphrase=password
wpa_key_mgmt=WPA-PSK
wpa_pairwise=TKIP
rsn_pairwise=CCMP
EOF


sed -i -- 's/#DAEMON_CONF=""/DAEMON_CONF="\/etc\/hostapd\/hostapd.conf"/g' /etc/default/hostapd

service dhcpcd restart
systemctl daemon-reload

sudo systemctl unmask hostapd
sudo systemctl enable hostapd
sudo systemctl start hostapd

systemctl enable dnsmasq

sudo service hostapd restart
sudo service dnsmasq restart

```

## Connect external wifi 1

Now that we have the wireless router configured, let's connect one of the wifi radios to my local network

```bash
#create a wpa_supplicant file for each interface
cat > /etc/wpa_supplicant/wpa_supplicant-wlan0.conf <<EOF
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1
country=US
EOF
#remove any existing networks that are out there
wpa_cli -p /var/run/wpa_supplicant -i wlan0 remove_network 0
wpa_cli -p /var/run/wpa_supplicant -i wlan0 remove_network 1
wpa_cli -p /var/run/wpa_supplicant -i wlan0 remove_network 2
#test connecting with first external router
wpa_cli -p /var/run/wpa_supplicant -i wlan0 add_network
wpa_cli -p /var/run/wpa_supplicant -i wlan0 set_network 0 ssid '"Plumb"'
wpa_cli -p /var/run/wpa_supplicant -i wlan0 set_network 0 scan_ssid 1
wpa_cli -p /var/run/wpa_supplicant -i wlan0 set_network 0 key_mgmt WPA-PSK
wpa_cli -p /var/run/wpa_supplicant -i wlan0 set_network 0 psk '"muffinbrain"'
wpa_cli -p /var/run/wpa_supplicant -i wlan0 enable_network 0


#test connecting with second external router
wpa_cli -p /var/run/wpa_supplicant -iwlan0 add_network
wpa_cli -p /var/run/wpa_supplicant -iwlan0 set_network 1 ssid '"PlumbNew"'
wpa_cli -p /var/run/wpa_supplicant -iwlan0 set_network 1 scan_ssid 1
wpa_cli -p /var/run/wpa_supplicant -iwlan0 set_network 1 key_mgmt WPA-PSK
wpa_cli -p /var/run/wpa_supplicant -iwlan0 set_network 1 psk '"muffinbrain"'
wpa_cli -p /var/run/wpa_supplicant -iwlan0 enable_network 1

#this line makes network 0 the active one
wpa_cli -p /var/run/wpa_supplicant -iwlan0 select_network 0
#then run this to apply the change
systemctl daemon-reload
systemctl restart dhcpcd
wpa_cli -p /var/run/wpa_supplicant -iwlan0 select_network 1



#totally kill it

kill $(pgrep -f "wpa_supplicant -B")
ifconfig wlan0 down
ifconfig wlan0 up
rm -r /var/run/wpa_supplicant/*
wpa_supplicant -B -iwlan1 -f/var/log/wpa_supplicant-wlan0.log -c/etc/wpa_supplicant/wpa_supplicant-wlan0.conf
sleep 15
dhclient -v -r wlan1
dhclient -v wlan1



#switch wifi networks
systemctl restart wpa_supplicant
wpa_cli -p /var/run/wpa_supplicant -i wlan2 reconfigure
systemctl daemon-reload
systemctl restart dhcpcd
sudo systemctl restart networking.service
dhclient -r wlan2
ifconfig wlan2 down
ifconfig wlan2 up
dhclient -r wlan2
dhclient -v wlan2

#create a new copy of the network with new info




#set the wifi info
cat > /etc/wpa_supplicant/wpa_supplicant.conf <<EOF
network={
  ssid="Plumb"
  psk="muffinbrain"
}
EOF

#restart networking (to apply the new wifi info)
sudo systemctl restart networking.service



#share external1 internet with wlan0

#back up the original 
#mv /etc/sysctl.conf /etc/sysctl.conf.bak

#forward 


```


## Troubleshooting

I tried so many tutorials to get this working, and the wireless access point was never handing out ip addresses. I thought this was an issue with dnsmasq, but it turned out to be something wrong with my static ip address. To troubleshoot this, I ran ifconfig, and saw that my wlan0 was NOT getting the static ip address of 192.168.4.1 that I had given it. So this is a good way to troubleshoot

### Driver issues
The external wifi sticks I bought had issues where the driver couldn't be reloaded after the first use. To troubleshoot this, I did a few things. 

```bash
#detect the driver used for the device
readlink /sys/class/net/wlan0/device/driver
```

In this case, it was using the `rtl8192cu` driver, which is known to be glitchy based on these links CITATION NEEDED.

I had another card using `rt2800usb` which worked great. 

The built-in wifi card uses `brcmfmac`. 

readlink /sys/class/net/wlan0/device/driver
readlink /sys/class/net/wlan1/device/driver
readlink /sys/class/net/wlan2/device/driver
readlink /sys/class/net/wlan3/device/driver
readlink /sys/class/net/wlan4/device/driver
