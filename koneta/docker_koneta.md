---
title: Docker 小ネタ集
date: 2021-10-16
tags: ["Docker"]
excerpt: Dockerの小ネタ集
---

Dockerコンテナを開発環境として使用する場合にイメージ作成時に設定しておくと便利なことなど。  

以下、特に断りのない限りベースイメージはubuntu。  
おそらくdebianでも同じだと思う。  

# sudo を使えるようにする  

Dockefileに以下を記述  
```bash
RUN apt update && apt -y install sudo \
    && echo «ユーザ名» ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/«ユーザ名» \
    && chmod 0440 /etc/sudoers.d/«ユーザ名»
```
>[!NOTE] 
> exec時に--userオプション付けてrootで入ればいいんだけどね。  
> 逐一別ウィンドウでexecするのは面倒なので。  
> あと、sudoをパスワードなしで実行できるようにしておかないと悲しいことになるので注意。  

# bashの補完機能を有効にする  

Dockefileに以下を記述  
```bash
RUN apt update && apt install bash-completion \
    && echo ". /usr/share/bash-completion/bash_completion" >> /etc/bash.bashrc
```

# コマンドヒストリのサーチ機能を^p/^nにマッピングする  

Dockefileに以下を記述  
(リダイレクト先はユーザのホームディレクトリの.bashrcでも可)  
```bash
RUN echo -e "\
bind '\"\C-n\": history-search-forward' \n\
bind '\"\C-p\": history-search-backward'\n\
">> /etc/bash.bashrc
```

このままだと、^pを2回押さないと順方向サーチができないので  
ホストの .docker/config.json に以下を記載しておく。  
```
{
    "detachKeys": "ctrl-\\"
}
```
>[!NOTE]
> コンテナからのデタッチキーが``^\``に変更される。  
> 詳細は「Docker detachKeys」で検索。  


# 日本語を文字化けしないようにする  

Dockefileに以下を記述  
```bash
RUN echo -e "\
export LANG=C.UTF-8
export LANGUAGE=en_US:
">> /etc/bash.bashrc
```
>[!NOTE]
> LANG=ja_JP.UTF-8 だとダメ。

# Dockerコンテナ内にpingがなかったら

コンテナ作成後に気が付いたら、以下でping他をインストールする。  
```bash
apt update
apt install iputils-ping  net-tools
```
