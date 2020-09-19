---
title: RaspberryPi 小ネタ集
date: 2020-09-20
tags: ["RaspberryPi"]
excerpt: RaspberryPiの小ネタ集
---

# Raspbian Busterのインストール
[Raspbian Busterのインストール]({{ site.baseurl }}/2019/08/31/raspbian_buster_1.html)  


# Raspbian Buster Lite版のインストール
[Raspbian Buster Lite版のインストール]({{ site.baseurl }}/2019/09/13/raspbian_buster_2.html)  

# モバイル ホットスポットでRaspberryPiをネットに接続
[モバイル ホットスポットでRaspberryPiをネットに接続]({{ site.baseurl }}/2019/09/12/mobilehotspot.html)  

# VNCタイムアウトの変更
RasPiにWindowsからVNC Viewerでつないでいると、しばらくほったらかしにすると切断されてしまう。  
これを防ぐには、  

- RasPi側のタスクバーのVNCのアイコンを右クリック → Options... → Expert   
- パラメータで「IdleTimeout」を探す
- 設定値を「0」に変更(デフォルトは3600(＝60分)になっている)

これでタイムアウトで切断されなくなる  


