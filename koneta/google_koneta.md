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

## ファイルIDの取得
以下のいずれかの手順でファイルIDを取得する  
この「ほげほげ」の部分がファイルIDを示している。下記2つの「ほげほげ」は同一のハズ。

> googleドライブ上の共有したいファイルを右クリック→共有可能なリンクを取得  
> クリップボードに 以下のリンクが保存される  
> ``https://drive.google.com/open?id=ほげほげ ``  


> 共有設定で以下のリンクが取得できる  
> ``https://drive.google.com/file/d/ほげほげ/view?usp=sharing``  

## ファイルのダウンロード
以下のコマンドで取得できる。  
FILE_IDとFILE_OUTは1回しか使わないから、コマンドに直接書けばいいんだけど、下のとの整合のために使っておく。  
```bash
FILE_ID=ほげほげ
FILE_OUT=保存ファイル名
wget "https://drive.google.com/uc?export=download&id=${FILE_ID}" -O ${FILE_OUT}
unset FILE_ID
unset FILE_OUT
```
## 大きなファイルのダウンロード
大きなファイルの場合、上記の方法でダウンロードしようとすると「ウィルススャンできんけどダウンロードする？」なページが取得されてしまう。  
で、以下のコマンドで取得する。  
```bash
FILE_ID=ほげほげ
FILE_OUT=保存ファイル名
wget --load-cookies /tmp/cookies.txt "https://drive.google.com/uc?export=download&confirm=$(wget --quiet --save-cookies /tmp/cookies.txt --keep-session-cookies --no-check-certificate "https://drive.google.com/uc?export=download&id=${FILE_ID}" -O - | sed -rn 's/.*confirm=([0-9A-Za-z_]+).*/\1\n/p')&id=${FILE_ID}" -O ${FILE_OUT} && rm -rf /tmp/cookies.txt
unset FILE_ID
unset FILE_OUT
```
>[!NOTE]
> $()の内側のwgetで一度ダウンロード要求を送って、「ウィルススャンできんけどダウンロードする？」なページを取得。  
> このときのcookieを保存しておく(--save-cookies オプション)。  
> 取得したページの実際のファイルのダウンロードへのリンク部分から「confirm=XXXX」の部分を取り出し。  
> で、その時のcookieとXXXXの部分を使用して外側のwgetでファイルを取得する。  
> 最後に不要になったcookie保存ファイルを削除。  
