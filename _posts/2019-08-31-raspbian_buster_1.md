---
title: Raspbian Busterのインストール
date: 2019-08-31
tags: ["RaspberryPi"]
excerpt: Raspbian Buster with desktopのインストールと初期設定。
layout: default
---

# ダウンロードとSDカードの用意

ダウンロードはこちら。<https://www.raspberrypi.org/downloads/raspbian/>   
「Raspbian Buster with desktop」 の 「DownloadZIP」でダウンロードしてSDカードに書き込んでブート。  
(「・・・ and recommended software」 の方ではない)  
以下の手順は、RaspberryPi3 model B+、「Version: July 2019」 で確認。

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
framebuffer_width=1920
framebuffer_height=1080
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

GUIログインしているとpiユーザ使用中になってしまうので、GUIを無効化しておく。  
GUI使えないとシリアルコンソールかSSH接続が必須になるので、つながることを以下の手順を実行する前に確認しておくこと。  

手順はこんな感じ。  

```
sudo raspi-config
    3 Boot Options
        B1 Desktop / CLI
            B1 Console
    <Finish>
 Would you like to reboot now?
 と聞かれるので <Yes>
```

ついでにSplash Screenも無効化するならこんな感じで設定。  
シリアルコンソールに起動ログが表示されるようにするにはSplash Screenを無効化しないといけない。

```
sudo raspi-config
    3 Boot Options
        B3 Splash Screen
            Would you like to show the splash screen at boot? 
            に対して <No> を選択
            Splash screen at boot is disabled
            と表示されるので <OK>
    <Finish>
```

以下はシリアルコンソール or SSHで接続して行う。  

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

GUIログインに戻す。  

```
sudo raspi-config
    3 Boot Options
        B4 Desktop Autologin
    <Finish>
 Would you like to reboot now?
 と聞かれるので <Yes>
```

GUIログインのユーザは``raspi-config``を実行したユーザに設定される。なので、ちゃんと変更したユーザで実行しないとダメです。


# 何はともあれ、最新版へ   
```bash
# アップデート実行
sudo apt update
sudo apt upgrade
# リブート
sudo reboot
```


``sudo rpi-update`` は前は実行してたけど、なんか「通常は実行するな」と言われるのでやめておこう。  

# VNCサーバのインストール

リモートデスクトップを使うために、VNCサーバのインストールと有効化を行う。  

```
sudo apt install realvnc-vnc-server   # インストール済みみたいだけど、念のため。
sudo raspi-config
    5 Interfacing Options        
        P3 VNC
            Would you like the VNC Server to be enabled?
            と聞かれるので <Yes>    
            The VNC Server is enabled
            と表示されるので <Ok>
    <Finish>
```
Windows側のクライアントは、  
<https://www.realvnc.com/en/connect/download/viewer/> 
から VNC Viewerをダウンロード。  
Windowsを選択してStandalone EXE x64(またはx86)を選択、ダウンロードボタンをクリック。  
インストールは不要でダウンロードしたファイルを実行したら、あとは良きにはからえ。  
VNC経由だと、日本語キーボードの設定しなくても日本語キーボードが使えるらしい。  
日本語化の手順はこちらを参考に。 <http://俺の技術メモ.net/raspbian-jessie-startup-conf/#i-2>

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
> VNCしか使わないから、ま、いっか。  

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
sudo smbpasswd -a <ユーザ名>
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

# マウスフォーカスの変更

ウィンドウをクリックしないとフォーカスが移動しないのはイライラするので x-mouse相当の設定をする。  
``/etc/xdg/openbox/lxde-pi-rc.xml``の以下の部分をnoからyesに変更。  
```
<followMouse>yes</followMouse>
```

# ま、こんな感じかな。

