---
title:  UbuntuをNative環境にインストールする(20.04)
date: 2021-07-15
tags: ["Ubuntu","setup"]
excerpt: Ubunt(20.04)をNative環境にインストールしたときのメモ
layout: default
---


# インストール
最初の起動まではこちらに詳しく書かれています。  
[Ubuntu 20.04 LTS インストール方法（外付けドライブ用)](https://qiita.com/koba-jon/items/019a3b4eac4f60ca89c9){:target="_blank"}  

> [!WARNING]
> EFIシステムパーティションを作成するのを忘れがち。  
> 外付けだと作成忘れると内蔵HDDのEFIシステムパーティションに追記されちゃうので注意。  

> [!WARNING]
> ユーザ名に英数字以外を含むとChrome remote desktop の インストール&設定でエラーになることがあるので、  
> 英数字以外を含まないユーザ名を設定することをおススメします。  

# その後の設定手順

## 最新版にアップデート

お約束。  
```bash
sudo apt update
sudo apt upgrade
```

## IPアドレス確認したいとき
SSHのクライアントからの接続先が分からないと困るので、
IPアドレスを確認するためにnet-toolsをインストールして
ifconfigで確認。   

```bash
sudo apt install net-tools
ifconfig
```

## sshのインストール
WindowsPCにあるデータをubuntuPCにキーボードで打ち込むのは効率が悪いので、最も簡単なsshでリモートログインできるようにしてみる。  

以下のコマンドでsshサーバをインストールし、サーバを開始する。  
```bash
sudo apt install ssh
systemctl start sshd
```

クライアントからTeraTermなどでsshで対象マシンのポート22に接続する  


## インストール中にロックされるとうざいので、先に設定しておく  
```bash
# ブランクスクリーン しない
gsettings set org.gnome.desktop.session idle-delay 0
# 自動画面ロック OFF
gsettings set org.gnome.desktop.screensaver lock-enabled false
```

GUIで設定する場合は以下の手順で。  
> [!TIP]
> ==== 画面ロックの抑制 ==============================================  
> システムの設定を起動し、左側でプライバシー ＞ 画面ロック を選択  
> 右側で画面ロックをクリックし、自動画面ロックをoffにする  

> [!TIP]
> ==== スクリーンセーバ(ブランクスクリーン)の抑制=====================  
> システムの設定を起動し、左側で電源を選択  
> 右側でブランクスクリーンのドロップダウンリストで「しない」を選択  

## gccとかmakeとかをインストールする

とりあえず入れとこう  

```bash
sudo apt install build-essential
```

## 色々使うのでインストール

なにかと使うのでインストール  

```bash
sudo apt install dconf-editor
sudo apt install gnome-tweak-tool
```

## 使わないのでアンインストール

最小インストールすれば良いという説もあるが...  

### ツール類
```bash
sudo apt remove thunderbird libreoffice-* simple-scan gnome-todo remmina cheese rhythmbox

# 個別に実行する場合はこちらでどうぞ。
sudo apt remove thunderbird
sudo apt remove libreoffice-*
sudo apt remove simple-scan
sudo apt remove gnome-todo
sudo apt remove remmina
sudo apt remove cheese
sudo apt remove rhythmbox
```

### ゲーム類
```bash
sudo apt remove aisleriot gnome-mahjongg gnome-mines gnome-sudoku

# 個別に実行する場合はこちらでどうぞ。
sudo apt remove aisleriot
sudo apt remove gnome-mahjongg
sudo apt remove gnome-mines
sudo apt remove gnome-sudoku
```

### 要らなくなったパッケージのお掃除
```bash
sudo apt autoremove
```

## 作業用ディレクトリの作成
```bash
sudo mkdir /proj /work /work1 /work2 /NFSROOT
sudo chown `whoami`:`whoami`  /proj /work* /NFSROOT
```

## sambaのインストール
```bash
sudo apt install samba
```

/etc/samba/smb.conf に以下を追加
```
[proj]
path = /proj
guest ok = no
writable = yes
map archive = no
share modes = yes
dos filetimes = yes
force group = yas-i
force create mode = 0664
force directory mode = 0665

[work1]
path = /work1
guest ok = no
writable = yes
map archive = no
share modes = yes
dos filetimes = yes
force group = yas-i
force create mode = 0664
force directory mode = 0665

[work2]
path = /work2
guest ok = no
writable = yes
map archive = no
share modes = yes
dos filetimes = yes
force group = yas-i
force create mode = 0664
force directory mode = 0665

[work]
path = /work
guest ok = no
writable = yes
map archive = no
share modes = yes
dos filetimes = yes
force group = yas-i
force create mode = 0664
force directory mode = 0665

[NFSROOT]
path = /NFSROOT
guest ok = no
writable = yes
map archive = no
share modes = yes
dos filetimes = yes
force group = yas-i
force create mode = 0664
force directory mode = 0665

[opt]
path = /opt
guest ok = no
writable = yes
map archive = no
share modes = yes
dos filetimes = yes
force group = yas-i
force create mode = 0664
force directory mode = 0665

[homes]
   comment = Home Directories
   browseable = no

# By default, the home directories are exported read-only. Change the
# next parameter to 'no' if you want to be able to write to them.
;   read only = yes
    read only = no

# File creation mask is set to 0700 for security reasons. If you want to
# create files with group=rw permissions, set next parameter to 0775.
;   create mask = 0700
    create mask = 0665

# Directory creation mask is set to 0700 for security reasons. If you want to
# create dirs. with group=rw permissions, set next parameter to 0775.
;   directory mask = 0700
    directory mask = 0775

# By default, \\server\username shares can be connected to by anyone
# with access to the samba server.
# Un-comment the following parameter to make sure that only "username"
# can connect to \\server\username
# This might need tweaking when using external authentication schemes
   valid users = %S
```

ユーザの追加と再起動
```bash
sudo smbpasswd -a `whoami`
sudo service smbd reload
sudo service smbd restart
```

## NFSのインストール

インストール
```bash
sudo apt install nfs-kernel-server
```

/etc/exportsに以下を追加
```
/NFSROOT 192.168.0.0/255.255.0.0(rw,sync,no_root_squash)
```

NFSサーバの再起動
```bash
sudo /etc/init.d/nfs-kernel-server restart
```

exportできているか確認  
```bash
sudo exportfs 
```

別のマシンからマウントできるか確認
```bash
sudo mount 192.168.XX.XX:/NFSROOT abc/
abcの下にリモートのファイルが見えたらOK
```

## デフォルトshellをbashに変更
```bash
cd /bin
sudo ln -sf bash sh
```
## bashの設定変更

~/.bashrcに以下を追記

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

# for pyenv
export PYENV_ROOT=/proj/.pyenv    #環境に合わせて修正してね
if [ -e $PYENV_ROOT ]; then
    export PATH=$PYENV_ROOT/bin:$PATH
    # 仮想環境名をプロンプトに表示しない場合は以下を有効化
    # export VIRTUAL_ENV_DISABLE_PROMPT=1
    eval "$(pyenv init --path)"          # pyenv 2.0以降で必要
    eval "$(pyenv init -)"
    eval "$(pyenv virtualenv-init -)"
    export PYTHON_CONFIGURE_OPTS="\
     --enable-shared\
    "
fi

# for nodenv
export NODENV_ROOT=/proj/.nodenv    # 環境に合わせて修正してね
if [ -e $NODENV_ROOT ]; then
    export PATH=$NODENV_ROOT/bin:$PATH
    eval "$(nodenv init -)"
fi

# x11からのログイン以外ならDISPLAYを設定する
if [ "$XDG_SESSION_TYPE" != "x11" ]; then
    export DISPLAY=192.168.78.200:0.0
fi
echo DISPLAY="$DISPLAY"
```

## GUIの動作の設定変更をお好みで
### ウィンドウが勝手に最大化するのをやめる
dconf-editorでも良いけど、以下のコマンドで無効化できる
```bash
# 現在値確認
gsettings get org.gnome.mutter auto-maximize
gsettings get org.gnome.mutter edge-tiling

# 設定
gsettings set org.gnome.mutter auto-maximize false
gsettings set org.gnome.mutter edge-tiling false
```

### ウィンドウにマウスを乗せるとフォーカスされるようにする
dconf-editorでも良いけど、以下のコマンドで設定できる
```bash
# 現在値確認
gsettings get org.gnome.desktop.wm.preferences auto-raise 
gsettings get org.gnome.desktop.wm.preferences focus-mode 
gsettings get org.gnome.desktop.wm.preferences raise-on-click

# 設定
gsettings set org.gnome.desktop.wm.preferences auto-raise false
gsettings set org.gnome.desktop.wm.preferences focus-mode mouse
gsettings set org.gnome.desktop.wm.preferences raise-on-click true
```

### デスクトップからゴミ箱とホームを消す
dconf-editorでも良いけど、以下のコマンドで設定できる
```bash
# 現在値確認
gsettings get org.gnome.shell.extensions.desktop-icons show-home
gsettings get org.gnome.shell.extensions.desktop-icons show-trash

# 設定
gsettings set org.gnome.shell.extensions.desktop-icons show-home false
gsettings set org.gnome.shell.extensions.desktop-icons show-trash false
```

### Dockのカスタマイズ
なんとなく使いにくいので好みのデザインに変更。  
dconf-editorでも良いよ(しつこい...)  

```bash
# 現在値確認 ==================================
# Dockバー上のゴミ箱表示有無
gsettings get org.gnome.shell.extensions.dash-to-dock show-trash

# アプリケーションのDockバー上の表示位置
gsettings get org.gnome.shell.extensions.dash-to-dock show-apps-at-top

# Dockバー表示位置
gsettings get org.gnome.shell.extensions.dash-to-dock dock-position

# Dockバー上のアイコンサイズ
gsettings get org.gnome.shell.extensions.dash-to-dock dash-max-icon-size

# 設定 ==================================
# Dockバー上のゴミ箱削除
gsettings set org.gnome.shell.extensions.dash-to-dock show-trash false

# アプリケーションをDockバーの上(または左)に表示
gsettings set org.gnome.shell.extensions.dash-to-dock show-apps-at-top true

# Dockバーを画面下に表示
gsettings set org.gnome.shell.extensions.dash-to-dock dock-position BOTTOM

# Dockバー上のアイコンサイズの変更
gsettings set org.gnome.shell.extensions.dash-to-dock dash-max-icon-size 16
```

### マウスカーソルを大きくする

マウスカーソル小さくて見失う人は大きくしましょう。  
最後の数字がカーソルの大きさなので、お好みのサイズで。  

```bash
# 現在値確認 
gsettings get org.gnome.desktop.interface cursor-size

# 設定
gsettings set org.gnome.desktop.interface cursor-size 48
```
または「設定」→「ユニバーサルアクセス」→「カーソルの大きさ」で選択  

### CAPSキーをCtrlキーに変更
```bash
# 現在値確認 
gsettings get org.gnome.desktop.input-sources xkb-options

# 設定
gsettings set org.gnome.desktop.input-sources xkb-options \[\'ctrl:nocaps\'\]

# 設定を有効にするにはGUIでのlogout&再loginが必要

```

## 日本語入力
前は設定必要だったけど、なんか大丈夫になったみたい
> [!NOTE]
> 以前の設定手順  
> 右上の「A」または「あ」と書かれたアイコンをクリック→「テキスト入力設定」を選択
> 一番下の「インストールされている言語の管理」をクリック
> 「言語サポートが完全にはインストールされていません」と出るので「インストール」をクリック
> 一旦log offして再log in
> 右上のJaまたはMoと書かれたアイコンをクリック
>     Mo(Mozc-jp) を選択(既にMoになってたら一度Jaを選んでからMoに戻す)
> キーボードの全角/半角キーで切り替えられるようになる


## gnome-terminalのフォントの変更
端末を起動し、右上の「≡」→「設定」を選択
使用中のプロファイル(最初のは「名前なし」)を選択し、  
「フォントを指定」にチェックを入れ、その右側でフォントを選ぶ  
Ubuntu Mono Regular あたりがおススメ  
ついでに起動時の端末サイズも修正しておくとよい  

## IPv6を無効化する
IPv6が動いてるとうまく行かない環境のときは無効化しておく。  
参考：[UbuntuでIPv6を無効化する方法](https://www.server-memo.net/ubuntu/ubuntu_disable_ipv6.html#IPv6-4){:target="_blank"}

sysctlで設定するのがお手軽かな？

## システムバックアップ
Nativeならバックアップしといた方がいいかな。  
参考：[第588回　TimeShiftでUbuntuをホットバックアップする 2019年版](https://gihyo.jp/admin/serial/01/ubuntu-recipe/0588)   
`` add-apt-repository`` でリポジトリを追加しなくても大丈夫。標準リポジトリにも入ってるから。  

## chrome remote desktopインストール

remote desktop使いたいので、インストールする。  

### chromeのインストール
[Google Chrome - Google の高速で安全なブラウザをダウンロード](https://www.google.com/chrome/)からダウンロードしてインストール。  

### おまじない
remote desktopのインストール時にエラーが発生するので、以下のディレクトリを作成しておく。  
(インストーラのバグらしい)  
```bash
mkdir ~/.config/chrome-remote-desktop
```

### remote desktopのインストール
以下参考ページ  
- [Chrome リモート デスクトップを使って他のパソコンにアクセスする](https://support.google.com/chrome/answer/1649523?co=GENIE.Platform%3DDesktop&hl=ja)  
  - パソコンでリモート アクセスを設定する
  - パソコンにリモート アクセスする

接続すると、開始するセッションの選択画面になるので、「Ubuntu」を選択。  

接続すると、「カラーマネジメントされたデバイスを作成するには認証が必要です」ダイアログが出る場合がある。  
このダイアログはパスワード入れてもキャンセルしても結果は同じで問題なく操作できるが、逐一やるのはめんどっちいので出なくする。  
参考：  
- [Ubuntu 18.04LTS上のXRDP](https://qastack.jp/ubuntu/1031519/xrdp-on-ubuntu-18-04lts)  

要約すると
```/etc/polkit-1/localauthority/50-local.d/45-allow.colord.pkla``` で以下の内容で作成
```
[Allow Colord all Users]
Identity=unix-user:*
Action=org.freedesktop.color-manager.create-device;org.freedesktop.color-manager.create-profile;org.freedesktop.color-manager.delete-device;org.freedesktop.color-manager.delete-profile;org.freedesktop.color-manager.modify-device;org.freedesktop.color-manager.modify-profile
ResultAny=no
ResultInactive=no
ResultActive=yes
```

設定を有効にするのは再起動必要。  

