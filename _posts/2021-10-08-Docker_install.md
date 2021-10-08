---
title: Dockerをインストールする
date: 2021-10-08
tags: ["Docker", "Windows", "Ubuntu"]
excerpt: Windos/Ubuntu に Dockerをインストールする
---

# Windows10 Home に Dockerをインストールする
HomeだとWSL2必須なので、WSL2はあらかじめインストールして使用できるようにしておく。  
[WSL2 メモ]({{ site.baseurl }}/2021/03/03/WSL_memo.html){:target="_blank"}   

 <https://docs.docker.jp/docker-for-windows/install-windows-home.html>{:target="_blank"} を参考にインストールする。   
とはいっても、<https://hub.docker.com/editions/community/docker-ce-desktop-windows/>{:target="_blank"}からダウンロードして実行するだけ。  


コンテナを一杯作るとデータ領域がどんどん肥大していくので、Cドライブから変更しておいた方が良いかも。  
[Docker Desktop の ディスク領域 を Cドライブから別のドライブへ移動する方法](https://nosubject.io/windowsdocker-desktop-move-disk-image/){:target="_blank"}  
を参考に作業すればOK。  
VHDをエクスポート、元の仮想マシンのレジストリを削除、他の場所へ同名でインポート、とやってる。  


# Ubuntu に Dockerをインストールする
 <https://docs.docker.jp/linux/step_one.html>{:target="_blank"} を参考にインストールする。   
実際は以下を実行するだけ。  
```bash
curl -fsSL https://get.docker.com/ | sh
```

docker実行に逐一``sudo``をつけるのは面倒なので、以下の設定をしておく。  
```bash
sudo gpasswd -a $USER docker
```
設定後は念のためリブートしておく(logoutだけで可らしいけど)。  


# インストール後のお試し実行
正常に動いていることを確認するためになんか動かしてみる。  
以下はWindows版で書かれているが、基本的にUbuntuでも同じ。  
<https://qiita.com/nanaki11/items/97e5685ed84547526be2>{:target="_blank"}  

``docker pull``はしなくても``docker run``したときにロ^カルにimegeがなければ自動でダウンロードしてくれるらしい。  



# コマンド例
ちょろっと試したコマンド群
## コンテナの起動
```bash
docker run -it --name py_test python:3.8-buster /bin/bash
```

## n:\work を /work にマウントする場合(Windows)
```bash
docker run -it --name py_test2 -v /n/work:/work python:3.8-buster /bin/bash
```

## 終了したコンテナの再開

```bash
docker start -ia py_test
```

## コンテナに新たなコンソール接続
```bash
docker exec -it py_test /bin/bash
```

## コンテナ一覧(起動中のもののみ)
```bash
docker ps -a
```
## コンテナ一覧(終了したものを含む)
```bash
docker ps -a
```

## pull済みイメージ一覧
```bash
docker images
```

# どんなイメージがあるのか？
[dockerhub](https://hub.docker.com/search?type=image){:target="_blank"}でサーチしてちょ。  

# DockerはWSL2でどんな感じで動いているのか?
あんまり意味ないけど。  
<https://www.docker.com/blog/new-docker-desktop-wsl2-backend/>{:target="_blank"}  