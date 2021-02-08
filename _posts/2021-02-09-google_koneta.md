---
title: Google 小ネタ集
date: 2021-02-09
tags: ["Google"]
excerpt: Googleの小ネタ集
layout: default
---

# Googleドライブ上のファイルを直接ダウンロードする

スクリプト上でgoogleドライブの共有ファイルをwget(やcurl)で取得する方法  
共有リンクをwgetにそのまま渡すとヘッダとか色々くっついて保存されてしまうので。  

- ファイルIDの取得
> googleドライブ上の共有したいファイルを右クリック→共有可能なリンクを取得  
> クリップボードに 以下のリンクが保存される  
> ``https://drive.google.com/open?id=ほげほげ ``  
> または共有設定で以下のリンクが取得できる  
> ``https://drive.google.com/file/d/ほげほげ/view?usp=sharing``  
> この「ほげほげ」の部分がファイルのIDを示している。上記2つの「ほげほげ」は同一のハズ。

- ファイルの取得
> 以下のコマンドで取得できる  
> ``wget "https://drive.google.com/uc?export=download&id=ほげほげ" -O 保存ファイル名``

