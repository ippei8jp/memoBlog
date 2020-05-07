---
title: github pagesのWindows環境での実行
date: 2019-07-26
tags: ["Windows","Ruby","github"]
excerpt: github pagesをWindows環境で実行する手順のメモ
---

github pagesの動作を確認するため、ローカル環境で実行できるようにした([参照]({{ site.baseurl }}/2019/07/17/githubpages.html))が、
わざわざUbuntu立ち上げるのが面倒になってきたので、Windows上で実行できるようにしてみた。  

# 何はともあれRubyのインストール
Windows版Rubyをインストールしないとはじまらないので、
[Rubyの総本山](https://www.ruby-lang.org/ja/) から(RubyInstaller のダウンロード](https://rubyinstaller.org/downloads/)
へ行ってダウンロード。  
WITH DEVKIT を選んでおく方が良いらしい。  
バージョンは最新で良いでしょう(私は Ruby+Devkit 2.6.3-1 (x64) を選びました)。  

ダウンロードしたらなんとなーくインストーラ実行して案内にしたがってなんとな～く進んでちょ。  

> [!NOTE]
> gccも要るのかな？Rubyインストール時にMSYS64環境がインストールされるみたいなので、大丈夫かな？  
> ちなみに、うちの環境はmingw-w64が入ってる。  

とりあえずbundlerはグローバルに入れとく。
```
gem install bundler
```



## 準備

このページの一番下の中央にある、「 maintained by ippei8jp/memoBlog」のリンクからリポジトリをクローンする。  
一から環境を整えるのは面倒なので、今ある環境をコピって変更するのが簡単。  

必要なモジュールをローカルにインストールする。  
Ubuntuみたいにrdenv環境じゃないので、グローバル環境はなるべく汚染したくないので、`--path`指定してローカルにインストールする。  

```
bundle install --path gems
```

あるいは、`install.cmd`に登録してあるので、そっちを実行しても可。

>[!NOTE]
> Rubyのバージョンを変更したり、ディレクトリを移動した場合はgemsディレクトリを削除してから
```
bundle install --path gems
```
>を実行する

windows対応にあたって、リポジトリの _config.yml と .gitignore は対処済み。

## 実行

サーバ起動

とりあえずそのままサーバを起動してみる。

```
.\server.cmd
```

もちろん、エクスプローラなどから ```server.cmd``` をダブルクリックして実行しても可。  

> [!NOTE]
> このときのキモ、jekyll実行前に以下を実行してRubyのエンコードをUTF-8に設定している。  
> ```
> set RUBYOPT=--encoding=UTF-8`  
> ```
> これがないとエンコードエラーが発生する。  
> 環境変数で設定しておけば逐一設定しなくても良いが、どうせcmdファイル書いてあるので、ついでに設定している。

firewallが警告を表示するので、許可してちょ。  
まごまごしてるとjekyllがエラー終了しちゃうけど、その後でも許可してしまえば次回からは大丈夫。  

## ブラウザ接続

以降は[こっち]({{ site.baseurl }}/2019/07/17/githubpages.html)を見てちょ。  

