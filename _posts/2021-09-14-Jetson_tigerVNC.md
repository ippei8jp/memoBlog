---
title: Jetson nano にtigerVNCをインストールする(Jetpack4.6)
date: 2021-09-14
tags: ["DeepLearning", "Jetson nano"]
excerpt: Jetson nano にtigerVNCをインストールする(Jetpack4.6)
---

# 概要
[Jetson nano をセットアップする(Jetpack4.6)]({{ site.baseurl }}/2021/09/13/Jetson_nano_install.html){:target="_blank"}
ではVNCにvinoをインストールしましたが、vinoはキー入力/画面描画のレスポンスがかなり遅く、
結構なストレスになります。  
そこで、代わりに[tigerVNC](https://tigervnc.org/)をインストールしてみます。

最初に結論を書いておきますが、レスポンスはvinoより良くなるのですが、クリップボードの共有
(ホスト/ターゲット間でのコピペ)ができないので、普段使いにはあまり使い勝手が良くありません。  
githubのリポジトリもずいぶん前から更新されていないみたいなので、今後改善される可能性も低そうです。  
なので、私は使っていません(^^ゞ  

# 前準備
vinoをセットアップしてある場合は停止しておいてください。  
``~/.config/autostart/vino-server.desktop`` を削除しておけば大丈夫でしょう。  
以下、vinoのセットアップは行っていないものとして記載します。  

# tigerVNCの設定

## tiger VNC のインストール
必要なプログラムをインストールします  

```bash
sudo apt install tigervnc-standalone-server tigervnc-scraping-server
```

## VNCのパスワードの設定
接続パスワードを設定します  
```bash
vncpasswd
```

``Password:``と``Verify:``で設定するパスワードを入力  
``Would you like to enter a view-only password (y/n)?``には ``n``を入力  
VNCクライアントから接続する際にこのパスワードを入力します  

## 自動loginの設定
VNCはログインしてないと接続できないので、自動ログインを設定します  

``/etc/gdm3/custom.conf`` を以下のように変更  
- ``AutomaticLoginEnable`` の行を有効化
- ``AutomaticLogin `` の行を有効化して ``user1`` をloginするユーザ名に変更  

##  解像度の設定
``/etc/X11/xorg.conf`` に以下を追加   
``Virtual 1920 1080``の部分は使用する解像度に合わせて変更  

```
Section "Screen"
   Identifier    "Default Screen"
   Monitor       "Configured Monitor"
   Device        "Tegra0"
   SubSection "Display"
       Depth    24
       Virtual 1920 1080 # Modify the resolution by editing these values
   EndSubSection
EndSection
```
## ここで一旦リブートする
リブートしないと下の単体テストで「displayがopenできない」とエラーになる模様。  

## 手動で動かしてみる(画面のミラーリング)

動作確認として、サーバを手動で起動してみます。  
```bash
x0vncserver -display :0 -passwordfile ~/.vnc/passwd
```

サーバが起動したら、PCからVNCクライアントでJetson nano のポート5900(VNCのデフォルトポートなので省略可)に接続します。  

正常に設定できていればVNCクライアントにデスクトップが表示されます。  

## 自動起動の設定 
逐一``x0vncserver``を起動するのは面倒なので、自動で起動するように設定しておきます。  

参考： <https://qiita.com/iwatake2222/items/a3bd8d0527dec431ef0f>

``/etc/systemd/system/x0vncserver.service`` を以下の内容で作成します。  
ただし、``XXXXXXXX``の部分は 自分のユーザ名に置き換えてください。  
```
[Unit]
Description=Remote desktop service (VNC)
After=syslog.target
After=network.target remote-fs.target nss-lookup.target
After=x11-common.service 

[Service]
Type=forking
User=XXXXXXXX
Group=XXXXXXXX
WorkingDirectory=/home/XXXXXXXX
ExecStart=/bin/sh -c 'sleep 10 && /usr/bin/x0vncserver -display :0  -rfbport 5900 -passwordfile /home/XXXXXXXX/.vnc/passwd &'

[Install]
WantedBy=multi-user.target
```


## サービスの起動と確認
```bash
sudo systemctl start x0vncserver
sudo systemctl status x0vncserver
```

以下のように出力されることを確認します  

```
● x0vncserver.service - Remote desktop service (VNC)
   Loaded: loaded (/etc/systemd/system/x0vncserver.service; enabled; vendor pres
   Active: active (running) since Fri 2021-09-03 11:08:07 JST; 8s ago
  Process: 14646 ExecStart=/bin/sh -c sleep 10 && /usr/bin/x0vncserver -display ・・・・
 Main PID: 14659 (sh)
    Tasks: 2 (limit: 4172)
   CGroup: /system.slice/x0vncserver.service
           ├─14659 /bin/sh -c sleep 10 && /usr/bin/x0vncserver -display :0  ・・・・
           └─14666 sleep 10

 9月 03 11:08:07 jetson systemd[1]: Starting Remote desktop service (VNC)...
 9月 03 11:08:07 jetson systemd[1]: Started Remote desktop service (VNC).
```

## サービスの有効化
起動時に自動実行されるように、サービスの有効化を行います。  

```bash
sudo systemctl enable x0vncserver
```

## リブート

再起動後、PCからVNCクライアントでJetson nano のポート5900(VNCのデフォルトポートなので省略可)に接続します。  

正常に起動できていればVNCクライアントにデスクトップが表示されます。  


#  別のやり方(参考)
ディスプレイとは別のデスクトップを表示する場合は以下の手順で。  
ここではwindow managerにlxdeを使用していますので、モニタ表示とは異なる見た目になりますし、
ウィンドウマネージャの設定も同じではありません。  

参考：<https://forums.developer.nvidia.com/t/how-to-setup-tigervnc-on-jetson-nano/174244>

一回試しただけ(ちゃんとメモってなかった)なので、抜けとかあるかも。  

## Tiger VNC のインストール
必要なプログラムをインストールします  

```bash
sudo apt install tigervnc-standalone-server
```

## VNCのパスワードの設定
接続パスワードを設定します  

```bash
vncpasswd
```

``Password:``と``Verify:``で設定するパスワードを入力  
``Would you like to enter a view-only password (y/n)?``には ``n``を入力  
VNCクライアントから接続する際にこのパスワードを入力します  

## 自動loginの設定
VNCはログインしてないと接続できないので、自動ログインを設定します  

``/etc/gdm3/custom.conf`` を以下のように変更  
- ``AutomaticLoginEnable`` の行を有効化
- ``AutomaticLogin `` の行を有効化して ``user1`` をloginするユーザ名に変更  

##  解像度の設定
``/etc/X11/xorg.conf`` に以下を追加   
``Virtual 1920 1080``の部分は使用する解像度に合わせて変更  

```
Section "Screen"
   Identifier    "Default Screen"
   Monitor       "Configured Monitor"
   Device        "Tegra0"
   SubSection "Display"
       Depth    24
       Virtual 1920 1080 # Modify the resolution by editing these values
   EndSubSection
EndSection
```

## ~/.vnc/xstartup の作成
``~/.vnc/xstartup`` を以下の内容で作成します  
XXXXXXXX は 自分のユーザ名に置き換えてください  

```bash
!/bin/sh
export XDG_RUNTIME_DIR=/run/user/1000
export XKL_XMODMAP_DISABLE=1
unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS
xrdb /home/XXXXXXXX/.Xresources
xsetroot -solid grey
gnome-session &
startlxde &
```

実行属性を付けます  

```bash
chmod 755 ~/.vnc/xstartup
```

## .Xresources ファイルの作成
.Xresources ファイルを作成します  
```bash
touch ~/.Xresources
```

## VNCの自動起動の設定
``/etc/systemd/system/vncserver@.service``を以下の内容で作成します  
XXXXXXXX は 自分のユーザ名に置き換えてください  

```
[Unit]
Description=Start TigerVNC Server at startup
After=syslog.target network.target

[Service]
Type=forking
User=XXXXXXXX
Group=XXXXXXXX
WorkingDirectory=/home/XXXXXXXX
PIDFile=/home/XXXXXXXX/.vnc/%H:%i.pid
ExecStartPre=-/usr/bin/vncserver -kill :%i > /dev/null 2>&1
ExecStart=/usr/bin/vncserver :%i -depth 24 -geometry 1920x1080 -nolisten tcp

ExecStop=/usr/bin/vncserver -kill :%i

[Install]
WantedBy=multi-user.target
```


## リモートからのアクセス許可
``/etc/vnc.conf`` に以下を追記してリモートアクセスを許可します  
```
$localhost = “no”;
```

## systemctl enable の代わりにシンボリックリンクの作成
参照元がこうなってたので。  
``sudo systemctl enable vncserver@``でも良い気がするけど。ここのファイル名でポート番号決めてる？    

```bash
cd /etc/systemd/system/multi-user.target.wants/
sudo ln -s /etc/systemd/system/vncserver@.service vncserver@1.service
```

## リブートする
再起動後、PCからVNCクライアントでJetson nano のポート5901に接続します。  
(VNCクライアントの接続先に``«JetsonのIPアドレス»:5901`` を指定します)  

