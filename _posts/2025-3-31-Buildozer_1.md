---
title: Buildozerをお試し
date: 2025-3-31
tags: ["Android", "python"]
excerpt: PythonプログラムをAndroidアプリ化できるBuildozerをお試ししたときのメモ
layout: default
---

# 概要
pythonプログラムをAndroid アプリ化できる Buildozer を試してみた時のメモ  
(iOSもできるみたいだけど試してないのでわからん)  
参考:  
[公式サイト](https://buildozer.readthedocs.io/en/latest/installation.html){:target="_blank"}  
[BuildozerでAndroidアプリを作る 2024 WSL2](https://qiita.com/kouzimiso/items/1332ab62791ca5d81c5f){:target="_blank"}  
[pythonでAndroidの野良アプリを作りたい2 buildozerでコンパイル編](https://paloma69.hatenablog.com/entry/2022/07/05/195915){:target="_blank"}  


# 準備
環境はWSL で Ubuntu 24.04を使用した。  
(公式では20.04 or 22.04 となってるけど、24.04でも動いた)  
以下ディストリビューション情報  

Andoridはちょっと古いけど ZenFone Max Pro (M2) Android9  
新しいAndroidでも動くかどうかわからん。  

```bash
~$ lsb_release -a
No LSB modules are available.
Distributor ID: Ubuntu
Description:    Ubuntu 24.04.2 LTS
Release:        24.04
Codename:       noble
```

## pyenvのインストール

[pyenvのインストール]({{ site.baseurl }}/2019/06/27/pyenv.html){:target="_blank"}参照  

## pyenvでpythonインストール
公式では python は 3.8 以降となっているので、3.12を使うこととした。  

>[!NOTE]
> 3.12では``distutils``が廃止されているので、``setuptools``のインストールが必須。  
> 参考：[Python 3.12での「ModuleNotFoundError: distutilsが見つかりません」を解決する方法](https://openillumi.com/python-3-12-distutils-error-fix-guide/){:target="_blank"}  


```bash
pyenv install 3.12.9 
pyenv shell 3.12.9 
pip install --upgrade pip setuptools wheel
pyenv shell --unset 
```

## pyenvで仮想環境構築
お約束で仮想環境を作っておく。  
(そのまま3.12.xにインストールしてもいいけど)  

```bash
mkdir -p /work/Buildozer && cd /work/Buildozer
pyenv virtualenv 3.12.9 Buildozer
pyenv local Buildozer 
pip install --upgrade pip setuptools wheel
```


## 必要なツール類のインストール
```bash
sudo apt install zip unzip openjdk-17-jdk autoconf libtool pkg-config zlib1g-dev cmake libffi-dev libssl-dev
```
>[!NOTE]
> 公式サイトで指定されているライブラリのうち以下は24.04では存在しない。  
> ``libncurses5-dev libncursesw5-dev libtinfo5``  
> WSL2のUbuntu24.04ではデフォルトで後継のlibncurses-dev、libtinfo6が入ってるので気にしなくても大丈夫  



## Buildozer関連のモジュールのインストール
```bash
pip install --upgrade buildozer
pip install --upgrade Cython==0.29.33 virtualenv
```

## 使用するフォントのインストール
どっかからダウンロードしてきてもいいけど、お手軽にaptでインストール  
(あとで作業ディレクトリにコピーする)  

```bash
sudo apt install fonts-takao
```

## Ubuntu上でアプリ実行するとき必要なライブラリのインストール

```bash
sudo apt install libmtdev-dev
```

## アプリで使うモジュールのインストール

```bash
pip install kivy
```

# アプリの作成

## 作業ディレクトリの作成

どこでも良いけど、先に作ったpyenvの仮想環境``Buildozer``が使えるh場所で。  
```bash
mkdir /work/Buildozer/app && cd /work/Buildozer/app
```

## フォントのコピー
先ほどインストールしたフォントを作業ディレクトリにコピー  
```
mkdir assets
cp /usr/share/fonts/truetype/fonts-japanese-gothic.ttf assets/
```

## main.pyを作成

[参考にしたサイト](https://qiita.com/kouzimiso/items/1332ab62791ca5d81c5f){:target="_blank"}
にあったプログラムを使わせてもらった(ちょっち変更あり)。  

{% include filename.html filename="main.py" %}
```python
from kivy.app import App
from kivy.uix.button import Button
from kivy.uix.label import Label
from kivy.uix.boxlayout import BoxLayout

from kivy.core.text import LabelBase, DEFAULT_FONT
from kivy.utils import platform

# フォントのパスを指定してフォントを設定する
if platform == 'win':
    # Windowsの場合はシステムフォントを使用
    LabelBase.register(DEFAULT_FONT, fn_regular="C:/Windows/Fonts/YuGothR.ttc")
elif platform == 'android':
    # Androidの場合はassetsフォルダ内のフォントを使用
    LabelBase.register(DEFAULT_FONT, fn_regular='assets/fonts-japanese-gothic.ttf')
else:
    # その他のプラットフォームではデフォルトフォントを使用
    # LabelBase.register(DEFAULT_FONT, fn_regular='DejaVuSans.ttf')
    # その他の場合もassetsフォルダ内のフォントを使用
    LabelBase.register(DEFAULT_FONT, fn_regular='assets/fonts-japanese-gothic.ttf')

class MyApp(App):
    def build(self):
        # レイアウトの生成
        layout = BoxLayout(orientation='vertical', spacing=10, padding=10)
        
        # ボタンの生成
        self.button = Button(text='クリックしてください')
        
        # ボタンにコールバックを設定
        self.button.bind(on_press=self.on_button_press, on_release=self.on_button_release)
        
        # ラベルの生成
        self.label = Label(text='ボタンがクリックされるとここに表示されます')
        
        # layoutにボタンとラベルを配置
        layout.add_widget(self.button)
        layout.add_widget(self.label)
        
        return layout

    # ボタンが押されたたときのコールバック処理
    def on_button_press(self, instance):
        self.label.text = 'ボタンが押されました！'
    
    # ボタンが離されたたときのコールバック処理
    def on_button_release(self, instance):
        self.label.text = 'ボタンが離されました！'

if __name__ == '__main__':
    MyApp().run()
```

## とりあえずUnuntu上で試してみる

```bash
python main.py
```
>[!NOTE]
> 上半分がボタン、下半分がラベル  
> ボタンを押す/離すとラベルの表示が変わる  
> Xボタンで終了    


## Buildozer初期化
```bash
buildozer init
```
buildozer.spec が生成される

## buildozer.specファイルの修正
以下の修正を行う

```diff
--- buildozer.spec.org  2025-03-28 11:44:32.382972664 +0900
+++ buildozer.spec      2025-03-28 11:52:18.977717226 +0900
@@ -13,10 +13,10 @@
 source.dir = .

 # (list) Source files to include (let empty to include all the files)
-source.include_exts = py,png,jpg,kv,atlas
+source.include_exts = py,png,jpg,kv,atlas,ttf

 # (list) List of inclusions using pattern matching
-#source.include_patterns = assets/*,images/*.png
+source.include_patterns = assets/*.ttf

 # (list) Source files to exclude (let empty to not exclude anything)
 #source.exclude_exts = spec
```

## clean & build
```bash
buildozer android clean     # 初回はやらなくてOK(FileNotFoundErrorになる)
buildozer -v android debug 2>&1 | tee -a buildozer.log
```

正常にbuildが終了したら以下のように表示される。  
```
APK myapp-0.1-arm64-v8a_armeabi-v7a-debug.apk available in the bin directory
```

>[!NOTE]
> 初回は途中ライセンスに同意を求められるので同意するならyを入力(同意しないと終わっちゃうけど)  
> 終了まで15分ほどかかった(環境依存なのであまりあてにしないで)  
> 初回はダウンロードが入るのでもうちょっとかかる  


# 実行
## Android側の準備
adbが接続できるようになんか準備が必要(デバッグモードを有効にするとか?)だった気がするけど
忘れちゃったので良きに計らってちょ
([このへん？](https://developer.android.com/studio/debug/dev-options?hl=ja){:target="_blank"})  

で、PCとUSBで接続しておく。  

## Windows用 adbのダウンロード
[SDK Platform-Tools リリースノート](https://developer.android.com/tools/releases/platform-tools?hl=ja){:target="_blank"}  
「ダウンロード」セクションの「SDK Platform-Tools for Windowsをダウンロード」からダウンロードし、適当なディレクトリに展開
(例：C:\Android_tools )  

>[!NOTE]
> PATHを通してもいいけど、AndroidStudio使うときに不安なので通さないでcdしてから実行するようにした  

> [!TIP]
> AndroidStudioが入っているのであれば、そっちを使っても可。  
>  その場合、adb.exeは``%LOCALAPPDATA%\Android\Sdk\platform-tools``にある。  


>[!NOTE]
> 公式の情報ではWindowsのadbとUbuntuのadbのバージョンが同じでないとダメと書いてあるが、多少違っても大丈夫っぽい。  
> (てか、古いバージョンダウンロードできるんだろか?と思ったら、
> [Android SDK platform-tools 旧バージョン インストール](https://qiita.com/azumagoro/items/3a44fad53d88b3b2817b){:target="_blank"}
> に手順書いてあった。メンドクサイけど...)  


## adbサーバの起動
Windows側(コマンドプロンプト等)から以下を実行(サーバを起動するためだと思う)
```bash
cd ≪上で展開したディレクトリ≫\platform-tools
adb.exe devices -l
```

> [!IMPORTANT]
> 最初のadbの実行はWindows側。コマンドプロンプトやpowershellで実行する。  


以下のように表示されるはず
```
* daemon not running; starting now at tcp:XXXX
* daemon started successfully
List of devices attached
＝＝ 接続されているデバイスが表示される ＝＝
```

ちなみにサーバを停止するには以下
```
adb kill-server
```

## ダウンロードと実行

WSL側のターミナルに戻って以下を実行
```bash
buildozer -v android deploy run 
```

これでプログラムがAndroidにダウンロードされて実行される。  

logcatを表示したいときは以下
```bash
buildozer -v android deploy run logcat
```
>[!NOTE]
> 上記のコマンドを実行すると内部でadbが実行されるようだ。  


## USB接続せずに実行したい場合
USB接続せずに実行したい場合は以下のように実行してWebサーバを起動する。  
```bash
buildozer serve
```
WEBサーバが立ち上がったら、Androidのchrome等からアクセスし、apkファイルをダウンロードしてインストール  
...できるんだけど、通常firewallが動いていてアクセスが弾かれるのでfirewallの設定変更しないといけない。  
変更方法は[このへん](https://www.fmworld.net/cs/azbyclub/qanavi/jsp/qacontents.jsp?PID=0111-2966){:target="_blank"}  
(試してないけど)


## その他の方法
quickshreを使うとか、USBのファイル転送モードを使えばapkファイルを転送できるので、
あとはFiles等で表示してapkファイルとタップすればインストールできる。  
(なんか野良アプリのインストール許可とか色々許可しないといけなかった気がする)  


# まとめ
とりあえずなんか実行できるものができたけど、実用に堪えるかはビミョー。  
ファイルアクセスとかネットワークアクセスとか出来るのかな?  
Bluetoothはどうなんだろ?  
アクセス権限とかいろいろメンドクサイ処理が必要だったけど、そこまで対応してるんだろか?  
気が向いたらもうちょっと調べてみるかも...  





