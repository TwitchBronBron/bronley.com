---
layout: post
title: Password-less SSH Login
hideAffiliateDisclaimer: false
---

All of the tutorials I found were a bit confusing. So I wanted to make this blog post for my own benefit as I went through the process, and hopefully be as clear as possible.

We have two devices. Let's give them some simple names to make this easier to discuss: 

**your laptop** - This is your local laptop. It's the computer you will be using to ssh FROM. 

**the server** - This is the device you want to SSH INTO. It's the remote device where you will be actually executing all of your commands once you have connected via SSH. 


Normal workflow: 

1. Open your laptop
2. Open a terminal or PUTTY.
3. Initiate an SSH connection. 
4. When prompted, enter your username and password
5. Do things on the server. 

The problem with this workflow is that you can't easily run automated processes that need SSH, because they would need your password (and we definitely don't want to store your password in the automated scripts). 


On **your laptop**, execute the following commands

```bash
#generate a set of SSH public and private keys (with no password)
ssh-keygen -f ~/.ssh/id_rsa -t rsa -N ''

#copy the ssh public key to "the server" (#you will need to enter your password for "the server" when prompted)
ssh-copy-id pi@192.168.1.8

```