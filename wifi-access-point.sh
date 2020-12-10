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

#force the onboard wireless to be identified as wlan0 (so we can dependably use wlan0 and wlan1 for the usb dongles)
cat > /etc/udev/rules.d/72-static-name.rules <<EOF
ACTION=="add", SUBSYSTEM=="net", DRIVERS=="brcmfmac", NAME="wlan0"
EOF

#reboot the pi to apply these changes
reboot

```


##Configure the wireless access point and dhcp server

Thanks to this script: https://gist.github.com/Lewiscowles1986/fecd4de0b45b2029c390

```bash
apt-get install hostapd dnsmasq -y

#enable the wireless access point service and set it to start when the pi boots.
sudo systemctl unmask hostapd
sudo systemctl enable hostapd

cat >> /etc/dhcpcd.conf <<EOF
interface wlan0
    static ip_address=192.168.4.1/24
    nohook wpa_supplicant
    denyinterfaces wlan0
EOF

cat > /etc/dnsmasq.conf <<EOF
interface=wlan0
  dhcp-range=192.168.4.100,192.168.4.200,255.255.255.0,24h
  domain=wlan
  address=/gw.wlan/192.168.4.1
EOF

#unblock the wifi
sudo rfkill unblock wlan

#configure the 2.4ghz wireless access point
cat > /etc/hostapd/hostapd.conf <<EOF
country_code=US
interface=wlan0
ssid=CamperPi
hw_mode=g
channel=7
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


###
### set up traffic forwarding to share internet to the CamperWifi network.

#enable packet forwarding right now
sh -c "echo 1 > /proc/sys/net/ipv4/ip_forward"
#enable packet forwarding on every reboot
sed -i -- 's/#net.ipv4.ip_forward=1/net.ipv4.ip_forward=1/g' /etc/sysctl.conf

sudo iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
#save the new iptables rule
sudo sh -c "iptables-save > /etc/iptables.ipv4.nat"
#load iptables rule on reboot
sed -i -- 's/iptables-restore < \/etc\/iptables.ipv4.nat//g' /etc/rc.local
sed -i -- 's/exit 0/iptables-restore < \/etc\/iptables.ipv4.nat\nexit 0/g' /etc/rc.local

apt-get install bridge-utils -y

#create the bridge
brctl addbr br0
#add ethernet to the bridge
brctl addif br0 eth0

cat > /etc/network/interfaces <<EOF
auto br0
iface br0 inet manual
bridge_ports eth0 wlan0
EOF


# sudo systemctl start network-online.target &> /dev/null

# #configure a nat between wlan0 (internet) and wlan0 (camper-wifi access point)
# iptables -F
# iptables -t nat -F
# iptables -t nat -A POSTROUTING -o wlan0 -j MASQUERADE
# iptables -A FORWARD -i wlan0 -o wlan0 -m state --state RELATED,ESTABLISHED -j ACCEPT
# iptables -A FORWARD -i wlan0 -o wlan0 -j ACCEPT


# #enable packet forwarding on every reboot
# sed -i -- 's/#net.ipv4.ip_forward=1/net.ipv4.ip_forward=1/g' /etc/sysctl.conf
# #enable packet forwarding right now
# sh -c "echo 1 > /proc/sys/net/ipv4/ip_forward"

# # Remove default route created by dhcpcd
# sudo ip route del 0/0 dev $eth &> /dev/null




























service dhcpcd restart
systemctl daemon-reload

sudo systemctl unmask hostapd
sudo systemctl enable hostapd
sudo systemctl start hostapd

systemctl enable dnsmasq

sudo service hostapd restart
sudo service dnsmasq restart

```

## Use different drivers
The wifi dongles that I purchased seem to have issues with whatever driver is enabled by default on the raspberrypi. They would connect to the first network, but would fail when connecting to any new networks with an error stating "Association request to the driver failed". 

I spent _A LOT_ of time googling this issue, until I finally came across an obscure [github issue in the raspberrypi/linux repository](https://github.com/raspberrypi/linux/issues/1866#issuecomment-283650385) talking about blacklisting a certain driver. Sure enough, when I ran `ls /etc/modprobe.d`, those drivers were blacklisted. 

So, I un-blacklisted `rtl8192cu`, and that did the trick. 

```bash
#un-blacklist the rtl8192cu module
sed -i -- 's/blacklist rtl8192cu/#blacklist rtl8192cu/g' /etc/modprobe.d/blacklist-rtl8192cu.conf
```

I don't really know why this works, but at this point, I don't care as long as it works...

## Connect external wifi 1

Now that we have the wireless router configured, let's connect one of the wifi radios to my local network

```bash
#create a wpa_supplicant file for each interface
cat > /etc/wpa_supplicant/wpa_supplicant-wlan0.conf <<EOF
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1
country=US
EOF
cat > /etc/wpa_supplicant/wpa_supplicant-wlan1.conf <<EOF
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

#save nat rules to a file
sh -c "iptables-save > /etc/iptables.ipv4.nat"
#apply ip tables on every boot
sed -i -- 's/exit 0/iptables-restore < \/etc\/iptables.ipv4.nat\nexit 0/g' /etc/rc.local
```



## Speed test

```bash
#install python package manager
apt-get install python-pip -y
#install the speedtest-cli
pip install speedtest-cli
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
readlink /sys/class/net/wlan0/device/driver
readlink /sys/class/net/wlan3/device/driver
readlink /sys/class/net/wlan4/device/driver
