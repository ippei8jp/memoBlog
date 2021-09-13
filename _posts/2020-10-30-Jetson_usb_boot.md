---
title: Jetson nano をUSBドライブからブートできるようにする
date: 2020-10-30
tags: ["DeepLearning", "Jetson nano"]
excerpt: Jetson nano をUSBドライブからブートできるようにする
---

本稿はJetoack4.4での手順です。  
Jetpack4.6のときのメモは[Jetson nano をUSBドライブからブートできるようにする(Jetpack4.6)]({{ site.baseurl }}/2021/09/14/Jetson_usb_boot.html){:target="_blank"} にあります。  

# 概要
SDカードからブートすると、かなりディスクアクセスが遅いのと、ディスク容量を結構喰うので、  
USBドライブ(HDD/SSD)からブートできるようにする手順。  
例によって、先人の知恵を借りるだけだけど(パクりとも言う)...(^^ゞ  

めんどくさそうだったけど、ほとんどスクリプト化されているので、意外と簡単。  

# 参考
- [NVIDIA Jetson Nano USB ディスクをルート構成](https://www.miki-ie.com/nvidiajetsonnano/nvidia-jetson-nano-usb-root/)
- [Jetson Nanoの/をUSBドライブにしてSDカードを長生きさせる](https://qiita.com/sgrowd/items/87d65383c0b74306ea7d)
- [Jetson Nano – Run From USB Drive](https://www.jetsonhacks.com/2019/09/17/jetson-nano-run-from-usb-drive/)


# 手順を再掲しとく

- SDカードからブート
- USBドライブを接続＆フォーマット
- USBドライブをマウント
- ツールのダウンロード
```bash
git clone https://github.com/JetsonHacksNano/rootOnUSB.git
cd rootOnUSB/
```
- USBドライブからbootするためのinitrdを作成する
```bash
./addUSBToInitramfs.sh
```
- SDカードからUSBドライブへファイルをコピーする
```bash
./copyRootToUSB.sh -p «コピー先パーティション»
    # 例: ./copyRootToUSB.sh -p /dev/sda1
```
- 実際にUSBドライブからブートするための設定
  - ``/boot/extlinux/extlinux.conf``のバックアップをとっておく
  ```bash
  sudo mv /boot/extlinux/extlinux.conf /boot/extlinux/extlinux.conf.org
  ```
  - USBドライブのUUIDを調べる
  ```bash
  ./diskUUID.sh
  ```
  → ``XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX``として得られる。
  - `` sample-extlinux.conf`` の ``APPEND``の行のUUID部分を以下のように変更する
  ```
        APPEND ${cbootargs} root=UUID=dc21871e-9db4-434c-98b4-713f55f807eb rootwait rootfstype=ext4
                                         ↓↓↓↓↓
        APPEND ${cbootargs} root=UUID=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX rootwait rootfstype=ext4
  ```
  - 変更した``sample-extlinux.conf``を``/boot/extlinux/extlinux.conf``をコピー
  ```bash
  sudo cp sample-extlinux.conf /boot/extlinux/extlinux.conf
  ```
- リーブート

リブート完了したらUSBドライブがrootにマウントされていることを確認  
``mount``で確認しても良いけど、いっぱい出てきて鬱陶しいので``df``で。  
```bash
df -h /
```
こんな感じで行頭にマウント元が表示される。
```
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1       110G   14G   91G  13% /
```

# 注意
USBドライブからブートできるようになっても、SDカードは取り外してはいけない。  
u-bootからinitrdをロードするのはSDカードなので。  

ということは、``apt update``でカーネルアップデートされても古いカーネルが使われちゃうなぁ...  
それはそのとき考えよう...  
そんなに変わるもんでもないだろう。  

# 独り言
u-bootの環境変数見ると、そのままUSBブート出来そうな感じだったけど、  
実際に``usb start``してみたらエラーになる。  
どうやらu-bootにはUSBドライバが入ってないらしい...  
そんな環境変数残しとくな！！  
