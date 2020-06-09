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


# git

## checkoutしてブランチを作成する
```bash
git checkout -b «ブランチ名» tag refs/tags/«タグ名»
```

## ブランチを切り替える
```bash
git checkout «ブランチ名»
```

## リモートリポジトリと同期する

必要ならmasterブランチに切り替えてから実行する ``git checkout master``

```bash
git pull
```

## ブランチ間のdiff
```bash
git diff «比較元ブランチ名» «比較先ブランチ名» [ファイル名 | ディレクトリ名]
```

