---
title: ubuntu 小ネタ集
date: 2020-05-26
tags: ["Ubuntu"]
excerpt: ubuntuの小ネタ集
---

# これまでに apt でインストールしたパッケージを調べる


``apt`` でインストールされたパッケージ一覧は ``apt list --installed ``で取得できるけど、  
自分で入れたのか関連パッケージで入ったのかがイマイチよくわからないのと、  
実際にどんなパッケージ名でインストールすれば良いのかが分かりにくいので。  

```bash
zgrep -1 install `ls -tr /var/log/apt/history.log*`
```

lsのオプションで``-tr``を指定しているのでタイムスタンプが古いファイルから検索される(つまり``apt``実行の古い順)。  
コマンドラインの一つ前の行に実行日時、一つ後ろの行に実行者が入っているので、これを目安に必要な情報をピックアップできる。  
"install" をgrepで引っかけているので、たまに余計なのも引っかかるけど、ご愛敬ということで(笑)。  

アンインストールしたのは別途調べないといけないけど…  
removeとpurgeで引っかければいけるかな？  
こんな感じ。  

```bash
zgrep -1 -e remove -e purge `ls -tr /var/log/apt/history.log*`
```

> [!NOTE]
現在インストール済みパッケージを知りたいだけなら以下でも大丈夫。  
```bash
apt list --installed
```
手動でインストールしたものだけ取得したい場合は以下(つまり、関連パッケージとしてインストールされたものを除く)。  
```bash
apt list --installed | grep -v 自動
```

# ファイルがどのパッケージに含まれているかを調べる方法

コマンドを実行して○○が見つからないと言われて、どのパッケージをインストールすれば良いのか分からないときに。  

最初に``apt-file``をインストール  
```bash
sudo apt install apt-file
```

実行前に以下でパッケージ情報を更新しておく。そんなに頻繁にやらなくても良い。  
```bash
sudo apt-file update 
```

で、以下で検索。  
```bash
apt-file search ○○
```

逆にパッケージに含まれるファイル一覧を取得したい場合は以下。  
```bash
apt-file show <パッケージ名>
```


# VirtualBox上のUbuntuとclipboardの共有がおかしくなったときの対処方法

VirtualBox上のUbuntuでclipboardの共有の動作がおかしくなることがある。  
その場合、以下で対応可能。  

- 現状のプロセスを確認

```bash
ps aux | grep 'VBoxClient --clipboard' | grep -v grep
```

- プロセスが存在することを確認

- プロセスのkill

```bash
pkill -f 'VBoxClient --clipboard'
```

- プロセスの再起動

```bash
/usr/bin/VBoxClient --clipboard
```

これで正常にclipboardの共有ができるようになるはず。  


# ubuntu 18.04 で IPv6を無効にする方法

ubuntu 18.04 では IPv6を無効にする方法には、以下の手順で行う。  

- ``/etc/sysctl.d/99-sysctl.conf`` に以下の内容を追加。

```
net.ipv6.conf.all.disable_ipv6 = 1
net.ipv6.conf.default.disable_ipv6 = 1
net.ipv6.conf.lo.disable_ipv6  =  1
```

- サービスの再読み込み

```bash
sudo sysctl -p
```

- ``/etc/rc.local`` に以下を追記(なければ新規作成)

```
#!/bin/bash
/etc/init.d/procps restart

exit 0
```

- 新規作成した場合は実行属性を追加  

```bash
sudo chmod 755 /etc/rc.local
```

これで起動の度にIPv6は無効になる。  

参考： [Ubuntu 18.04 で ipv6 を無効にする](https://www.rough-and-cheap.jp/ubuntu/ubuntu18_04_howto_diseable_ipv6/?fbclid=IwAR3_ZYqE7IJOg-1FMczHdoJ7zztDrVojHfU8VF-Zbu6e1cRT-6IGg3hVtIA)


# lessのオプション

lessのオプションで便利そうなもの一覧。  

- ANSI Color Escape Sequenceを色表示する(-R)
- 検索ワードの大文字小文字を区別しない(-i)
    - 検索ワードに大文字を含めると区別するようになる。
- 画面右端で折り返さない(-S)
    - 矢印キー(←→) で横スクロールできる。
- ファイル名、現在の表示位置などを表示する(-M)
- 行番号表示(-N)

デフォルトのオプションを指定するには ``.bachrc`` に以下のように追加しておけば良い。  
```bash
export LESS="-iMR"
```

lsやgrepの出力をlessしたときも色付きで表示する方法
```bash
ls --color=always | less -R
grep --color=always if .bashrc | less -R
```

``.bashrc`` に 以下を設定しておくと便利かと思ったけど...  
ただし、同時にlessのデフォルトオプションに``-R`` を指定しておかないと悲しいことになる。  
でも、ファイルにリダイレクトしたときに悲しいことになるので、やめておいた方が無難...  

```bash
export LS_OPT='--color=always' 
export GREP_OPT='--color=always' 
alias ls='ls ${LS_OPT}'
alias grep='grep ${GREP_OPT}'
```
# ファイルの"START" から "END" までを抽出する

```bash
sed -n "/START/,/END/p" «ファイル名»
```

# bashスクリプトのコメント

## ブロックコメント

ブロックコメントそのものは存在しないが、ヒアドキュメントを応用すれば出来る。  
具体的には、コメント部分を``<<キーワード`` と``キーワード``で囲む。

```bash
<< キーワード
～～コメント～～
キーワード
```

例えばこんな感じ。  

```bash
<< __BLOCK_COMMENT__
～～コメント 1 行目～～
～～コメント 2 行目～～
・・・・・・
～～コメント n 行目～～
__BLOCK_COMMENT__
```

## インラインコメント

コマンドの一部を一時的に削除したい場合など、インラインコメントを使用したい場面がある。  
例えば、C言語で``func(～/* コメントアウト */,～)``とする場面のこと。  
これをbashスクリプトで実現するには、コマンド置換を応用する。  
コマンド置換とは、コマンドを`` ` `` と `` ` `` で囲んでその出力を別のコマンドのパラメータとする方法のこと。  
具体的には、行コメントをコマンド置換で挿入する。  
置換されたコマンドはコメントなので結果なにもせずに返ってくるので、その部分は無視される。

ただ、この書き方はとても汚いので、一時的使用にとどめておくのがベター。  


```bash
command arg1 arg2 `#コメントアウト` arg3 ・・・
```

例えばこんな感じ。  

```bash
ls  `#-l`  /etc
```

シェル変数の設定など、コマンドの前にコマンド置換があるとうまく動かない場合は、以下のようにコマンド置換の後ろに``;``を挿入する。  

```bash
`# comment`;var=hoge
```

# bashのファイル名補完の区切り文字を追加する方法

#### シチュエーション
たとえば、``HOGE_PATH=/path/to/hoge``と入力したいとき、途中でファイル名の補完処理ができない。  
今まで、一旦スペース挟んで入力して、戻ってスペース削除するという手順を踏んでいて、  
これが地味にストレス...  

##### ソリューション
``~/.bashrc`` に以下の1行を追加
```bash
IFS='«追加したい文字»'$IFS
```

シチュエーションのように``=``を区切り文字として追加したい場合は、こんな感じ  
```bash
IFS='='$IFS
```

##### ちなみに
設定内容を確認するには以下。  
```bash
echo -n "$IFS" | od -c
```

##### ちなみに２
デフォルトの設定に戻すには以下。
先頭に``$``で、シングルクォート``'`` で囲むこと。
```bash
IFS=$' \t\n'
```

##### 言い訳の先取
なんか悪影響出たら元に戻そう。。。  


# 端末(ターミナル)ウィンドウの起動方法によって初期処理を変更する
## 端末(ターミナル)ウィンドウの環境変数を設定してbashを起動するプロファイルを作成する

- まず現在の設定で端末を開く  
- メニューの<span style="border: 1px solid;">編集</span> → <span style="border: 1px solid;">Preferences</span> を選択  
- 左側でベースにするプロファイルの右端の▼をクリックして<span style="border: 1px solid;">Clone...</span>を選択  
- 名前を入力(例えばopenVINO)して<span style="border: 1px solid;">Clone</span> をクリック
- 作成したプロファイルをクリックして右側上のタブで<span style="border: 1px solid;">コマンド</span>を選択  
- <span style="border: 1px solid;">□ SHELLの代わりにカスタム・コマンドを実行する(N)</span> にチェックを入れる  
- <span style="border: 1px solid;">カスタムコマンド</span>に``/usr/bin/env myUseSetting=OPENVINO bash``と入力  
  ここで、``myUseSetting=OPENVINO`` が設定したい環境変数
- その他のタブはお好みで変更 
- <span style="border: 1px solid;">閉じる</span>をクリック  

## 環境変数によって.bashrcの処理を変更する

``~/.bashrc`` に環境変数に応じた処理を追加  

```bash
if [[ ${«設定した環境変数»} = "«期待する文字列»" ]]; then
    «環境変数に応じた処理»
fi
```

たとえば、こんな感じ。  
```bash
if [[ ${myUseSetting} = "OPENVINO" ]]; then
    source /opt/intel/openvino/bin/setupvars.sh
    echo "========== bash for openINO =========="
fi
```

試してみる。  
以下のコマンドを実行。  
```bash
gnome-terminal --profile=«作成したプロファイル名»
```

たとえば、こんな感じ。  
```bash
gnome-terminal --profile=openVINO
```

起動した端末(ターミナル)ウィンドウで追加した初期処理が実行されていることを確認。  
通常起動の端末(ターミナル)ウィンドウで追加した初期処理が実行されていないことも確認した方がいいかも。  

## キーボードショートカットで作成したプロファイルの端末(ターミナル)を起動する

- 「設定」を開き、左側で<span style="border: 1px solid;">デバイス</span> →<span style="border: 1px solid;">キーボード</span>と選択する  
- <span style="border: 1px solid;">名前</span>に適当な名前を設定  
- <span style="border: 1px solid;">コマンド</span>に先ほど試したコマンドを入力  
- <span style="border: 1px solid;">ショートカットの設定...</span>をクリックし、設定したいキーの組み合わせを押す  
  - 既に設定済みのキーの組み合わせは使用できない  
- 右上の<span style="border: 1px solid;">追加</span>をクリックして完了  

デスクトップで設定したキーの組み合わせを押して起動することを確認

## メニューに作成したプロファイルの端末(ターミナル)を起動するアイコンを追加する

以下の手順で新しい``.desktop``ファイルを作成すればよい。  

- 元になる``desktop``ファイルから新しい``desktop``ファイルを作成  
```bash
sudo cp gnome-terminal.desktop «新しいdesktopファイル»
```

- 新しい``desktop``ファイルの設定を変更する
  - ``Name``に適当な名称(この名称で表示されるので、分かりやすい名前で)を入力  
  - ``Exec``に前に試したコマンドを入力。  
    例えば、こんな感じ。  
    ```diff
    --- gnome-terminal.desktop	2018-05-30 22:03:45.000000000 +0900
    +++ openvino.desktop	2020-06-17 12:26:37.403276823 +0900
    @@ -1,9 +1,9 @@
    [Desktop Entry]
    -Name=Terminal
    +Name=bash for openVINO
    Comment=Use the command line
    Keywords=shell;prompt;command;commandline;cmd;
    TryExec=gnome-terminal
    -Exec=gnome-terminal
    +Exec=gnome-terminal --profile=openVINO
    Icon=utilities-terminal
    Type=Application
    X-GNOME-DocPath=gnome-terminal/index.html
    ```
- アクティビティで``Name``で設定した名前を検索すればアイコンが出てくるのでクリックして起動  


ちなみに、作成したアイコンをデスクトップに置くことも可能(その他の物でもできるけど)  

- 配置したい``desktop``ファイルを``~/デスクトップ``ディレクトリにコピーして実行属性を付ける
```bash
cp /usr/share/applications/openvino.desktop ~/デスクトップ/
chmod +x ~/デスクトップ/openvino.desktop 
```
  - 実行属性を付けないと以下のダイアログで<span style="border: 1px solid;">キャンセル</span>しか選べないので注意  
- デスクトップ上のアイコンをダブルクリック
  - <span style="border: 1px solid;">信用できないアプリケーションのランチャー</span>ダイアログが出るので、  
  - <span style="border: 1px solid;">信頼して起動</span>をクリック  
  - (2回目以降はダブルクリックだけで起動できる)



# カレントディレクトリ下のファイルの全角文字等を抽出する

```bash
grep -r -n -v '^[[:cntrl:][:print:]]*$' .
```

# GUIで設定した項目の変更キーの確認

設定変更の前後で``dconf``コマンドで値一覧を取得し、その差分を確認することで変更キーが分かる。  
```bash
dconf dump / > before.txt
# 設定変更
dconf dump / > after.txt

diff -u before.txt after.txt
```

キーが分かれば、以後は以下のコマンドで設定変更できる。  
スクリプトなどに記載する場合に便利。  
```bash
gsettings set «キー» «値»
```

# ディストリビューションのバージョン確認

以下のコマンドで確認できる。  

```bash
lsb_release -a
```

こんな感じで表示される  

```bash
No LSB modules are available.
Distributor ID: Ubuntu
Description:    Ubuntu 20.04.2 LTS
Release:        20.04
Codename:       focal
```
最初の1行は特に気にしなくて良い。  
LSB(Linux Standard Base)がインストールされていると、もっと細かい情報が表示されるらしい。