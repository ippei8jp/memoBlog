---
title: VSCodeでDocker内のpythonプログラムをデバッグする
date: 2021-10-08
tags: ["VSCode", "Docker", "Windows", "Ubuntu"]
excerpt: VSCodeでDocker内のpythonプログラムをデバッグする(Windos/Ubuntu)
---

# 概要
Windows上のVSCodeからWindows上のDockerで動作しているコンテナ内のpythonプログラムをデバッグする方法。  
ubuntu上のVSCodeからubuntu上のDockerで動作しているコンテナ内のpythonプログラムをデバッグする方法。  
どちらもほぼ同じ手順でデバッグできる。  

# 準備
VScodeに拡張機能Python、Docker、Remote Containers をインストールしておく  

# コンテナ起動
ターミナルからコンテナ起動する  
ソースの編集をしやすいように、ホストのフォルダを``/work``に割り当てている。  
いや、VSCodeで編集すれば問題ないんだけどさ...  
いつも編集は別のエディタ使ってたりするとコンテナ内のファイルいじるのが面倒なので...  


{% include filename.html filename="Windows" %}
```bash
docker run -it --name py_test2 -v /m/work/zzz:/work python:3.8-buster /bin/bash
```

{% include filename.html filename="ubuntu" %}
```bash
docker run -it --name py_test2 -v `realpath .`:/work python:3.8-buster /bin/bash
```

>[!NOTE]
> コンテナを一度作成してあれば起動していなくても大丈夫らしい。

# コンテナに接続
VScodeのリモートエクスプローラにコンテナが見える  
>[!NOTE]
>Remote SSHやRemote WSLがインストールされている場合はリモートエクスプローラ上部のドロップダウンリストからContainersを選択  

対象のコンテナを右クリックして``Attach to Container`` または``Attach in New Window``をクリック  
``Attaching to a container may execute arbitrary code``  
と言われるたら、変なコードが実行されないことが分かっていれば ``Got it`` をクリック  
>[!NOTE]
> 一度開いたフォルダはその下にショートカットが表示されているので、そこから開けば手っ取り早い。  

コンテナが開く  

コンテナ内には拡張機能が入ってないので、必要な拡張機能をインストールする  

# デバッグ
エクスプローラでデバッグしたいフォルダを開いてソースを開く(VSCodeの設定によっては前回開いていたフォルダが開かれる)  
表示→コマンドパレットで``Python: Select Interpreter`` で 使用するpythonを選択する。  
このとき、必ずしも使用するpythonのpathが表示されているとは限らないので、  
(逆にコンテナ内にないホスト側のものが表示されたりする😢)  
表示されていない場合は``+ Enter Interpreter path...``から使用するpythonを選択する。  
上記イメージの場合、``/usr/local/bin/python3`` なので、これを設定。  
>[!NOTE]
> あらかじめコンソールで which python3 して調べておく  

あとはローカルと同じようにデバッグできる。  

# コンテナとの接続終了

コンテナとの接続を終了するときは  
表示→コマンドパレットで``Remote: Close Remote Connection`` で終了する。

接続終了してもコンテナを停止しないので、別途停止処理を行う。
```bash
docker stop py_test2
```

# おまけ
こういうのもある。  
(参照しているのはmicrosoft純正のサンプルらしい)  
普通にDocker使うのと異なるファイル``devcontainer.json``を使うので、
便利なんだか不便なんだか...  
Docker拡張機能なくても動かせた気がする。  
<https://python.kirikutitarou.com/2019/07/vs-code-docker-remote-container.html>

