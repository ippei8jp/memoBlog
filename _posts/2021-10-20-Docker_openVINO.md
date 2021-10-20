---
title: DockerでopenVINO
date: 2021-10-20
tags: ["Docker", "Windows", "Ubuntu", "openVINO"]
excerpt: DockerでopenVINOプログラムの開発
---

# 概要
DockerコンテナでopenVINOのプログラム開発を行う手順。  
↓ここを参考にUbuntu 20.04/openVINO 2021.3に変更してみる。ついでによく使う機能の準備もやっておく。  
<https://kuttsun.blogspot.com/2021/06/openvino-docker.html>  

# Dockerイメージの作成

上の参照先を参考に公式イメージに必要な処理を加えておく。  
Dockerfile は以下。  
参照先からの変更内容は以下の通り。  
- ベースをopenVINO/ubuntu20に変更  
- sudoとvimとless入れとく。sudoはパスワードなしで動作するようにしとく。  
- 開発マシンなのでbaskhの補完機能を有効にしておく  
- キーバインド変更 ( ``^p`` / ``^n`` )  
- 日本語文字化け対策  
- ``install_openvino_dependencies.sh`` がキー入力待ちになってbuildエラーになるので``-y``オプションを追加

{% include filename.html filename="Dockerfile" %}
```docker
# ベースイメージ
FROM openvino/ubuntu20_dev:2021.3

USER root

ENV DEBIAN_FRONTEND=noninteractive

# sudo と vim と less のインストール
RUN apt update && apt -y install sudo vim less \
    && echo openvino ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/openvino \
    && chmod 0440 /etc/sudoers.d/openvino

# bashの補完機能 & キーバインドの設定 & 日本語文字化け対策
RUN apt update && apt install bash-completion \
    && echo ". /usr/share/bash-completion/bash_completion" >> /etc/bash.bashrc \
    && echo -e "\
bind '\"\C-n\": history-search-forward' \n\
bind '\"\C-p\": history-search-backward'\n\
">> /etc/bash.bashrc \
    && echo -e "\
export LANG=C.UTF-8\n\
export LANGUAGE=en_US:\n\
">> /etc/bash.bashrc

# 依存パッケージのインストール(-yオプションで Yes自動選択)
RUN cd /opt/intel/openvino/install_dependencies && ./install_openvino_dependencies.sh -y

# サンプル、デモアプリのビルド
RUN cd /opt/intel/openvino/inference_engine/samples/cpp && ./build_samples.sh
RUN cd /opt/intel/openvino/inference_engine/demos && ./build_demos.sh
# /opt/intel/openvino_2021/deployment_tools/demo にデモアプリがある

# 他に必要なものを適宜インストール
RUN apt update && apt -y install wget git python3-pip
RUN pip3 install onnxruntime flask

# aptのクリア
RUN apt clean && rm -rf /var/lib/apt/lists/*

USER openvino

# bash起動
CMD [ "/bin/bash" ]
```

# ビルド
```bash
docker build -t myopenvino/ubuntu20_dev:2021.3 .
```

# コンテナの生成  
参照先からの変更内容は以下の通り。  
- カレントディレクトリ下のworkを/workに割り当てるように追加  
- GPU関連の設定を削除  

```bash
mkdir -p ./work
docker create -it \
       --name openvino_2021.3 \
       -e DISPLAY=${DISPLAY} \
       -v /tmp/.X11-unix/:/tmp/.X11-unix/ \
       -v /dev/bus/usb:/dev/bus/usb \
       --device-cgroup-rule='c 189:* rmw' \
       -v $PWD/work:/work \
       myopenvino/ubuntu20_dev:2021.3
```
>[!NOTE]
> X-Windowの表示先(``DISPLAY `` 変数) は ここで固定されるので、  
> 実行時に``DISPLAY ``変数を変更したい場合は  
> コンテナをスタートした後、コンテナ内で手打ちで設定するか、  
> 変更後の``DISPLAY``変数を設定したターミナルから以下を実行。  
> ```bash
> docker exec -it -e DISPLAY=$DISPLAY openvino_2021.3 /bin/bash
> ```

Windows の場合は以下な感じ。  
DISPLAY変数は環境に合わせて変更してちょ。  
NCS周りの設定は削除してある。  
```bash
docker create -it --name openvino_2021.3 -e DISPLAY=192.168.78.204:0.0 -v %CD%\work:/work myopenvino/ubuntu20_dev:2021.3
```
>[!TIP]
> docker をWSL上のコマンドラインから起動しているときは``%CD%``でなく``$PWD``  
> PowerShellでコマンドを複数行に分割する場合は、行末記号は``\`` ではなく `` ` ``  
> コマンドプロンプトでは``^`` NYAGOSは分からん😢  
> それぞれ違ってびみょーにストレス...  


# 実行

```bash
docker start -ia openvino_2021.3
```

コンテナ内でデモを動かしてみる  
(デモの実行で必要なライブラリ類がインストールされたりするので、実行しましょう)   
```bash
mkdir -p ~/tmp
cd /opt/intel/openvino/deployment_tools/demo

./demo_squeezenet_download_convert_run.sh 2>&1 | tee ~/tmp/demo1.log

./demo_security_barrier_camera.sh 2>&1 | tee ~/tmp/dem2.log
```

前に作ったプログラムを試してみる

```bash
cd /work/
git clone https://github.com/ippei8jp/ov_trial.git
# 入力画像の準備
cd ov_trial/images/
bash download.sh
# モデルファイルの準備(mobilenet-ssdのダウンロードがエラーになるけど大勢に影響ない) 
cd ../convert_model_ssd/
bash convert_model_ssd.sh 

# 認識してみる
cd ../ssd/
bash test.sh list
bash test.sh 6
```

# NCS2の使用(ubuntuのみ)
ubuntuではホストに接続したNCS2を使用することもできる。  
ただし、DockerコンテナからNCS2を使用するにはDokerホスト側にドライバをインストールしておく必要がある。  
(udevルールだけ？イマイチ自信ないのでフルパッケージでインストールしておいた)  
以下の部分がNCS2を使用するために必要な設定。(上記コマンド例では設定済み)  
```bash
       -v /dev/bus/usb:/dev/bus/usb \
       --device-cgroup-rule='c 189:* rmw' \
```

