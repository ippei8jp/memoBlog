---
title: Jetson nano をセットアップする
date: 2020-10-23
tags: ["DeepLearning", "Jetson nano"]
excerpt: Jetson nano をセットアップする
---

Nvidiaの[Jetson nano](https://www.nvidia.com/ja-jp/autonomous-machines/embedded-systems/jetson-nano/)をセットアップしたときのメモ

# 参照先
- [「Jetson Nano」の電源を入れて立ち上げる](https://monoist.atmarkit.co.jp/mn/articles/1905/30/news029.html)
  - わりと詳しく書いてある
- [Getting Started With Jetson Nano Developer Kit ](https://developer.nvidia.com/embedded/learn/get-started-jetson-nano-devkit)
  - 本家


# SDカードの作成
参照先の通り。

ただし、参照先のSDカードイメージへのリンクは古いので、は以下から最新版をダウンロードする(古いのも下の方を探せば出てくる)  
- [Jetson Download Center](https://developer.nvidia.com/embedded/downloads)

SDカード書き込みは記事に書かれた balenaEtcher でなく WIN32DiskImager でも大丈夫だが、  
balenaEtcher は zipファイルを解凍せずにSDカードに書き込めるので便利。  
ちなみに、*balena* はイタリア語で *鯨* の意味らしい...全然関係ないけど...  

> [!NOTE]
> インストール先のSDカードは32GB必須みたい。  
> 16GBだとインストールしただけで「残り少ない」と言われてしまう。  

> [!NOTE]
> SDカードスロットが分かりにくいところにある(開発ボード側ではなく、モジュール側の裏側)。  
> シリアルコンソール繋いでるとケーブルが邪魔で特に挿抜しにくい...  

> [!WARNING]
> 一度このイメージを書き込んだSDカードは、以後Windowsから認識されなくなる。  
> よって、SDフォーマッタやディスクイメージ書き込みツールから新たに書き込みできなくなってしまう。
> これは書き込んだSDカードにFATのパーティションが存在しないためのよう。  
> (RaspberryPiはbootパーティションとしてFATパーティションを持っているので認識されるようだ)  
> 
> コントロールパネル→管理ツール→コンピュータの管理を起動して、  
> 記憶域の下のディスクの管理からSDカード上の不明なパーティションを解放し、  
> そこに新たにFATパーティションを作成すればWindowsから認識されるようになる。  
> もちろん、他のUbuntuマシンで書き換えちゃうのもアリだけど。。。  

# シリアルコンソールの使用
シリアルコンソールが必要なら接続できる。  
特に設定等は必要ない。    
接続端子は以下を参照  
- [Jetson Nano – Serial Console](https://www.jetsonhacks.com/2019/04/19/jetson-nano-serial-console/)
  の 「Wiring」の下の「Jetson Nano B01」を参照。  

シリアルポートの設定は115200bps/8bit/none/1bit/none  

> [!WARNING]
> J41(RaspberryPi互換の40pinヘッダ)のUART端子はコンソールとして動作していないみたい。  
> gettyが動いてないみたいなので。    
> たぶん、``/etc/systemd/nvgetty.sh`` に``ttyTHS2``の設定を追加すればできるようになる感じだけど、試してないので詳細不明。  
> J41のUARTを汎用UARTとして使用するには、以下を参照。  
> - [Jetson Nano – UART](https://www.jetsonhacks.com/2019/10/10/jetson-nano-uart/)


その他、コネクタ類の配置が分かりにくい場合は、
[JETSON NANO DEVELOPER KIT](https://developer.download.nvidia.com/assets/embedded/secure/jetson/Nano/docs/NV_Jetson_Nano_Developer_Kit_User_Guide.pdf?yIbsUqvBKxI1G6r3WW7cOdheZGv2-eSfaFW_kMt3dSgi0NJ7h77OwFHr5b-rquc3IX7Tyrt8FV6IKD4DHqvP4_LzhWt55tb071gqXlNGwBPYCOC5pnEKAla8D-B82bPjhQMykANFyn-EhxZRHC8AIBYWuVwwwXVPWtCOjs34Tg50oBdN0vBNoyUlZMRFXLNJ2to)
のP22 に**Developer kit module and carrier board: rev B01 top view**として配置図が掲載されているので参照のこと。  

# FirstBoot
最初のブートでUbuntuのセットアップを行う。  
これも参照先の通り。  
終わったら、何はともあれ最新版にアップデート。  

```bash
sudo apt update
sudo apt upgrade
```

ここで一旦リブートしておく。

その他こまごました設定はこちらが参考になるかも。  
- [UbuntuをNative環境にインストールする(18.04)](https://ippei8jp.github.io/memoBlog/2020/05/08/ubuntu_native.html)

インストールしたパッケージ
gnome-tweaks
dconf-editor
samba
> [!NOTE]
> min/max/closeボタンがウィンドウ右側に移動できない...
> ちょっとストレス...

# その他設定
## ウィンドウマネージャをUnityからubuntuに変更する
Unityは使いにくくて嫌(個人の見解デス)なので、Ubuntuに変更する(変更しなくても良い)。
自動ログインしている場合は、一旦ログアウトして、  
再ログインする際に、「サインイン」ボタンの左にある歯車アイコンをクリック→Ubuntuを選択してから  
ログインすると、ウィンドウマネージャがUbuntuに変更されている。  
次回ログイン(自動ログインでも)は何もしなくても前回のウィンドウマネージャが選択される。  
> [!NOTE]
> Ubuntuに変えると min/max/closeボタンがウィンドウ右側に移動できてる。  
> 結果オーライ😅


## SSHでの接続
特に設定などは必要ない。  
TeraTermなどで接続すれば良い。
UbuntuではmDNSが動いているので、«マシン名».localでアクセスできる。  

コマンドは以下の通り。  
```
"C:\Program Files (x86)\teraterm\ttermpro.exe" /auth=password /user=«ユーザ名» /passwd=«パスワード» «JetsonのIPアドレス or マシン名.local»
```
> [!NOTE]
> SSHやmDNSは立ち上がるまで少し時間がかかるみたいなので、  
> 起動後数十秒程度待ってから接続した方が良い。  

## シリアルコンソール/SSH接続でGUIウィンドウを表示できるようにする
シリアルコンソール/SSH接続でGUIウィンドウを表示できるようにするには、
WindowsPCなどでX-Serverを動作させておき、  
そこに出力するようにすればよい。  
Jetson側は``~/.bashrc``に以下を追加しておく。  
ここのIPアドレスはX-Serverが動作しているマシンのIPアドレスに変更すること。  

```bash
if [ "$XDG_SESSION_TYPE" != "x11" ]; then
    export DISPLAY=192.168.XX.XX:0.0
fi
```


