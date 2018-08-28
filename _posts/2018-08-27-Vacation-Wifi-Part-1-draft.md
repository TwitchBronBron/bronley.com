---
layout: post
title: Raspberry PI Wifi
hidden: false
---
Every year we spend two weeks at a campground in Myrtle Beach. Our favorite site is located along the southern edge of the campground, which means we are farther from the campground's wifi access points. Unfortunately, our site is far enough away that the access points are almost unusable. 

My family's entire media diet consists of on-demand internet video providers like Netflix and Hulu, as well as a local media server for content we own. An inconsistent internet connection can quickly put a damper on the evening movie nights. 

For the past few years, I have solved this "[problem](https://www.urbandictionary.com/define.php?term=First%20World%20Problems)" by bringing a few routers and connecting one to the closest campground access point and using another to create a new wifi network for our site.

<br/>

## My Current Process

When we first arrive, I spend an hour or two getting the wifi set up. This can be broken down into a few steps: 

**Step 1**: Set my laptop in one corner of the camper, run [WifiInfoView](https://www.nirsoft.net/utils/wifi_information_view.html) for a few minutes, and write down the SSID and signal strength of the strongest open wifi access point. Repeat for the other 3 corners and pick the best corner/access point combo.

**Step 2**: Manually configure a [Netgear WRT54G router](https://www.amazon.com/Linksys-WRT54G-Wireless-G-Router/dp/B00007KDVI) running custom firmware [DD-WRT](https://dd-wrt.com/) to wirelessly connect to the campground access point using [wireless client mode](https://wiki.dd-wrt.com/wiki/index.php/Client_Mode_Wireless). 

**Step 3**: Share the internet connection from WRT54G with our [Netgear R6300v2 router](https://www.amazon.com/NETGEAR-Router-AC1750-Gigabit-R6300v2/dp/B00EM5UFP4) by connecting the WAN port of the R6300 to a LAN port of the WRT54G.

This process is obviously not for the faint of heart. My in-laws vacation there several times a year without me; there's no way they would have the patience (or desire) to go through this every time. We can't reuse the same settings every vacation either because we don't always get the same site, meaning last vacation's "best" access point may be too far out of range for this site. 

There are definitely some flaws in this process. For example, the actual speed of the access point isn't considered, just how strong the signal is. It's possible that certain access points are more saturated by traffic or are running slightly older hardware with less throughput. Also, as campers leave and new campers arrive, there are now new physical changes to the wireless landscape between our camper and the campground access points. 

Now sure, I could re-run the test every few days to make sure I am still using the strongest access point. I could also include a speed test at each of the four corners to test which access point is fastest. However, all of these steps take additional work, and this is supposed to be vacation after all! 

<br/>

## A New Idea

The more I use my existing process, the more it drives me to want an automated solution. This summer was the breaking point. We registered a little late for a site, and ended up in the site which is furthest from all of the access points. I did find the most tolerable access point, but I had to run the tests twice because none of the results were satisfactory. 

I started thinking of ways to solve this problem. Using conventional routers was probably out of the question: it's just too difficult to write custom software to run on routers. That means I would need to use some small computer like a Raspberry PI. For now, let's just call it "the new device". Here are the requirements for the new device: 

**Requires no human interaction**. <br/>
Anyone staying in the camper should be able to plug the new device into power, wait a few minutes, and enjoy their newfound internet. 

**Adapts to changing network conditions**<br/>
New campers arrive every day and could end up parking between our camper and the access point. Campers leave every day, which could open up a direct line-of-sight between our camper and a stronger access point. The new device would need to regularly monitor the strength of all available access points, and adjust itself accordingly

**Provides separate subnet**<br/>
I regularly bring a small Raspberry PI powered media server with a portion of our movie collection on it. As such, I don't want everyone on the campground to have the ability to tap into that media server, so the new device's network needs to be on its own subnet.

**Provide an interface to manage settings**<br/>
The new device would still need to operate as a regular router, and would an admin screen to configure things like the local wifi SSID, local wifi password, IP range, etc. I imagine this would be a web interface like most other routers. It could also show the various metrics being collected, like the current "best" access point, how frequently we switch access points, which access points are strongest right now versus over time, etc. 

<br/>

## The Plan

After I gathered my requirements, I spent some time some brainstorming, and I came up with a (probably over-engineered) solution:

> Use a Raspberry PI and two external USB wifi cards. Write some custom code to monitor for the best open wifi network, connect to that network, and provide internet through our own private wifi network.

The [Raspberry PI 3 B+](https://www.raspberrypi.org/products/raspberry-pi-3-model-b-plus/) has a dual-band (2.4ghz and 5ghz) wifi card already built-in, which is perfect for broadcasting dual-band wifi at the camper. I could then get two additional USB wifi cards, one for regularly evaluating the open access points and the other for maintaining a persistent connecting to that best network. Since I'm not worried about the device being pretty, the USB wifi cards could have large external antennas which would help increase its range. 


The reason for having *two* external antennas is that it would allow for one antenna to regularly evaluate different access points without disrupting the current service over the second antenna. External antenna 1 would be the dedicated connection to the most optimal campground access point. External antenna 2 would regularly evaluate all available wifi access points, testing to see which one is most dependable and the fastest over time. If a better access point is discovered, then external antenna 1 would switch to using the better access point. The system could store all of the past test results and use those results to make more educated decisions when picking which campground access point is the best choice.
<br/>

With this plan in mind, I purchased the following gear: 

 - Raspberry PI 3 B+, power cable, heat syncs, case (CanaKit has a nice kit on Amazon [here](https://www.amazon.com/gp/product/B07BC7BMHY))
 - Two high-gain USB Wifi antennas [from Ebay](https://www.ebay.com/itm/251549885235)

When they arrive, I'll start configuring the system. Once I have worked out the kinks, I'll publish a followup post outlining the specifics. 

In the mean time, I'd love to hear your thoughts on this project. Is there already something out there that does all of this? Leave a comment and let me know what you think!

