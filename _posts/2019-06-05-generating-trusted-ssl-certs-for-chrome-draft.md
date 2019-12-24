---
layout: post
title: Generating Trusted SSL Certificates for Chrome
hideAffiliateDisclaimer: true
---

One of the more annoying things in web development is dealing with SSL certificates. LetsEncrypt has made it much easier to deal with certs on servers, but the local development space is still quite annoying at times. 

Google chrome no longer accepts self-signed certs that rely on `Common Name` (see [this link](https://support.google.com/chrome/forum/AAAAP1KN0B0zVo3M8CgKzQ/?hl=en&gpf=%23!topic%2Fchrome%2FzVo3M8CgKzQ%3Bcontext-place%3Dtopicsearchin%2Fchrome%2Fcategory) for more details). 

Here's a command for generating an ssl certificate for localhost that is fully trusted by Google Chrome and doesn't require 

It's always annoying when you need to download and install a program, configure it, create config files, etc. So I created this script to do everything in one sweep. Just copy this into `command prompt` and execute it. I'm assuming you're running Windows 7 or higher.


```
SET HOSTNAME=localhost

SETLOCAL EnableDelayedExpansion

::download openssl to tmp (so we don't have to install it manually)
certutil.exe -urlcache -split -f "https://indy.fulgan.com/SSL/openssl-1.0.2s-x64_86-win64.zip" C:\temp\openssl.zip

::extract openssl.zip
mkdir "C:\temp\openssl" 2>NUL
powershell -Command "(new-object -com shell.application).NameSpace('C:\temp\openssl').CopyHere((new-object -com shell.application).NameSpace('C:\temp\openssl.zip').Items(), 0x14)"

::create openssl config file
del C:\temp\openssl\!HOSTNAME!.cnf /s /f /q
@echo off
(
echo [req]
echo default_bits = 2048
echo prompt = no
echo default_md = sha256
echo x509_extensions = v3_req
echo distinguished_name = dn
echo:
echo [dn]
echo C = US
echo ST = KS
echo L = Olathe
echo O = IT
echo OU = IT Department
echo emailAddress = webmaster@%hostname%
echo CN = %HOSTNAME%
echo:
echo [v3_req]
echo subjectAltName = @alt_names
echo:
echo [alt_names]
echo DNS.1 = *.%HOSTNAME%
echo DNS.2 = %HOSTNAME%
 ) > C:\temp\openssl\!HOSTNAME!.cnf
@echo on

::generate the certs
SET OPENSSL_CONF=C:\temp\openssl\!HOSTNAME!.cnf
SET RANDFILE=C:\temp\openssl\rnd
C:\temp\openssl\openssl.exe req -new -x509 -newkey rsa:2048 -sha256 -nodes -keyout %HOSTNAME%.key -days 3560 -out %HOSTNAME%.crt
::clean up
del C:\temp\openssl.zip
del C:\temp\openssl /Q

```