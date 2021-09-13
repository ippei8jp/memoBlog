---
title: Jetson nano をUSBドライブからブートできるようにする(Jetpack4.6)
date: 2021-09-14
tags: ["DeepLearning", "Jetson nano"]
excerpt: Jetson nano をUSBドライブからブートできるようにする(Jetpack4.6)
---

# 概要
SDカードのアクセスが遅いのと、USBドライブの方が大容量のメディアを入手しやすいので
USBドライブをブートデバイスに変更してみる。  

といっても、Jetpack4.5以降ではブートローダがUSBからのブートをサポートしたので、かなり簡単になった。  

Jetpack4.4のときのメモは[Jetson nano をUSBドライブからブートできるようにする]({{ site.baseurl }}/2020/10/30/Jetson_usb_boot.html){:target="_blank"} にあります。  


# ディスクイメージの書き込み
通常セットアップを行ったSDカードのディスクイメージをUSBドライブにコピーします。
SDカード→USBドライブ直接でも構いませんし、バックアップとして作成したディスクイメージファイルからでも構いません。  

ubuntu PCでディスクイメージファイルからコピーする場合はこんな感じ。  
``/dev/sdc`` の部分は環境により異なるので注意(間違って他のディスクに上書きしないように！！)。  
``jetpack46_XXXXXXXX.img``がディスクイメージファイルのファイル名です。  

```bash
sudo dd of=/dev/sdc if=jetpack46_XXXXXXXX.img bs=1M status=progress
```

# BOOTデバイス変更のための設定

ディスクイメージを書き込んたUSBドライブをSDカードブートした Jetson nano や ubuntu PCに接続し、
設定ファイルを書き換えます。

```bash
# ディスクのマウント
sudo mount /dev/sdc1 /mnt
cd /mnt/boot/extlinux/
# オリジナルファイルのバックアップ
sudo cp extlinux.conf extlinux.conf.mmc
# 編集
sudo vi extlinux.conf
```

以下のように変更します
具体的には``/mnt/boot/extlinux/extlinux.conf`` 内の 
``/dev/mmcblk0p1``を``/dev/sda1``に変更します。  

```diff
--- extlinux.conf.mmc	2021-09-14 06:02:45.889520568 +0900
+++ extlinux.conf	2021-09-14 06:03:29.453873117 +0900
@@ -7,7 +7,7 @@
       MENU LABEL primary kernel
       LINUX /boot/Image
       INITRD /boot/initrd
-      APPEND ${cbootargs} loglevel=6 root=/dev/mmcblk0p1 rw rootwait rootfstype=ext4 console=ttyS0,115200n8 console=tty0 fbcon=map:0 net.ifnames=0 ipv6.disable=1
+      APPEND ${cbootargs} loglevel=6 root=/dev/sda1 rw rootwait rootfstype=ext4 console=ttyS0,115200n8 console=tty0 fbcon=map:0 net.ifnames=0 ipv6.disable=1
 
 # When testing a custom kernel, it is recommended that you create a backup of
 # the original kernel and add a new entry to this file so that the device can
```
>[!NOTE]
> rootパラメータはパーティションのUUIDを書いておくのが最近の作法らしいが
> 大抵 マウント先は ``/dev/sda1`` なので、お手軽にこっちで指定する。  

# ついでに設定
ついでにパーティションサイズも変更しておくと良いです。  

# BOOT
あとはJetson nano にUSBドライブを接続し、元々ブートに使用していた**SDカードを取り外し**て電源ON。  

起動後、USBドライブがrootにマウントされていることを確認  
``mount``で確認しても良いけど、いっぱい出てきて鬱陶しいので``df``で。  
```bash
df -h /
```
こんな感じで行頭にマウント元が表示される。
```
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1       108G   13G   91G  13% /
```

