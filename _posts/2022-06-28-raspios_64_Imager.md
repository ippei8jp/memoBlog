---
title: Raspberry Pi OS(64bit)のインストール(Raspberry Pi Imager)
date: 2022-06-28
tags: ["RaspberryPi","setup"]
excerpt: Raspberry Pi OS(64bit)のRaspberry Pi Imagerを使用したインストールと初期設定。
layout: default
---

また手順が変わったみたいなので、メモも更新。  

# SDカードへの書き込み

Raspberry Pi Imager なるツールを使うようになったらしい。  
使い方はあちこちに書いてあるけど、例えばこちら。  
- [Raspberry Pi Imagerの使い方 ― v1.7.2以降 対応版](https://ascii.jp/elem/000/004/094/4094421/){:target="_blank"}  
- [Raspberry Pi Imagerが新しくなった！Lite版もらくらくHeadless Setup](https://www.mikan-tech.net/entry/raspi-imager-headless-setup){:target="_blank"}  

これを使うと、最初のユーザを自由に設定できるので、これまでのpiユーザを変更するなんてことはやらなくて済む。  
Wi-Fiの設定やSSHの設定も(なんかWindowsが適切に設定されてれば公開鍵が自動で設定されるみたい)ここでできる。  

パスワードが設定ファイルに書き出されるので(さすがに平文ではない、最初の起動が終わったら削除される)、  
セキュリティ上気になる場合は仮パスワードを設定しておいて  
最初にログインしたときに変更する、なんてことをやった方が良いと言ってる解説ページもあった。  

>[!WARNING]
> なぜかSSHの認証方法が毎回「パスワード認証を使う」になってしまうので、公開鍵を使うときは再度設定が必要。  
> 


# ブート前の設定

ブートの前にSDカードのFATパーティションのファイルをいじっておく。

## UARTコンソールの有効化

UARTをコンソールとして使用するために``config.txt`` の 最後の ``[all]`` の行の下に以下を追加

```
# enable uart
enable_uart=1
```
## IPv6の無効化
IPv6を無効化しておきたいときは、
``cmdline.txt`` に ``ipv6.disable=1``を追加する。  
このファイルは1行で書かないといけないので、改行してはいけない。  

## ブートログの表示

ブートログが見えないと不安な人は、  
``cmdline.txt`` から ``quiet`` ``splash`` ``plymouth.ignore-serial-consoles``
を削除しておくとよい。  


# 最初の起動
書き込んだSDカードをRaspberry Piに挿入して電源ON。  
ごちょごちょと設定したあと、起動する(途中2回ほどrebootしてるらしい)  

あとは起動後の設定。  

# 何はともあれ、最新版へ

```
# アップデート実行
sudo apt update
sudo apt upgrade
# リブート
sudo reboot
```

>[!NOTE]
> 以降の処理をスクリプトにまとめました。  
> [Raspberry Pi セットアップスクリプト ](https://gist.github.com/ippei8jp/8053f0804a694c34cb18cd4035e0993c){:target="_blank"}  
> 以下の手順で実行できます。  
> ```bash
> wget https://gist.githubusercontent.com/ippei8jp/8053f0804a694c34cb18cd4035e0993c/raw/78961e0f867cc1a6e7f15344fd2db2c87471f357/pi_setup1.sh
> bash pi_setup1.sh
> ```
> 途中でパスワード入力しないといけないので、完全自動じゃないけど、かなり手間は省けるはず。  
> 実行後、``pi_setup1.sh``は不要なので削除して可。  
> 実行が終わったらリブートすること。  
> 


# ~/.bashrcの設定など

シリアルコンソールを使用する場合、コンソールサイズがあってなくてイライラするので、シリアルコンソールの設定用スクリプトを以下の手順で取得。  

```bash
cd ~
wget https://gist.githubusercontent.com/ippei8jp/8053f0804a694c34cb18cd4035e0993c/raw/291b9eae7dc67ecc3d25a642b3b96be1c4a14a43/pi_setup1.sh

chmod +x resize.py
```

``~/.bashrc``を必要に応じて修正。
例えば、以下を追記。

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

# lessのオプション
export LESS="-iMR"

# reset console size
case "$TERM" in
    vt220) ~/resize.py ;;
esac

# pyenv 設定
export PYENV_ROOT=/proj/.pyenv
if [ -e $PYENV_ROOT ]; then
    export PATH=$PYENV_ROOT/bin:$PATH
    # Raspbian向け対策(numpyでundefined symbol: PyFPE_jbuf)
    export PYTHON_CONFIGURE_OPTS="\
     --enable-ipv6\
     --enable-unicode=ucs4\
     --enable-shared\
     --with-dbmliborder=bdb:gdbm\
     --with-system-expat\
     --with-system-ffi\
     --with-fpectl"

    eval "$(pyenv init --path)"          # pyenv 2.0以降で必要
    eval "$(pyenv init -)"
    eval "$(pyenv virtualenv-init -)"
fi

# nodenv 設定
export NODENV_ROOT=/proj/.nodenv
if [ -e $NODENV_ROOT ]; then
    export PATH=$NODENV_ROOT/bin:$PATH
    eval "$(nodenv init -)"
fi
```

# キーボードのCAPS - CTRLの入れ替え

物理キーボード接続で使わないなら設定不要  

参考：  [https://qiita.com/Pseudonym/items/12e447557a5234bb265b](https://qiita.com/Pseudonym/items/12e447557a5234bb265b)  

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
> 

# bashのクリップボードの挙動が以前と異なるようになったので対策

bashでクリップボードからペーストするとペーストした文字が選択状態になったり、改行がその場で入力されなかったりするようになった。  
こればbash 5.1からブラケットペーストモード というのがデフォルトで有効になったためらしい。  
(余計なことをしてくれる...😩💨)  
これを回避するには``/etc/inputrc``の最後に以下を追記する。  
```
# disable bracked-paste mode
set enable-bracketed-paste off
```
起動済みのbashには効かないが、設定以降に起動したbashでは有効になる(システムの再起動は不要)。  


参考： [シェル - bash - ブラケットペーストモード（Bracketed Paste Mode）](https://freebsd.sing.ne.jp/shell/03/04.html){:target="_blank"}  


# ワークディレクトリの作成とsambaの設定

まずはワークディレクトリの作成  

```
sudo mkdir /work
sudo mkdir /proj
sudo chown $USER:$USER /work /proj
```

sambaのインストールと設定  

```
sudo apt install samba
sudo smbpasswd -a $USER
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

```
sudo service smbd reload
sudo service smbd restart
```

# VNCサーバの有効化

リモートデスクトップを使うために、VNCサーバの有効化を行う。  

```
sudo raspi-config
    # VNCサーバの有効化
    3 Interfacing Options
        I3 VNC
            Would you like the VNC Server to be enabled?
            と聞かれるので <Yes>
            The VNC Server is enabled
            と表示されるので <Ok>

    # VNC解像度の設定
    2 Display Options
        D5 VNC Resolution
        
            解像度が色々表示されるので、
            使いたい解像度を選択(例えば 1920x1080 )して<Select>
            The resolution is set to «選択した解像度»
            と表示されるので <Ok>
    # 設定終了
    <Finish>
```




# Splash screenの無効化とブートログの表示

セットアップ時にブートログが表示されるようにしてなかったけど、  
やっぱり表示したくなった、てなときは以下で。  
```
sudo raspi-config
    1 System Options
        S7 Splash Screen
            Would you like to show the splash screen at boot?
            と聞かれるので無効化するときは <No> を選択
            Splash screen at boot is disabled)
            と表示されるので <Ok>

    Would you like to reboot now?
    と聞かれるので、その場でリブートしてよければ<Yes>
```
>[!NOTE]
> 直接``/boot/cmdline.txt`` から ``quiet`` ``splash`` ``plymouth.ignore-serial-consoles`` を削除しても良い

