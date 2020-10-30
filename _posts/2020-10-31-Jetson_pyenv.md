---
title: Jetson nano に pyenv をインストールする
date: 2020-10-31
tags: ["DeepLearning", "Jetson nano", "python"]
excerpt: Jetson nano に pyenvをインストールする
---

# 概要
systemのpythonを使うのはちょっと嫌なので、仮想環境を使えるようにしておく。  
``venv``でもいいけど、やっぱり使い慣れた``pyenv``＋``vertualenv``で。  
基本的に[pyenvのインストール]({{ site.baseurl }}/2019/06/27/pyenv.html)と同じだけど、  
Jetpackでインストール済みで、``pip``でインストールできないパッケージがあるなど、  
Jetson nano 固有の設定等があるので、メモ。  

# 手順(再掲を含む)

## pyenvをインストールする
- 必要なパッケージのインストール
```bash
sudo apt install -y make build-essential libssl-dev zlib1g-dev libbz2-dev \
libreadline-dev libsqlite3-dev wget curl llvm libncurses5-dev libncursesw5-dev \
xz-utils tk-dev libffi-dev liblzma-dev python-openssl git
```
- pyenvとプラグインをダウンロード
```bash
export PYENV_ROOT=/proj/.pyenv    #環境に合わせて修正してね
git clone https://github.com/yyuu/pyenv.git            ${PYENV_ROOT}
git clone https://github.com/yyuu/pyenv-virtualenv.git ${PYENV_ROOT}/plugins/pyenv-virtualenv
git clone git://github.com/pyenv/pyenv-update.git      ${PYENV_ROOT}/plugins/pyenv-update
```
- pyenv環境からJetpackでインストール済みのパッケージを参照できるようにしておく。  
(pipでインストールできないみたいなので、お手軽な方法で解決)
```bash
mkdir ${PYENV_ROOT}/jetson_pythonlib
ln -s /usr/lib/python3.6/dist-packages/cv2          ${PYENV_ROOT}/jetson_pythonlib/
ln -s /usr/lib/python3.6/dist-packages/graphsurgeon ${PYENV_ROOT}/jetson_pythonlib/
ln -s /usr/lib/python3.6/dist-packages/tensorrt     ${PYENV_ROOT}/jetson_pythonlib/
ln -s /usr/lib/python3.6/dist-packages/uff          ${PYENV_ROOT}/jetson_pythonlib/
```
- ``~/.bashrc``の修正  
以下を追加しておく  
```bash
# pyenv 設定
export PYENV_ROOT=/proj/.pyenv
export PATH=$PYENV_ROOT/bin:$PATH
eval "$(pyenv init -)"
eval "$(pyenv virtualenv-init -)"
export PYTHON_CONFIGURE_OPTS="\
 --enable-shared\
"
#jetson専用のインストール済みパッケージをコピっておく
export PYTHONPATH="${PYENV_ROOT}/jetson_pythonlib:$PYTHONPATH"
```

- ターミナル開きなおし or ``~/.bashrc``を再読み込み  

## ベースとなるpythonのインストール  
バージョンは3.6.xでないとダメっぽい  

## python のインストール
```bash
pyenv install 3.6.12
pyenv global 3.6.12
```
pip と setuptools のアップデート
```bash
pip install --upgrade pip setuptools
```
## その他
wheelが入ってると仮想環境を変えて同じモジュールをインストールするときに早いので、  
インストールしておきたいが、各仮想環境に逐一インストールするのも面倒なので  
共通に参照できるディレクトリにインストールしておく。
```bash
pip install wheel -t ${PYENV_ROOT}/jetson_pythonlib/
```








