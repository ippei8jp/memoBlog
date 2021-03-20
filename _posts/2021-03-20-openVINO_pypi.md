---
title: PyPiからopenVINOをインストール
date: 2021-03-20
tags: ["DeepLearning", "openVINO", "Ubuntu", "WSL"]
excerpt: PyPiで配布されているopenVINOをインストールしたときのメモ
layout: default
---

# 概要

openVINOを使いたいが、SDKをインストールするのは面倒というズボラさんのためのTips😅  
NCS2を使うためのドライバをインストールするにはSDK必要だが(WSLだとそもそもNCS2は使えないけど)、CPUだけでさくっと使いたいときなんかは有効かな？  
あと、SDKインストール済みだけど、別のバージョン試したいときとか。  

対象はWindwos(試してないけど)、Ubuntu(x86_64 の 18.04、20.04)。(macOSも対象らしいけど使ったことないのでよーわからん😅)  
Python は3.6、3.7、3.8  
RasoberryPiは現在のところ対象外。  

# PyPiのページ

PyPiは以下にページがある。  
- [openvino · PyPI](https://pypi.org/project/openvino/){:target="_blank"}

ただし、現状はUbuntuでPython3.8を使用する場合は以下を使用(Ubuntu Python3.7は両方用意されているらしい)。  
- [openvino-ubuntu20 · PyPI](https://pypi.org/project/openvino-ubuntu20/){:target="_blank"}


# pythonモジュールのインストール
上記ページに記載された通りだが、大抵openCVも必要になるので、インストールしておく。   
最近はopenCVも``pip``コマンドイッパツでインストールできるのでラクチン😊  

```bash
# openVINOのインストール
pip install openvino
# またはこちら
# pip install openvino-ubuntu20

# openCVのインストール
pip install opencv-python
```

インストールすると、現状、以下のモジュールがインストールされる(ubuntuでpython3.7/3.8の場合)  

```
numpy==1.20.1
opencv-python==4.5.1.48
openvino==2021.2
tbb==2020.3.254
```

# 実行前の準備

openVINOモジュールは``LD_LIBRARY_PATH``の設定が必要なので、
システムのpythonを使用するときは上記ページに記載された通りに``LD_LIBRARY_PATH``を設定する。  
ただし、pyenvを使用している場合は、以下のように設定する。  

```bash
export LD_LIBRARY_PATH=${LD_LIBRARY_PATH}:${PYENV_ROOT}/versions/`pyenv version-name`/lib
```

pyenvで環境を切り替えることを考えると、``.bashrc``で設定するより、スクリプト実行ラッパで設定した方が無難かも。  



