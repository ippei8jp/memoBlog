---
title: RaspberryPi 小ネタ集
date: 2020-09-20
tags: ["RaspberryPi"]
excerpt: RaspberryPiの小ネタ集
---

# Raspbian Busterのインストール
[Raspbian Busterのインストール]({{ site.baseurl }}/2019/08/31/raspbian_buster_1.html)  
[Raspberry Pi OS(May 7th 2021)のインストール]({{ site.baseurl }}/2021/07/17/raspios_20210507.html)  


# Raspbian Buster Lite版のインストール
[Raspbian Buster Lite版のインストール]({{ site.baseurl }}/2019/09/13/raspbian_buster_2.html)  

# SDカードイメージファイルの作成
[Raspbian SDカードイメージファイルの作成(改訂版)]({{ site.baseurl }}/2021/07/18/sd_image_2.html)

# モバイル ホットスポットでRaspberryPiをネットに接続
[モバイル ホットスポットでRaspberryPiをネットに接続]({{ site.baseurl }}/2019/09/12/mobilehotspot.html)  

# VNCタイムアウトの変更
RasPiにWindowsからVNC Viewerでつないでいると、しばらくほったらかしにすると切断されてしまう。  
これを防ぐには、  

- RasPi側のタスクバーのVNCのアイコンを右クリック → Options... → Expert   
- パラメータで「IdleTimeout」を探す
- 設定値を「0」に変更(デフォルトは3600(＝60分)になっている)

これでタイムアウトで切断されなくなる  

# IPv6の無効化
- ``/etc/sysctl.conf``に以下を追加する  
```
net.ipv6.conf.all.disable_ipv6 = 1
net.ipv6.conf.default.disable_ipv6 = 1
```
- 以下を実行する  
```bash
sudo sysctl -p
```

# Windowsの共有フォルダのマウント

## Windows側の準備
Windows側でネットワーク共有したいフォルダを共有に出しておく。  
めんどくさいのでEveryone フルアクセスで共有に出しておく(自宅なら問題ないでしょう)  

## RasberryPi側でのマウント
```bash
sudo mount -t cifs «ネットワークパス» «マウントポイント» -o uid=«linuxのユーザ名»,gid=«linuxのグループ名»,user=«Windowsのユーザ名»,password=«Windowsのパスワード»
```

【注意】  
- ネットワークパスのマシン名はNetBIOSの名前(MY_PC)ではなく、mDNSで解決できる名前(MY_PC.local)なので注意。もちろん、IPアドレス直接指定でも問題なし。
- Everyonで共有に出してあってもanonymousでアクセス出来るわけではないらしいので、Windowsのユーザ名とパスワードは必要。
- uidとgidは指定してないとオーナがrootになってしまうので、フォルダ内のファイルに書き込みたい場合は指定が必要。


例えば、こんな感じ。  
```bash
mount -t cifs //MY_PC.local/Share1 /mnt -o uid=hoge,gid=hoge,user=fuga,password=fugafuga
```

参考： <https://qazsedcftf.blogspot.com/2019/12/raspberry-pi_21.html>

# バージョン情報の取得

## ハードウェアの情報
```bash
cat /proc/device-tree/model
Raspberry Pi 4 Model B Rev 1.2
```

## カーネルバージョン等の情報
```bash
~$ uname -a
Linux Pi4 5.10.17-v7l+ #1421 SMP Thu May 27 14:00:13 BST 2021 armv7l GNU/Linux
```

## ディストリビューションやバージョンの情報
```bash
~$ lsb_release -a
No LSB modules are available.
Distributor ID: Raspbian
Description:    Raspbian GNU/Linux 10 (buster)
Release:        10
Codename:       buster
```







