---
title: AndroidでpythonでBLE
date: 2025-4-21
tags: ["Android", "python", "BLE"]
excerpt: PythonプログラムをAndroidアプリ化できるBuildozerでBLE通信アプリを作ってみたときのメモ
layout: default
---


# 概要
[Buildozerでブロック崩しを作る]({{ site.baseurl }}/2025/04/04/Buildozer_2.html)ではゲームを作ってみたが、次はペリフェラルを使ってみたくなるのが人情というもの。  
[Bleak](https://bleak.readthedocs.io/en/latest/){:target="_blank"}というモジュールがクロスプラットフォームでAndroidでも使えるらしい。  
ということで、Bleakを使ってBLEを使用するアプリを作って、それをBuildozerでAndroidアプリ化してみる。  

以下、[Buildozerをお試し]({{ site.baseurl }}/2025/03/31/Buildozer_1.html)での環境構築が終わっているものとして進める。  


# 準備
これまで使用してきたWSL環境だとBluetoothが使用できないので、開発にはRaspberryPi5を使用することにした(Pi3以降なら大丈夫だと思う)。  
pyenvで仮想環境作ってkivyとbleakをインストールしておく。  

```bash
pip install kivy bleak
```

# 通信相手の準備
通信相手は前に作ったランダム値を送るペリフェラルを使った。  
[ここ](https://github.com/ippei8jp/MultiBLE/tree/main/micropython){:target="_blank"}のble_RandomSensor3.py を
RascberryPi PICO や ESP32 の micropython で動かしておく。  

micropythoの使い方は以前に書いた[Raspberry Pi Pico Wでmicropython with Visual Studio Code]({{ site.baseurl }}/2023/09/03/RasPiPico_1.html){:target="_blank"}
が参考になるかも。   


# ソース
ソースは下の「開く」をクリックすると表示されます。  
ダウンロードする場合は[こちら](https://gist.github.com/ippei8jp/b1d47be7bce11f9e4c6f70a626e5d1c1){:target="_blank"}  

>[!NOTE]
> importしている``scrolllabel.py``は
> [ここ](https://gist.github.com/ippei8jp/6c3880bd0c844cad2279e3a4c45d15e7){:target="_blank"}
> にあります。  

用意するファイルはこんな感じ。  
```
.
├── kivy_ble.py
└── scrolllabel.py
```

↓をクリックするとソースが開きます。  
<dev class="accordion_head_close"></dev>
<dev class="my-gist">
    <script src="https://gist.github.com/ippei8jp/b1d47be7bce11f9e4c6f70a626e5d1c1.js"></script>
</dev>

  
# RaspberryPiで実行
まずはPythonスクリプトが動くことを確認するために、RaspBerryPiで動かしてみる。  
通信相手がいないと動かないので、事前に上の通信相手を実行しておく。  

RaspberyPi上でkivy_ble.pyを実行するとウィンドウが開くので、connectボタンをクリックする。  
ペリフェラルをスキャンが開始され、最初に見つかったデバイスに接続される。  
さらにDATA1とDATA2のNotifyハンドラが登録され、受信データがウィンドウ右上の表示領域に表示される。  
disconnectボタンをクリックすると切断される。  
QUITボタンをクリックするとプログラム終了。  
ウィンドウ下半分のログ表示領域には情報が表示される。この領域はスクロール可能。  



# Androidアプリ化
[Buildozerをお試し]({{ site.baseurl }}/2025/03/31/Buildozer_1.html)と同様の手順でAndroidアプリ化していく。  

## ファイルの準備

- BuidozerがインストールされたWSLの仮想マシンに作業ディレクトリを作成
- 作業ディレクトリに 上で作成した``kivy_ble.py`` ``scrolllabel.py``をコピー
- ``kivy_ble.py``を ``main.py`` にリネーム
- RaspberryPiの≪Bleakインストール先≫>/bleak/backends/p4android/recipes を 作業ディレクトリにコピー(ディレクトリまるごと)
>[!NOTE]
> Bleakのインストール先ディレクトリは以下のコマンドで確認できます
> ```bash
> pip list -v | grep "bleak "
> ```

-または以下でもOK
>[!NOTE]
> ```bash
> mkdir -p recipes/bleak
> wget -P recipes/bleak https://raw.githubusercontent.com/hbldh/bleak/refs/heads/develop/bleak/backends/p4android/recipes/bleak/__init__.py
> wget -P recipes/bleak https://raw.githubusercontent.com/hbldh/bleak/refs/heads/develop/bleak/backends/p4android/recipes/bleak/fix_setup.py
> ```

- ``buildozer init`` を実行して``buildozer.spec``を生成する
- ``buildozer.spec``に以下の修正を加える    

<dev class="accordion_head"></dev>
```diff
--- buildozer.spec.org  2025-04-09 07:58:44.836709400 +0900
+++ buildozer.spec      2025-04-17 08:12:06.676451390 +0900
@@ -1,10 +1,10 @@
 [app]

 # (str) Title of your application
-title = My Application
+title = BLE Demo

 # (str) Package name
-package.name = myapp
+package.name = bledemo

 # (str) Package domain (needed for android/ios packaging)
 package.domain = org.test
@@ -22,7 +22,7 @@
 #source.exclude_exts = spec

 # (list) List of directory to exclude (let empty to not exclude anything)
-#source.exclude_dirs = tests, bin, venv
+source.exclude_dirs = tests, bin, venv, recipes

 # (list) List of exclusions using pattern matching
 # Do not prefix with './'
@@ -37,7 +37,13 @@

 # (list) Application requirements
 # comma separated e.g. requirements = sqlite3,kivy
-requirements = python3,kivy
+requirements =
+    python3,
+    kivy,
+    bleak,
+    typing_extensions,
+    async_to_sync,
+    async-timeout

 # (str) Custom source folders for requirements
 # Sets custom source for any requirements with recipes
@@ -95,7 +101,14 @@

 # (list) Permissions
 # (See https://python-for-android.readthedocs.io/en/latest/buildoptions/#build-options-1 for all the supported syntaxes and properties)
-#android.permissions = android.permission.INTERNET, (name=android.permission.WRITE_EXTERNAL_STORAGE;maxSdkVersion=18)
+android.permissions =
+    BLUETOOTH,
+    BLUETOOTH_SCAN,
+    BLUETOOTH_CONNECT,
+    BLUETOOTH_ADMIN,
+    ACCESS_FINE_LOCATION,
+    ACCESS_COARSE_LOCATION,
+    ACCESS_BACKGROUND_LOCATION

 # (list) features (adds uses-feature -tags to manifest)
 #android.features = android.hardware.usb.host
@@ -330,7 +343,7 @@
 #p4a.source_dir =

 # (str) The directory in which python-for-android should look for your own build recipes (if any)
-#p4a.local_recipes =
+p4a.local_recipes = ./recipes

 # (str) Filename to the hook for p4a
 #p4a.hook =
```

- 最終的に作業ディレクトリは以下のようになる
```
≪作業ディレクトリ≫
  ├── buildozer.spec
  ├── main.py
  ├── scrolllabel.py
  └── recipes
       └── bleak
           ├── __init__.py
           └── fix_setup.py
```
## build
以下のコマンドでbuidする
```bash
buildozer -v android debug 2>&1 | tee mk.log
```

## インストール＆実行
Windows側でadbサーバを起動しておき、以下を実行。  
```bash
buildozer -v android deploy run logcat 2>&1 | tee run.log
```

connectボタンを最初にクリックした時、「この端末の位置情報へのアクセスをBLE Demoに許可しますか？」と聞かれたら「許可」をクリック
(Androidのバージョンによって違うかもしれん。ターゲットAPIレベルで決まるんだっけ？)





