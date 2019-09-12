---
title: モバイル ホットスポットでRaspberryPiをネットに接続
date: 2019-09-12
tags: ["RaspberryPi", "Windows"]
excerpt: Windows10のモバイル ホットスポットでRaspberryPiをネットに接続する手順
layout: default
---

お出かけ先でも RaspberryPi を、常に同じWi-Fi AP で接続できるような方法を考える。

一つの案として、Windows10のモバイル ホットスポットを経由して RaspberryPi をネットワークにつなげる。
この場合、PCと RaspberryPi はセットで持ち歩くものと考えれば、 
RaspberryPi は常にPCのモバイル ホットスポットのAPに接続すれば良いことになる。  

一つのWi-Fiアダプタを通常接続用とモバイル ホットスポット用でシェアすることはできないので、  
USBドングルを追加して使用する。

- 内蔵Wi-Fi → 通常接続用
- USBドングル → モバイル ホットスポット用

USBドングルは BUFFALO WLI-UC-GNM2S で確認
WindowsはWindows10 ver.1903 で確認

# Windows側の事前準備

内蔵Wi-Fi は 通常通り ルータに接続しておく。  
このとき、どのルータに繋いでいるかは考慮しなくて良いはず。  

>[!NOTE]
>PCのルータ接続ダウン時、モバイル ホットスポットは使えない

USBドングル BUFFALO WLI-UC-GNM2S はあらかじめドライバをインストールしてWindowsに認識させておく。  
接続先は設定しなくて大丈夫。

- Windowsで「設定」→「ネットワークとインターネット」→「モバイル ホットスポット」を開く
    - 「インターネット接続を共有する」で、ルータに接続しているアダプタを選択
    - 「Wi-Fi」を選択
    - 「ネットワーク名」と「ネットワーク パスワード」をメモっておく
    - この状態で一番上のスイッチを「オン」にする
        - スイッチがアクティブカラーになったら準備完了

# RaspberryPi側の事前準備

## /etc/wpa_supplicant/wpa_supplicant.conf の修正

モバイル ホットスポットか通常のルータか、どちらか生きてる方に接続にいくように設定する。  
(いつもの環境ならモバイル ホットスポット使わなくて良いように)  

以下の「モバイルホットスポットのSSID名」「パスワード」は  
上記でメモった「ネットワーク名」と「ネットワーク パスワード」を記入する。  
ダブルクォーテーションで囲むのを忘れないこと。  

```bash
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1
country=JP

network={
        ssid="デフォルトのSSID名"
        psk="パスワード"
        priority=3
}

network={
        ssid="モバイルホットスポットのSSID名"
        psk="パスワード"
        priority=5
}
```

>[!NOTE]
> priority設定値は大きい方が優先される。  
上記の場合、モバイルホットスポットが生きていればそちらが優先される


## AP再接続用スクリプト

モバイル ホットスポット の Enable/Disable を切り替えたとき、  
(RaspberryPiを起動してからモバイルホットスポットを有効にするのを忘れていたことに気がついたなど)
RaspberryPiのネットワーク設定は自動的に新しい環境に切り替わらない。  
コマンドをチマチマ入力するのも面倒なので、コマンド イッパツで再接続処理するようにしておく。  

まず、 ~/wifi_reconnect.sh を以下の内容で作成する。  

```bash
echo wlan0 down..
sudo ifconfig wlan0 down
sleep 1

echo wlan0 up..
sudo ifconfig wlan0 up
sleep 3

echo re-get IP address...
dhclient -r
sleep 15

echo DONE!!
```

スクリプトファイルに実行属性をつける。

```bash
chmod +x ~/wifi_reconnect.sh
```

再接続したいタイミングで ``~/wifi_reconnect.sh``を実行する。  
DHCPのアドレス確定時間分を待っているので、コマンド実行には20秒強かかる。  

# RaspberryPiの起動

上記の準備が整ったら、RaspberryPiを起動する。  
起動後、``ifconfig``(他のコマンドでも良いけど)でIPアドレスを確認する。

- 192.168.137.XXX になっていればOK



また、PC側で「設定」→「ネットワークとインターネット」→「モバイル ホットスポット」の  
「接続されているデバイス」にRaspberryPiが表示されているハズ。



# 問題点

## Windows10 PCがルータにつながっていないと使えない

ルータにつながっていないと、そもそもモバイル ホットスポット がオンできない。  
これは、ネットワーク環境がまったくない場合(つまりPCとRaspberryPiだけで箱庭環境だけ作りたいとき)は使えない。  
回避策としては、スマホのテザリングでネットワークにつなぐ？
間違って外部にアクセスしちゃったら、パケ死しそう。。。  

## PCの外側(ルータのサブネット内)からRaspberryPiにアクセスできない

モバイル ホットスポットのサブネットとルータのサブネットは別なので、  
モバイル ホットスポットのサブネットの外側から内側へのアクセスはできない。  
もちろん、ルータの外側からもアクセスできない。  
RaspberryPiにアクセスできるのはモバイル ホットスポットを提供しているPCのみ。  

## mDNSが使えない

モバイル ホットスポットのサブネットとルータのサブネットは別なので、
ルータを超えられないmDNSは名前を取得できない。  
回避策としては、/etc/hosts を名前エラーが出るたびに名前追加するか？


# 結論

とりあえず、RaspberryPiにアクセスするのはWindowsPC 1台のみで、  
RaspberryPiからアクセスするはルータの外側のみ、という条件なら使えそう。  

う～ん、良いところまで行くんだけど、微妙に不満の残る結果に。。。  


