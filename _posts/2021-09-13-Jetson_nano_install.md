---
title: Jetson nano をセットアップする(Jetpack4.6)
date: 2021-09-13
tags: ["DeepLearning", "Jetson nano"]
excerpt: Jetson nano をセットアップする(Jetpack4.6)
---

Nvidiaの[Jetson nano](https://www.nvidia.com/ja-jp/autonomous-machines/embedded-systems/jetson-nano/)をセットアップしたときのメモ  
Jetpack4.4のときのメモは[Jetson nano をセットアップする]({{ site.baseurl }}/2020/10/23/Jetson_nano_install.html){:target="_blank"} にあります。  

# 参照先
- [「Jetson Nano」の電源を入れて立ち上げる](https://monoist.atmarkit.co.jp/mn/articles/1905/30/news029.html)
  - わりと詳しく書いてある
- [Getting Started With Jetson Nano Developer Kit ](https://developer.nvidia.com/embedded/learn/get-started-jetson-nano-devkit)
  - 本家

# シリアルコンソールの使用
シリアルコンソールが必要なら接続できる。  
特に設定等は必要ない。    
接続端子は以下を参照  
- [Jetson Nano – Serial Console](https://www.jetsonhacks.com/2019/04/19/jetson-nano-serial-console/)
  の 「Wiring」の下の「Jetson Nano B01」を参照。  

シリアルポートの設定は115200bps/8bit/none/1bit/none  

その他、コネクタ類の配置が分かりにくい場合は、
[JETSON NANO DEVELOPER KIT](https://developer.download.nvidia.com/assets/embedded/secure/jetson/Nano/docs/NV_Jetson_Nano_Developer_Kit_User_Guide.pdf?yIbsUqvBKxI1G6r3WW7cOdheZGv2-eSfaFW_kMt3dSgi0NJ7h77OwFHr5b-rquc3IX7Tyrt8FV6IKD4DHqvP4_LzhWt55tb071gqXlNGwBPYCOC5pnEKAla8D-B82bPjhQMykANFyn-EhxZRHC8AIBYWuVwwwXVPWtCOjs34Tg50oBdN0vBNoyUlZMRFXLNJ2to)
のP22 に**Developer kit module and carrier board: rev B01 top view**として配置図が掲載されているので参照のこと。  


# SDカードの作成～FirstBoot
基本的に参照先の通り。  
<https://developer.nvidia.com/embedded/downloads>
から「Jetson Nano Developer Kit SD Card Image」  の Version 「4.6」 をダウンロード  
(他のバージョンが必要ならそのバージョンで)  

ファーストブートで設定が終わったら、何はともあれ最新版にアップデート。  

```bash
sudo apt update
sudo apt upgrade
```

ここで一旦リブートしておく。

# SSHでの接続
特に設定などは必要ない。  
TeraTermなどで接続すれば良い。
UbuntuではmDNSが動いているので、«マシン名».localでアクセスできる。  

TeraTerm使用時のコマンドは以下の通り。  
```
"C:\Program Files (x86)\teraterm\ttermpro.exe" /auth=password /user=«ユーザ名» /passwd=«パスワード» «JetsonのIPアドレス or マシン名.local»
```

> [!NOTE]
> SSHやmDNSは立ち上がるまで少し時間がかかるみたいなので、  
> 起動後数十秒程度待ってから接続した方が良い。  


## SSH接続がタイムアウトする対策
SSH接続したターミナルを触らずにしばらく置いておくと、タイムアウトしてクローズされてしまう。
これを防ぐにはクライアント側からkeep-aliveパケットを定期的に送信してやれば良いらしい。

Teratermの場合、「設定」→「SSH」→「ハートビート(keep-alive)」を「8」とかに設定し、保存。
次回接続時はこの保存した設定ファイルを読み込む


# 初期設定
## .bashrcの修正
.bashrcの修正をお好みで。  
以下は設定例  

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
    vt220) resize ;;
esac

# numpy 1.19.5 のimportでcore dumpする対策
export OPENBLAS_CORETYPE=ARMV8

# pyenv 設定
export PYENV_ROOT=/proj/.pyenv
if [ -e $PYENV_ROOT ]; then
    export PATH=$PYENV_ROOT/bin:$PATH
    # Raspbian向け対策(numpyでundefined symbol: PyFPE_jbuf)
    # export PYTHON_CONFIGURE_OPTS="--enable-ipv6\
    #     --enable-unicode=ucs4\
    #     --enable-shared\
    #     --with-dbmliborder=bdb:gdbm\
    #     --with-system-expat\
    #     --with-system-ffi\
    #     --with-fpectl"
    # Ubuntu向け対策
    export PYTHON_CONFIGURE_OPTS="\
     --enable-shared\
    "

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

# direnv 設定
if type direnv > /dev/null 2>&1; then
    export EDITOR=vim
    eval "$(direnv hook bash)"
    
    # venvの仮想環境名を表示するための設定
    show_virtual_env() {
      if [ -n "$VIRTUAL_ENV" ]; then
        echo "($(basename $VIRTUAL_ENV))"
      fi
    }
    PS1='$(show_virtual_env)'$PS1
fi

# x11からのログイン以外ならDISPLAYを設定する
if [ "$XDG_SESSION_TYPE" != "x11" ]; then
    # DISPLAYが未定義なら設定する
    if [ -z ${DISPLAY} ]; then
        export DISPLAY=192.168.78.200:0.0
    fi
fi
```

## 不要なソフトのアンインストール
使わないのでアンインストールしておく  

```bash
sudo apt remove libreoffice-*
sudo apt remove thunderbird
```

## 色々使うのでインストール
なにかと使うのでインストール  

```bash
sudo apt install dconf-editor
sudo apt install gnome-tweak-tool
```

## GUIの動作の設定変更をお好みで
<!--
「ウィンドウが勝手に最大化するのをやめる」はOK
「ウィンドウにマウスを乗せるとフォーカスされるようにする」で "focus-mode" は 'mouse' ではなく 'sloppy'
「デスクトップからゴミ箱とホームを消す」は項目としてないらしい
「Dockのカスタマイズ」は設定できるけど有効でない？
「マウスカーソルを大きくする」は設定できるけど有効でない？リブートすると元に戻る？
windowの閉じるボタンなどを右に移動するにはgnome-tweaskでWindowsのTitlebar Buttons を設定する → 反映されず
「CAPSキーをCtrlキーに変更」はOK
-->
### ウィンドウが勝手に最大化するのをやめる
```bash
# 現在値確認
gsettings get org.gnome.mutter auto-maximize
gsettings get org.gnome.mutter edge-tiling

# 設定
gsettings set org.gnome.mutter auto-maximize false
gsettings set org.gnome.mutter edge-tiling false
```

### ウィンドウにマウスを乗せるとフォーカスされるようにする
```bash
# 現在値確認
gsettings get org.gnome.desktop.wm.preferences auto-raise 
gsettings get org.gnome.desktop.wm.preferences focus-mode 
gsettings get org.gnome.desktop.wm.preferences raise-on-click

# 設定
gsettings set org.gnome.desktop.wm.preferences auto-raise false
gsettings set org.gnome.desktop.wm.preferences focus-mode sloppy
gsettings set org.gnome.desktop.wm.preferences raise-on-click true
```

### CAPSキーをCtrlキーに変更
```bash
# 現在値確認 
gsettings get org.gnome.desktop.input-sources xkb-options

# 設定
gsettings set org.gnome.desktop.input-sources xkb-options \[\'ctrl:nocaps\'\]

# 設定を有効にするにはGUIでのlogout&再loginが必要

```

 
## IPv6を無効化する
IPv6を無効化したい場合は、
/``boot/extlinux/extlinux.conf``の``APPEND``の行の最後に``ipv6.disable=1``を追加してリブートする  
参考： [Ubuntu 18.04 で ipv6 を無効にする](https://www.rough-and-cheap.jp/ubuntu/ubuntu18_04_howto_diseable_ipv6/){:target="_blank"}  
> [!NOTE]
> grubではなく、U-Bootなので設定するところが違う

> [!NOTE]
> Sysctl の設定ではうまくいかなかった。

## デフォルトshellをbashに変更
```bash
cd /bin
sudo ln -sf bash sh
```

## 作業用ディレクトリの作成
```bash
sudo mkdir /proj /work
sudo chown `whoami`:`whoami`  /proj /work
```

## sambaのインストール
### インストール  
```bash
sudo apt install samba
```

### 設定ファイル
``/etc/samba/smb.conf`` に以下を追加
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

### ユーザの追加と再起動
```bash
sudo smbpasswd -a `whoami`
sudo service smbd reload
sudo service smbd restart
```


## VNCサーバ(vino)の設定
参考： <https://zenn.dev/tunefs/articles/9774eb8f229e1bf97a8c>
以下、参考先をベースに説明  

### Vinoのインストール
インストール済みなので不要  

### Vinoの自動起動の設定
コピー先ディレクトリは作成済み  
```bash
cp /usr/share/applications/vino-server.desktop ~/.config/autostart/
```

### Vinoのコンフィグレーション
実行は以下のみでOK  
```bash
gsettings set org.gnome.Vino prompt-enabled false
gsettings set org.gnome.Vino require-encryption false
```
以下は不要  
```
set org.gnome.Vino authentication-methods は "['vnc']" でなく "['none']"   デフォルトと同じなので不要
gsettings set org.gnome.Vino vnc-password $(echo -n 'thepassword'|base64) は不要
```

### 自動loginの設定
VNCはログインしてないと接続できないので、自動ログインを設定する  

``/etc/gdm3/custom.conf`` を以下のように変更  
- ``AutomaticLoginEnable`` の行を有効化
- ``AutomaticLogin `` の行を有効化して ``user1`` をloginするユーザ名に変更  

###  解像度の設定
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

### リブートする
再起動後、PCからVNCクライアントでJetson nano のポート5900(VNCのデフォルトポートなので省略可)に接続する。  

### 設定メニューを表示できるようにする
上記だけで設定は完了するが、設定メニュー(Settings)から設定しようとするとエラーになるので、
それを修正しておく(やらなくても設定メニュー使わなければ問題ない)。  

- ``/usr/share/glib-2.0/schemas/org.gnome.Vino.gschema.xml``に以下のパッチを当てる  
{% include filename.html filename="/tmp/a.patch" %}
```diff  
--- org.gnome.Vino.gschema.xml.org      2020-10-19 06:21:32.034728957 +0900
+++ org.gnome.Vino.gschema.xml  2020-10-19 06:22:30.887994965 +0900
@@ -154,5 +154,14 @@
       </description>
       <default>true</default>
     </key>
+    <key name='enabled' type='b'>
+      <summary>Enable remote access to the desktop</summary>
+        <description>
+          If true, allows remote access to the desktop via the RFB
+          protocol. Users on remote machines may then connect to the
+          desktop using a VNC viewer.
+        </description>
+      <default>false</default>
+    </key>
   </schema>
 </schemalist>
```

- パッチを当てるコマンド  
```bash
sudo patch /usr/share/glib-2.0/schemas/org.gnome.Vino.gschema.xml /tmp/a.patch
```

- さらにコンパイルが必要  
```bash
sudo glib-compile-schemas /usr/share/glib-2.0/schemas
```

- これで「settings」から「Desktop Sharing」が実行できるようになる

## 使用率等の確認ツールのインストールと起動

pyenvインストール済みのときは念のため``pyenv shell system``しておく。  
venv環境使用時はデアクティベートしておく。  
(sudo付きで実行してるのでsystemのpython3が使用されるハズだけど)  

```bash
sudo apt install python3-pip
sudo pip3 install jetson-stats
sudo jtop 
```
一度再起動したあとは、``sudo``なしの``jtop``のみで実行可能。  
>[!NOTE]
> jtopは結構CPUパワーを喰うので、性能評価等の間は止めておくのが無難と思われる。  

<!-- ---------------------------------------------------------------------- -->
# SDカードのイメージファイル化
[Raspbian SDカードイメージファイルの作成(改訂版)]({{ site.baseurl }}/2021/07/18/sd_image_2.html){:target="_blank"}を参照。  

# イメージのコピーからの起動
## 縮小されたパーティションを拡張する
バックアップはパーティションが縮小されているので、拡張する。  
上記参照先の拡張方法ではうまくいかない(JetsonはパーティションがGPTだから?)。  
なので、GUIツールのgpartedを使用して拡張する。  
```bash
sudo apt install gparted
export DISPLAY=192.168.78.200:0.0       # sshから実行するときはXserverが起動しているマシンをDISPLAY変数に設定
sudo gparted /dev/mmcblk0
```

- Libparted Warning ダイアログで”Not all of the space available to ～”と出たらFixをクリック
- Libparted Warning ダイアログで”The backup GPT table is corrupt, but the primary appears OK, so that will be used.”と出たらOKをクリック
- 以降も何度か出るが、以下の操作がすべて終わればbackup GPTが新たに作成されるので問題なし。
    - (これは、ディスクイメージを縮小したときにgdiskコマンドを実行しなかった場合に出ます)
- 図の«SDカードのパーティション» を右クリック→「Resize/Move」をクリック
    - 「New size」の欄に上にある「Maximum size」以下の値を入力(「Free space following」 に残したいサイズを入れても可)
    - 他の入力欄をクリックして自動計算を反映
    - 「Resize」をクリック
-「Edit」→「Apply All Operations」をクリック
    - 「Are you sure you want to apply the pending operations?」と聞かれるので、「Apply」をクリック
- 処理が完了したら閉じるボタンでプログラム終了


<!-- ---------------------------------------------------------------------- -->
# venvによるpython 仮想環境の構築
いつもはpyenv + virtualenv で環境構築しているが、この環境ではプリインストールされた opencv を使用できないらしい(core dumpする)。  
なので、system上のpythonを使用してvenvで仮想環境を構築して使用するようにしてみた。  
(これ、↓のnumpyの問題かも。でもtensorflowはpython3.6でないとダメだから、pyenv引っ張ってこなくてもいいか。)  

## venvのインストール
venv使用のためのプログラムをインストールする
```bash
sudo apt install python3-venv
```

## 仮想環境の構築
仮想環境を構築する。  
ここで実行したpythonが仮想環境で実行されるpythonになる。  
``--system-site-packages`` を付加しておくと元のパッケージも参照される。  
```bash
python3 -m venv --system-site-packages «venv_dir»
```
``pip list/freeze`` でも参照される。pipのバージョンが新しければ、``pip -v list``と オプション``-v``を付けることで インストール先を見分けることでどちらにインストールされているかが判別できる。  

例えばこんな感じ  
```bash
python3 -m venv --system-site-packages /proj/venvs/TF2.5
```

## 仮想環境のアクティベート
pyenvではlocalで指定してあればディレクトリ移動で自動的に仮想環境を切り替えられたが、  
venvでは逐一仮想環境をアクティベートしなければならない。  

```bash
source «venv_dir»/bin/bin/activate
```

## お約束
続いて ``pip`` ``setuptool`` ``wheel`` を最新版にしておく(お約束)。  
```bash
pip install --upgrade pip setuptools wheel
```


## 仮想環境の終了
仮想環境を終了するときは以下のコマンドでデアクティベートする。  
```bash
deactivate
```
>[!NOTE]
> ``deactivate``はアクティベート時に関数として登録されている  
> 下記のようにdirenvで設定した場合は``deactivate``は使えないが、ディレクトリから移動すれば元にもどるので問題ない  

<!-- ---------------------------------------------------------------------- -->
# direnvのインストールと設定
仮想環境管理をvenvで行うようにしたが、venvだと逐一activateしないといけないので、pyenvに慣れたカラダでは なかなか 使いにくい。  
そこで、direnvを使ってpyenvに近い使い勝手を実現してみる。  

参考：[direnvを使って、source bin/activateを自動化する](https://yoshitaku-jp.hatenablog.com/entry/2018/07/29/070000)

## インストール
インストールは``apt``でイッパツ  
```bash
sudo apt install direnv
```

## 初期設定
``~/.bashrc`` に以下の内容を追記。(上記``.bashrc``例では記載済み)  
エディタはvimに設定してあるが、別のものを使いたければ設定変更のこと。  
(direnv 未インストール時は設定はスキップされる)  

```bash
# direnv 設定
if type direnv > /dev/null 2>&1; then
    export EDITOR=vim
    eval "$(direnv hook bash)"
    
    # venvの仮想環境名を表示するための設定
    show_virtual_env() {
      if [ -n "$VIRTUAL_ENV" ]; then
        echo "($(basename $VIRTUAL_ENV))"
      fi
    }
    PS1='$(show_virtual_env)'$PS1
fi
```

``source ~/.bashrc`` するか、terminalを開きなおす。  

## 対象ディレクトリに処理を登録する
対象ディレクトリに移動して``direnv edit .`` を実行して中身を作成するか、 ``.envrc``を直接生成する。  

中身は以下の通り  
他にも設定したい環境変数があれば設定しておく。  
```bash
source «venv_dir»/bin/activate
```
例えばこんな感じ  
```bash
source /proj/venvs/TF2.5/bin/activate
```
``direnv: error .envrc is blocked. Run `direnv allow` to approve its content.``と言われたら、以下のように実行する。  
(直接編集した時に言われるらしい)  
```bash
direnv allow
```

<!-- ---------------------------------------------------------------------- -->
# tensorflow2 のインストール
## 仮想環境の構築
```bash
python3 -m venv --system-site-packages /proj/venvs/TF2.5
```

## 仮想環境のアクティベート
```bash
source /proj/venvs/TF2.5/bin/activate
```
またはdirenvで上記が実行されるように設定しておく

## お約束
続いて ``pip`` ``setuptool`` ``wheel`` を最新版にしておく(お約束)。  
```bash
pip install --upgrade pip setuptools wheel
```

tensorflowをimportしたとき(具体的にはその中でnumpyをimportしたとき)に
``Illegal instruction (core dumped)``が発生する。  
これを回避するため、以下を``~/.bashrc``に設定しておく(上記``.bashrc``例では記載済み) 。  

```bash
export OPENBLAS_CORETYPE=ARMV8
```

tensoorflowはpypiではなく、nvidiaのサイトからダウンロードしてインストールする。  
```bash
pip install https://developer.download.nvidia.com/compute/redist/jp/v46/tensorflow/tensorflow-2.5.0+nv21.7-cp36-cp36m-linux_aarch64.whl
```

>[!NOTE]
> n5pyインストールでエラーになった時は以下の手順で回避する。    
> ミソはh5pyのインストール時点でnumpy 1.19.5がインストールされているとエラーになるので、  
> 一時的にnumpyのそれ以前のバージョンをインストールしてh5pyをインストールし、その後numpyを本来のバージョンに戻す。  
> ```bash
> sudo apt install libhdf5-serial-dev hdf5-tools libhdf5-dev
> pip install cython
> # numpyのバージョン下げる  
> pip install --upgrade numpy==1.19.3
> pip install h5py==2.10.0
> # h5pyのインストールのためにインストールしたnumpyを本来のバージョンに更新  
> pip install --upgrade numpy==1.19.5
> ```

## Tensorflowなどのありか
以下に色々まとめられている。  
<https://elinux.org/Jetson_Zoo?fbclid=IwAR1_Mdi9asx0f8RNvzQIR9suJuPFqwF8ev_C6B7lyLLfsGnnIS4G_yFAr0I#ONNX_Runtime>

<!-- ---------------------------------------------------------------------- -->
# onnx-runtimeのインストール
## 仮想環境の構築
```bash
python3 -m venv --system-site-packages /proj/venvs/onnx
```

## 仮想環境のアクティベート
```bash
source /proj/venvs/onnx/bin/activate
```
またはdirenvで上記が実行されるように設定しておく

## お約束
続いて ``pip`` ``setuptool`` ``wheel`` を最新版にしておく(お約束)。  
```bash
pip install --upgrade pip setuptools wheel
```


## インストールファイルのダウンロード
[Jetson Zoo](https://elinux.org/Jetson_Zoo?fbclid=IwAR1_Mdi9asx0f8RNvzQIR9suJuPFqwF8ev_C6B7lyLLfsGnnIS4G_yFAr0I#ONNX_Runtime){:target="_blank"}
から使用環境に対応するインストールファイルをダウンロードする。  
表の下にあるコマンド例の``wget``ではうまくダウンロードできないのでブラウザでダウンロードしてコピっておく。  
以下、onnxruntime 1.8.0/Python 3.6 を選択したものとする。  

## インストール

システムにインストールされたprotobufのバージョンが古くてエラーになるので、
あらかじめ最新版にアップデートしておく。  
(venv環境なので、システムのprotobufには影響ない)
```bash
pip install --upgrade protobuf
```

ダウンロードしたonnx-runtimeをインストールする
```bash
pip install onnxruntime_gpu-1.8.0-cp36-cp36m-linux_aarch64.whl
```

