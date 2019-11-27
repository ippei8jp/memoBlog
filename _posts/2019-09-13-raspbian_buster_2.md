---
title: Raspbian Buster Lite版のインストール
date: 2019-09-13
tags: ["RaspberryPi","setup"]
excerpt: Raspbian Buster with desktopのインストールと初期設定。
layout: default
---

# ダウンロードとSDカードの用意

ダウンロードはこちら。<https://www.raspberrypi.org/downloads/raspbian/>   
「Raspbian Buster Lite」 の 「DownloadZIP」でダウンロードする。  
以下の手順は、RaspberryPi Zero W、「Version: July 2019」 で確認。

## ブート前の設定

ブートの前にSDカードのFATパーティションのファイルをいじっておく。  

### UARTコンソールの有効化

UARTをコンソールとして使用するために``config.txt``に以下を追加
```
# enable uart
enable_uart=1 
```
### ディスプレイ解像度の設定

ついでにディスプレイ出力の解像度を変更するために``config.txt``に以下も追加。  
``framebuffer_XXX``は表示したいサイズに合わせる。1920と1080とか、1280と720とか。  
``hdmi_force_hotplug``を1に設定することで、ホットプラグを無効にし、常に接続状態となる。  
これはHDMIを後から接続したら表示が出ないのを防ぐため。

```
# display resolution force setting
framebuffer_width=1280
framebuffer_height=720
hdmi_force_hotplug=1
```

### Wi-Fiの設定

Wi-Fiのアクセスポイントに接続するために  
SDカードのFATパーティションに ``wpa_supplicant.conf`` という名前のファイルを以下の内容で作成する。``ssid``と``psk``は使用する環境に合わせて修正すること。
SSID名は ダブルクォーテーションで囲む。
暗号化キーは平文で記載する場合は ダブルクォーテーションで囲む。256bitキーの場合はダブルクォーテーションで囲まない。

```
country=JP
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1
network={
    ssid="SSID名"
    psk="暗号化キー"
}
```

なお、暗号化キーの256bitキーは``wpa_passphrase``コマンドで作成できる。
```bash
wpa_passphrase "SSID名" "暗号化キー"
        ↓ 実行結果
network={
        ssid="SSID名"
        #psk="暗号化キー"
        psk=ほにゃらら～～～ほにゃらら～～～
}
```
この実行結果を``wpa_supplicant.conf``の該当部分に転記すればよい。  
ちなみに、``#psk="暗号化キー"``の部分は削除しておくのが良い。(そうでないと何のために暗号化したのか分からなくなる。
そのままでもコメントとして扱われるので実動作に影響はないが。)  
また、既に接続済みのシステムがある場合は、そのシステムの``/etc/wpa_supplicant/wpa_supplicant.conf``をコピーして使用しても良い。

### SSH接続の有効化

SSH接続を有効にするために  
SDカードのFATパーティションに ``ssh`` (または ``ssh.txt`` ) という名前の空ファイルを作成する。  

ここまでPCでの作業。  

# 起動

作成したSDカードをRaspberryPiに挿入し、起動。  
起動ログはHDMI、シリアルコンソール両方に表示される。(SplashScreenをOFFしていた場合：後述)  

# デフォルトのユーザ名を変更

RaspberryPiを使うとき、デフォルトパスワードの変更は言わずもがなですが、  
できればユーザ名も変更しておきましょう。  
追加してもいいけど、今あるユーザをリネームした方がなにかと便利。  

```
sudo useradd -M temp                    # デフォルトユーザの変更のためにtemporary userを作る
sudo gpasswd -a temp sudo               # temporary user にsudoグループを追加
sudo passwd temp                        # temporary user にパスワード設定

# 一旦log offしてtempでlog in

sudo usermod -l <新ユーザ名> pi                     # usermod -lでユーザ名をpiから<新ユーザ名>に変更
sudo usermod -d /home/<新ユーザ名> -m <新ユーザ名>  # usermod -dでホームディレクトリを/home/piから/home/<新ユーザ名>に変更
sudo groupmod -n <新ユーザ名> pi                    # groupmod -nでpiグループを<新ユーザ名>グループに変更

# log offして新ユーザでlog in

sudo userdel temp                       # temporary user を削除

# パスワード変更する
passwd
《パスワードを設定》

```

参考情報はこちら。<https://jyn.jp/raspberrypi-username-change/>

↑にも書いてあるが、ユーザ名を変更するとsudoではパスワードを聞かれるようになる。  
(おススメしないが)新しいユーザでも``sudo``のパスワードを省略したい場合は``/etc/sudoers.d/010_pi-nopasswd``の先頭の``pi``を<新ユーザ名>に変更する。  

# 何はともあれ、最新版へ   
```bash
# アップデート実行
sudo apt update
sudo apt upgrade
# リブート
sudo reboot
```

``sudo rpi-update`` は前は実行してたけど、なんか「通常は実行するな」と言われるのでやめておこう。  


# ロケールやらタイムゾーンやらの設定

日本語表示や時刻を日本時間に設定するための設定を行う。

```
sudo raspi-config
    4 Localisation Options
        I1 Change Locale
            [ ] ja_JP.UTF-8 UTF-8     でスペースを押して[*] にする
            TABを押して<Ok>を選んでリターン
                Default locale for～ と聞かれるので、
                ja_JP.UTF-8          を選択
                TABを押して<Ok>を選んでリターン
    4 Localisation Options
        I2 Change Timezon
            Asia
                Tokyo
    <Finish>
```

設定変更を有効にするにはrebootが必要。  


# ~/.bashrcの設定など

シリアルコンソールを使用する場合、コンソールサイズがあってなくてイライラするので、シリアルコンソールの設定用スクリプトを以下の手順で取得。  

```bash
cd ~
wget https://gist.githubusercontent.com/ippei8jp/8179edb10867faf98e233a52965a9e53/raw/c397ae5cd29948a940117ab7baf1b4c6a664b33e/resize.py
chmod +x resize.py

```

``~/.bashrc``に以下を追記。  

```bash

# プロンプトの設定
PS1="\w\$ "

# キーバインドの設定
bind '"\C-n": history-search-forward'
bind '"\C-p": history-search-backward'

# ディレクトリスタックの表示改善
function pushd() {
    command pushd $* > /dev/null
    command dirs -v
}
function popd() {
    command popd $* > /dev/null
    command dirs -v
}
function dirs() {
    command dirs -v
}

# 表示色変更
export LS_COLORS='di=01;32:ln=01;36:ex=01;31:'
export GREP_COLORS='mt=01;31:ml=:cx=:fn=01;32:ln=32:bn=32:se=36'

# reset console size
case "$TERM" in
    vt220) ~/resize.py ;;
esac

# pyenv 設定
# export PYENV_ROOT=/proj/.pyenv
# export PATH=$PYENV_ROOT/bin:$PATH
# eval "$(pyenv init -)"
# eval "$(pyenv virtualenv-init -)"


# nodenv 設定
# export NODENV_ROOT=/proj/.nodenv
# export PATH=$NODENV_ROOT/bin:$PATH
# eval "$(nodenv init -)"
```


# マシン名の変更

お好みでマシン名を変更(対応する部分を変更各1カ所) 

```bash
sudo vi /etc/hostname
sudo vi /etc/hosts
```


# キーボードのCAPS - CTRLの入れ替え
HDMI接続で使わないなら設定不要

参考：  <https://qiita.com/Pseudonym/items/12e447557a5234bb265b>

``/etc/default/keyboard``ファイルの以下の部分を修正

```
XKBOPTIONS=""
    ↓
# XKBOPTIONS="ctrl:nocaps"        # CapsLock --> Ctrl
XKBOPTIONS="ctrl:swapcaps"      # CapsLock <-> Ctrl
```

> [!WARNING]
> これでできるハズなんだけど、なんかうまく行かない。。。  
> SSHなら関係ないから、ま、いっか。  

# ワークディレクトリの作成とsambaの設定
まずはワークディレクトリの作成
```
sudo mkdir /work
sudo mkdir /proj
sudo chown `whoami`:`whoami` /work /proj

```

sambaのインストールと設定

```
sudo apt install samba
sudo smbpasswd -a `whoami`
    パスワードを設定
```

設定変更のため、``/etc/samba/smb.conf`` を編集  

``[global]`` の下に以下を追加
```
map archive = no  
```
``[homes]`` の下の以下を修正

```
read only = no
```

> [!NOTE]
> home は一旦log inしないと見えない

最後に以下を追加
```
[work]
path = /work
guest ok = no
writable = yes
map archive = no
share modes = yes
dos filetimes = yes
force group = <ユーザ名>
force create mode = 0664

[proj]
path = /proj
guest ok = no
writable = yes
map archive = no
share modes = yes
dos filetimes = yes
force group = <ユーザ名>
force create mode = 0664

```

サービスの再起動  

```bash
sudo service smbd reload
sudo service smbd restart
```


# HDMIコンソール用日本語入力＆表示環境構築

デフォルトのままだと、HDMIコンソールは日本語の入力はおろか、表示もできない。  
そこで、日本語入力＆表示環境を整備する。  
HDMIコンソールで日本語を使わないなら本章は設定不要。  

## フォントのインストール

フォントをインストールしないと表示できないのでまずはフォントのインストール。  

```bash
sudo apt install fonts-noto-cjk 
```

## ターミナルエミュレータのインストール

デフォルトのターミナルは日本語を表示できないので、日本語対応のターミナルエミュレータを使う。  
ネット上にはjfbtermを使用する記事が多いが、jfbtermはイマイチらしいのでfbtermを使う。  

```bash
sudo apt install fbterm
```

## 日本語変換システムのインストール

日本語入力のためのプログラム。Windowsで言うところのMS-IMEやATOKに相当するもの。  

```bash
sudo apt install uim-fep uim-anthy
```

## fbtermの設定

fbtermの設定は、 ~/.fbtermrc で行う。  
**HDMIコンソールから** fbtermを一度起動すると ~/.fbtermrc ができるので、設定変更するときはこれを書き換える。  
例えばこんな感じ。  

```bash
font-size=18
```

fbtermを起動したときに``[input] can’t change kernel keymap table ～``と表示されるときは以下を実行すると良い。(表示されるだけで実害はないらしい)



```bash
sudo setcap 'cap_sys_tty_config+ep' /usr/bin/fbterm
```

または、以下でも良い。  

```bash
sudo chmod u+s /usr/bin/fbterm
```


参考： <https://qiita.com/mtomoaki_96kg/items/e5a946fd38f7318d3758?fbclid=IwAR2d8ekXNiD9cqvpqycdfinDZMHZ0OcTmaETTsci1UA9T-aDtc3LvfOiaa0>



## uim(日本語変換システム)の設定

uimでCTRL+SPACEでFEPの切り替えの設定。
~/.uim に以下の内容を記述(なければ新規作成)。  
参考： <https://qiita.com/tukiyo3/items/376e3a2895a71ff9bfc7>   

```
(define default-im-name 'anthy)
(define-key generic-on-key? '("<Control> " "`"))
(define-key generic-off-key? '("<Control> " "`"))
```

>[!NOTE]
各行のシングルクォーテーションは1個だけ。文字列として区切っている訳ではない。  
余計なシングルクォーテーションを入れると動かなくなるので注意！！



## 起動時にfbtermを起動する

起動時にfbtermを起動するには以下を ~/.profile 、 ~/.bashrc に追加

### ~/.profile

最後に以下の内容を追加

```bash
if [ "$TERM" = "linux" ]
then
#   FBTERM=1 exec fbterm -- uim-fep
   FBTERM=1 fbterm -- uim-fep
   exit
fi
```

本当はコメントアウトされてる方の exec を使うようにしないといけないが、現状うまく動かないらしい。  
(Strechでは動いていたと思う)  
仕方ないので、fbtermをbashの子プロセスとして実行するようにしてある。  
これだとうまく動いている(当然、メモリ消費量は増えるけど)。  

また、ログアウトの際にCTRL+Dを2回入力しないといけなくなる(fbtermからのexitとbashからのexit)のを回避するため、 fbterm終了時にexitコマンドを実行している。  



### ~/.bashrc

最後に(でなくてもいいけど)、以下を追加

```bash
case "$TERM" in
    linux)
        [ -n "$FBTERM" ] && export TERM=fbterm
        ;;
    fbterm)
        # 何もしない
        ;;
    *)
        # 何もしない
        ;;
esac
```


# ま、こんな感じかな。

