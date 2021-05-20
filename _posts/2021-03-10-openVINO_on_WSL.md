---
title: Ubuntu20.04 on WSL2 で openVINO
date: 2021-03-10
tags: ["DeepLearning", "openVINO", "Ubuntu", "WSL"]
excerpt: WSL2上のUbuntu20.04でopenVINOをインストールしたときのメモ
layout: default
---

# 環境構築

WSL環境ではNCS2は使えないが、CPU演算での実行は可能。  
以下インストール～デモ実行までのメモ。  

基本は以下を参考に。  
- [openVINO フルパッケージをubuntuにインストール(改訂版)]({{ site.baseurl }}/2020/06/16/openVINO_ubuntu_2.html)  
- [openVINO フルパッケージ(2021.1)をインストール(追加)]({{ site.baseurl }}/2020/10/18/openVINO_ubuntu_3.html)  

WSLのインストールメモはこちら：[WSL2 メモ]({{ site.baseurl }}/2021/03/03/WSL_memo.html)  
Ubuntuは20.04。  
今回はopenVINO 2021.2を使用した。  

## pyenvの仮想環境を作成
まずは、pythonの環境を準備。  
以下ではpythonは3.7.10を使用。(3.8を使えばTensorflow2を使えるらしい(?))  
```bash
pyenv virtualenv 3.7.10 openVINO
pyenv local openVINO 
pip install --upgrade pip setuptools
```

## 必要なパッケージのインストール

ubuntuのライブラリ類をインストール

```bash
sudo apt install cmake
sudo apt install libcairo2-dev libpango1.0-dev libglib2.0-dev libgtk2.0-dev libswscale-dev libavcodec-dev libavformat-dev 
# 他にもあるかもしれんけど、とりあえずこれだけ。
```

WSLでは以下も必要(グラフィック系処理が入ってないので)。    
```bash
sudo apt install libgtk-3-0
```
## ダウンロードしたopenVINOアーカイブの展開とインストール

``/mnt/f/Download/``にダウンロードしたファイルがあるとして。  
```bash
cd /work/
tar xzvf /mnt/f/Download/l_openvino_toolkit_p_2021.2.185.tgz 
cd l_openvino_toolkit_p_2021.2.185/
sudo -E ./install_GUI.sh 
# なぜかXwindow設定しててもテキストベースになる...
# てきとーに答えていく。
```

スクリプト終了したら、以下に従い進めていく。  
<https://docs.openvinotoolkit.org/latest/openvino_docs_install_guides_installing_openvino_linux.html>

## 後半のコマンド一覧と注意事項

- 環境変数の設定とpythonモジュールのインストール  

```bash
# このコマンド、~/.bashrcにも書いておくこと
source /opt/intel/openvino_2021/bin/setupvars.sh

# このコマンド実行すると、pyenvでなくsystemのpipでモジュールがインストールされるので実行しない
# しかも、systemのpip3が壊れる...すごい罠😡
# cd /opt/intel/openvino_2021/deployment_tools/model_optimizer/install_prerequisites/
# sudo -E ./install_prerequisites.sh 

# 代わりに以下を実行(上記スクリプトは結局これを実行しているだけなので)
pip install -r /opt/intel/openvino_2021/deployment_tools/model_optimizer/requirements.txt 
```

>[!NOTE]
> python 3.7で実行すると、  
> ```bash
> Ignoring tensorflow: markers 'python_version >= "3.8"' don't match your environment
> ```
> と言われるけど、無視して良い。  
> これはPython3.8未満か以上で異なるバージョンのTensorflowがインストールされるように設定されているため。  
> ちなみに、python 3.8でやると  
> ```bash
> Ignoring tensorflow: markers 'python_version < "3.8"' don't match your environment
> ```
> と言われる。  

>[!NOTE]
> もし、``install_prerequisites.sh``を実行してしまい、pip3が壊れてしまった場合は
> 以下で復旧する(一旦アンインストールしてから再インストール)。  
> ```bash
> sudo apt remove python3-pip 
> sudo apt install python3-pip 
> ```

## デモ実行
```bash
mkdir -p /work/tmp
cd /opt/intel/openvino_2021/deployment_tools/demo
sudo cp /work/.python-version .

pip install -r /opt/intel/openvino_2021/deployment_tools/open_model_zoo/tools/downloader/requirements.in

./demo_squeezenet_download_convert_run.sh 2>&1 | tee /work/tmp/demo1.log

# このデモはグラフィック表示可能環境で実行する必要がある。  
./demo_security_barrier_camera.sh 2>&1 | tee /work/tmp/dem2.log
```

# 別の仮想環境を用意する場合

別の仮想環境を用意するときは以下で新しい仮想環境下にモジュールをインストールする
```bash
pip install -r /opt/intel/openvino_2021/deployment_tools/model_optimizer/requirements.txt
pip install -r /opt/intel/openvino_2021/deployment_tools/open_model_zoo/tools/downloader/requirements.in
```
