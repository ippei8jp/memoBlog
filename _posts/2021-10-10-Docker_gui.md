---
title: DockerコンテナからGUIを起動する
date: 2021-10-10
tags: ["Docker", "Windows", "Ubuntu"]
excerpt: Windos/Ubuntu の DockerコンテナからGUIを起動する
---

# Ubuntuでローカルのデスクトップに表示する場合
Docker(ubuntu)のみ。  
コンテナ生成時に以下のように``DISPLAY``変数の設定と``/tmp/.X11-unix/``のマウントを行う。  
```bash
docker create -it \
    --name py_test3 \
    -e DISPLAY=$DISPLAY \
    -v /tmp/.X11-unix/:/tmp/.X11-unix/ \
    -v $PWD:/work \
    python:3.8-buster \
    /bin/bash
```
この場合、表示する前にホスト側で以下を実行しておく必要がある。
```bash
xhost +local:
```
実行していない場合、GUI起動コマンド実行で以下のエラーが出る。  
```
No protocol specified
Error: Can't open display: XXX
```

Ubuntuを再起動したときに設定は忘れられてしまうので、起動の度に実行必要。

>[!NOTE]
> xhostはセキュリティ上問題があるとのことだが、家の中だけだし、localだけなら許可してもいいかな...
> rc.localあたりに書いとこうかと思ったけど、使用するときだけ実行するのが無難かな。


# Windows上のVcXsrvに表示する場合
Docker(windows)だとコレ一択。  
Docker(ubuntu)でも大丈夫。  
なので、Docker(ubuntu)にリモート接続で使用することがある場合はこっちを使っておくのが良いと思う。  
WindowsマシンのIPアドレスが192.168.XXX.XXX(マシン名指定不可)だとして  
```bash
docker create -it \
    --name py_test4 \
    -v $PWD:/work \
    -e DISPLAY=192.168.XXX.XXX:0.0 \
    python:3.8-buster \
    /bin/bash
```



