---
title: github pagesのローカル環境での実行
date: 2019-07-17
tags: ["Ubuntu","Ruby","github"]
excerpt: github pagesをローカル環境で実行する手順のメモ
---

github pagesの動作を確認するため、ローカル環境で実行することができる。

以下の手順はUbuntu 16.04で動作確認した。他のバージョンでは、特にインストールの準備に微妙な違いがあるかもしれない。  

# インストール

apt または rbenvでrubyをインストールしておく。

aptの場合は以下(nativeなライブラリを使うので-devパッケージをインストール) 。  
rbenvの場合は[rbenvのインストール]({{ site.baseurl }}/2019/07/07/rbenv.html)参照。

```bash
sudo apt install ruby-dev
```

bundlerをインストールする。bundlerはNode.jsでいうところのnpmのうち、package.jsonでローカルインストールしたモジュールを管理する部分に相当するもの（かな？）。  
aptでrubyをインストールした場合はrootでインストール必要があるので、`sudo`を付けて実行。

```bash
gem install bundler
```

## 準備

このページの一番下の中央にある、「 maintained by ippei8jp/memoBlog」のリンクからリポジトリをクローンする。一から環境を整えるのは面倒なので、今ある環境をコピって変更するのが簡単。

必要なモジュールをインストールする。
```bash
bundle install
```

モジュールをローカルにインストールすることもできる。  
その場合は以下で。  
--pathオプションのパラメータはお好みで変更してちょ。

```bash
bundle install --path gems
```

このとき、`_config.yml`の以下の部分にモジュールのインストール先(上の例では`gems`)を追加しておく(追加しないとjekyll実行時にエラーになる)。

```
exclude: [server.sh, Gemfile, Gemfile.lock]
```
            ↓
```
exclude: [gems, server.sh, Gemfile, Gemfile.lock]
```

# 実行

## サーバ起動

とりあえずそのままサーバを起動してみる。

```bash
./server.sh
```

## ブラウザ接続

ブラウザ(firefoxとchromeで動作確認した。IEでは動かない。Edgeはよーわからん)を起動し、サーバを起動しているマシンのport 4000に接続。このとき、ブラウザはサーバと同じマシンである必要はない。

## サーバの停止

CTRL+cで停止。

## サーバの listen port の変更

必要ならサーバの listen port を変更できる。  
server.sh 内のコマンドの `--port` オプションを変更すればOK.  


# ディレクトリ構成

ディレクトリ構成は以下の通り。  

```
.
├── _config.yml                             jekyllの設定ファイル
├── Gemfile                                 bundlerの管理ファイル
├── _layouts                                ページレイアウト用HTMLファイル置き場
│   ├── default.html                           デフォルト使用
│   ├── toppage.html                           トップページ用
│   └── debug.html                             デバッグページ用
│                                                 どのレイアウトを使うかは各MarkdownファイルのFront-matterで指定する
├── _includes                               共通で使用するレイアウトはここに置いておく
│   └── footer.html
├── _posts                                   投稿記事置き場
│   ├── 2019-06-22-asyncawait.md
│   ├── ・・・・
│   └── YYYY-MM-DD-title.md                     ブログの投稿記事  ファイル名は年-月-日-タイトル とする。
├── _sass                                    sassのインクルードファイルを置いておく
│   └── _my_theme.scss                          大本のテーマ設定用sassファイル
├── assets
│   ├── css
│   │   ├── jquery.floatingscroll.css      jQuery の floatingscroll プラグインのCSSファイル
│   │   └── style.scss                     このページのメインのcssになるsassファイル
│   └── js
│       ├── jquery.floatingscroll.min.js    jQuery の floatingscroll プラグインのスクリプトファイル
│       └── main.js                         各ページで実行するjavascriptファイル
├── index.md                                 トップページ
├── misc                                     以下にその他のページデータを置く
│   ├── debug.md
│   └── sample.md
├── favicon.ico                              favicon画像
├── compile.sh                               サイト構築のみ行うスクリプト
├── server.sh                                サーバ起動用スクリプト(サイト構築も同時に行う)
└── _site                                    以下にサイト構築データが生成される
```

# 投稿記事のファイル名

投稿記事のファイル名は`YYYY-MM-DD-title.拡張子`とする。  
それ以外のファイル名を付けると無視される。

日付、タイトルは後述のFrontMatterに設定があればそちらが優先される。

# Front Matterの構成

Front Matterの主な項目は以下の通り。

```
---
title: XXXX                タイトル  指定無ければファイル名のタイトル部分が使用される
date: 2019-07-07           日付 指定無ければファイル名の日付部分が使用される
tags: ["YYY","ZZZ"]        タグを指定  このタグでトップページでカテゴリを選択できる 大文字/小文字は区別される
layout: toppage            使用するレイアウト 指定無ければdefaultが使用される
excerpt: xxxxxx            抜粋  トップページのタイトルの下に表示される
---
```

# あとはお好きに変更してちょ

自分のリポジトリにpushして、そのリポジトリの設定でgithub pagesを有効にすればいっちょ上がり。

ちなみに、ファイルが一つもないリポジトリではgithub pagesを有効にできないので、ダミーでもいいからファイルをpushしてから設定すること。


