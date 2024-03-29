---
title: Jetson nano をセットアップする
date: 2020-10-23
tags: ["DeepLearning", "Jetson nano"]
excerpt: Jetson nano をセットアップする
---
本稿はJetoack4.4での手順です。  
Jetpack4.6のときのメモは[Jetson nano をセットアップする(Jetpack4.6)]({{ site.baseurl }}/2021/09/13/Jetson_nano_install.html){:target="_blank"} にあります。  

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
- [UbuntuをNative環境にインストールする(18.04)]({{ site.baseurl }}/2020/05/08/ubuntu_native.html)

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

### SSH接続がタイムアウトする対策
SSH接続したターミナルを触らずにしばらく置いておくと、タイムアウトしてクローズされてしまう。
これを防ぐにはクライアント側からkeep-aliveパケットを定期的に送信してやれば良いらしい。

Teratermの場合、「設定」→「SSH」→「ハートビート(keep-alive)」を「8」とかに設定し、保存。
次回接続時はこの保存した設定ファイルを読み込む


### シリアルコンソール/SSH接続でGUIウィンドウを表示できるようにする
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

# リモートデスクトップの設定
TigerVNC はちょっと動作があやしいので、やめておいて、Desktop Sharing(Vino)を使うことにする。  
参考：
- [Jetson Nanoにリモートデスクトップ(VNC)環境を用意する](https://qiita.com/iwatake2222/items/a3bd8d0527dec431ef0f#%E6%96%B9%E6%B3%952-desktop-sharingvino%E3%82%92%E4%BD%BF%E3%81%86)
- [Getting Started with the NVIDIA Jetson Nano Developer Kit](https://www.hackster.io/news/getting-started-with-the-nvidia-jetson-nano-developer-kit-43aa7c298797) の 「Enabling Desktop Sharing」

この手順はウィンドウマネージャがUnityで実行しています。 ウィンドウマネージャをUbuntuに変更していると少し手順が違うかもしれませんので、
ウィンドウマネージャをUbuntuに変更している場合はUnityに戻してから設定してください。  
設定完了後はUbuntuに再変更しても問題ありません。  

以下手順の再掲。  

- ``/usr/share/glib-2.0/schemas/org.gnome.Vino.gschema.xml``に以下のパッチを当てる    

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
- 以下のコマンドを実行(これで「システム設定」に「デスクトップの共有」アイコンが表示されるようになる)  
```bash
sudo glib-compile-schemas /usr/share/glib-2.0/schemas
```
- GUI画面から「システム設定」→「デスクトップの共有」(ユーザ向けカテゴリの中にある)
  - 「Sharing」カテゴリ
    - 「Allow other users to view your desktop」にチェックを*入れる*
    - 「Allow other users to control your desktop」にチェックを*入れる*
  - 「セキュリティ」カテゴリ
    - 「You must confirm each access to this machine」のチェックを*はずす*
    - 「Requwire the user to enter this password」にチェックを*入れて*パスワード設定
    - 「Automatically configure UPnP router to open and forward ports」のチェックを*はずす*
  - 「Show Notification Area Icon」カテゴリ
    - 「Only when someone is connected」を選択
> [!NOTE]
> ウィンドウマネージャがUbuntuの時は「設定」で設定する。
> 左側の「共有」カテゴリを選択、「画面共有」をクリック  
>   - 「このスクリーンの操作する接続を許可する」をチェック  
>   - 「アクセスオプション」で「パスワードを要求する」を選択し、パスワード設定  
>   - 「ネットワーク」で「有線接続1」のスライドスイッチで「オン」を選択
> 左上のスライドスイッチで「オン」を選択
> で出来ると思うけど、出来なかったらUnityで上の方法で設定した後、再度Ubuntuに切り替えてちょ。  

- 「自動起動するアプリケーション」を起動
> [!NOTE]
> 「コンピュータを検索」で「自動」または「session」と入力すると出てくる
> 日本語環境だと「startup」で出てこないみたい...
  - 「追加」ボタンをクリック
    - 名前に「Vino」
    - コマンドに「/usr/lib/vino/vino-server」
    - 説明に「VNC server」
    ｰ と入力して「追加」をクリック
- 以下のコマンドを実行
```bash
gsettings set org.gnome.Vino require-encryption false
gsettings set org.gnome.Vino prompt-enabled false
```
> [!NOTE]
> これはVinoの暗号化方式がWindowsと互換性がないための措置で、  
> 暗号化を無効化しているらしい。  
> dconf-editorでも設定できる。

> [!WARNING]
> VNC使う場合は自動ログインをONしておかないといけない  
> 設定箇所はぐぐってちゃぶだい...😅

- リブートする
- ホストPCからRealVNCのVNC ViewerやUltraVNC viewerなどで接続する

> [!WARNING]
> VNCは反応速度が鈍いので、ちょっと使いにくい。  
> 普段はSSHとsambaとホスト側のX-Serverで動かすのが良いかも...



# 追加情報
ipv6を無効にしたい(ネットワーク環境によっては無効にした方が良い)場合は、  
[ubuntu 小ネタ集]({{ site.baseurl }}/2020/05/26/ubuntu_koneta.html)の
「ubuntu 18.04 で IPv6を無効にする方法」 にしたがって設定する。  
