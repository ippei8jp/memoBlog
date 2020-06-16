---
title: openVINO フルパッケージをubuntuにインストール(改訂版)
date: 2020-06-16
tags: ["DeepLearning", "openVINO", "NCStick2", "Ubuntu"]
excerpt: openVINO フルパッケージをubuntuにインストールする(Ver.2020.3対応)
---



以前、[openVINO フルパッケージをubuntuにインストール](https://ippei8jp.github.io/memoBlog/2019/10/17/openVINO_ubuntu.html)で
ubuntuへのインストール手順を書いたが、今読み返すと結構分かりにくかったので改訂版を書いとく。  
今回はNCS2をubuntuで使えるようにしたので、その手順も追加。  
ついでに、今日(2020/06/16)現在の最新版Ver.2020.3での手順確認したので、反映しておく。  

使用したubuntuのバージョンは18.04。  

参考 ：[AIを始めよう！OpenVINOのインストールからデモの実行まで［R4対応］](https://qiita.com/ammo0613/items/a9bb3b7f20dc02a8d758)

# ソフトウェアのダウンロード
## Intelへの登録
何やら登録しないとダウンロードさせてくれないらしい。  
- [Choose & Download Intel® Distribution of OpenVINO™ Toolkit](https://software.intel.com/content/www/us/en/develop/tools/openvino-toolkit/choose-download.html)   
  Linux* (supports Ubuntu, CentOS, and Yocto Project)を選択  
  - [Free Download](https://software.intel.com/content/www/us/en/develop/tools/openvino-toolkit/choose-download/linux.html)    
    <span style="border: 1px solid;">Register & Download</span>をクリック
    - [Choose & Download Intel® Distribution of OpenVINO™ Toolkit](https://software.seek.intel.com/openvino-toolkit?os=linux)  
      必要事項を記入して<span style="border: 1px solid;">Submit</span>をクリック

## ダウンロード
登録したメールアドレス宛にメールが届くので、その中の<span style="border: 1px solid;">Download&gt;</span>をクリック  
開いたページでダウンロードするバージョンを選択して、<span style="border: 1px solid;">Full Package</span>をクリックしてダウンロードファイルを保存  
※ 登録しないとダウンロードさせてくれないみたいなので、ダウンロードファイルへの直リンクは記載をやめとく。  

# python 環境の準備
openVINO用のpython環境を用意しておく。  

```bash
cd /work1/
pyenv virtualenv 3.7.7 openVINO
pyenv local openVINO 
pip install --upgrade pip setuptools
```

# インストール
## 必要なパッケージのインストール
あとで「入ってない」って言われるので先にインストールしておく。  
```bash
sudo apt install cmake
sudo apt install libcairo2-dev libpango1.0-dev libglib2.0-dev libgtk2.0-dev libswscale-dev libavcodec-dev libavformat-dev
```

## openVINOのインストール
ダウンロードしたファイルを展開してインストールスクリプトを実行する。  
今回はバージョン 2020.3 で確認した。  
最新版は <https://docs.openvinotoolkit.org/latest/_docs_install_guides_installing_openvino_linux.html> を参照。  

```bash
tar xzvf l_openvino_toolkit_p_<version>.tgz
cd l_openvino_toolkit_p_<version>/
sudo -E ./install_GUI.sh 
```
GUIで次へを押していく。

完了したらこれが表示されるので、したがって進める。  
<https://docs.openvinotoolkit.org/2020.2/_docs_install_guides_installing_openvino_linux.html#install-external-dependencies>  

## インストールスクリプト実行後の設定  

### Install External Software Dependencies
依存パッケージのインストール
```bash
cd /opt/intel/openvino/install_dependencies/
sudo -E ./install_openvino_dependencies.sh 
```

### Set the Environment Variables
環境変数の設定  
~/.bashrc に以下の一文を追加。これでこの後開くコンソールでは環境変数が設定される。  
```
source /opt/intel/openvino/bin/setupvars.sh
```
現在のターミナルでも使えるように以下のコマンドを実行しておく。コンソール開きなおしてもOK。  

```bash
source /opt/intel/openvino/bin/setupvars.sh
```

### Configure the Model Optimizer
モデルオプティマイザのインストール  
```bash
cd /opt/intel/openvino/deployment_tools/model_optimizer/install_prerequisites
sudo -E ./install_prerequisites.sh 
```

上記スクリプトではsystemのpython3にpipモジュールがインストールされてしまうので、  
pyenv環境にも必要なpipモジュールをインストールしておく  
```bash
pyenv shell openVINO                       # python環境を固定したいので
pip install -r /opt/intel/openvino/deployment_tools/model_optimizer/requirements.txt
pyenv shell --unset                        # python環境を戻しておく
```


### Run the Verification Scripts to Verify Installation
デモ実行  
「Verify Installation」って書いてあるけど、実行必須。  

- デモ用ディレクトリに移動  
```bash
cd /opt/intel/openvino/deployment_tools/demo/
```

- sudoでpyenvが使えないので、代わりに ``/work1``  で作成した ``.python-version``をコピーしておく  
```bash
sudo cp /work1/.python-version .
```

- pyenv環境にデモ環境で必要なpipモジュールをインストールしておく 。Systemのpython使うときは↓のスクリプト実行時にインストールされる。   
```bash
pip install -r /opt/intel/openvino/deployment_tools/open_model_zoo/tools/downloader/requirements.in 
```

- デモ build & RUN  その1
```bash
./demo_squeezenet_download_convert_run.sh 2>&1 | tee /work1/tmp/demo1.log
```

- デモ build & RUN  その2
```bash
./demo_security_barrier_camera.sh 2>&1 | tee /work1/tmp/dem2.log
```

### Steps for Intel® Processor Graphics (GPU)
今回はGPUを使わないのでスキップ  

### Steps for Intel® Movidius™ Neural Compute Stick and Intel® Neural Compute Stick 2

NCS2の準備  
色々書いてあるけど、これ一発でOK。  
```bash
${INTEL_CVSDK_DIR}/install_dependencies/install_NCS_udev_rules.sh
```
>[!NOTE]
>中ではこんなことをやってます。  
>グループusersに自分を追加  
>(ログアウト & 再ログインするまで追加は反映されません)  
>udevルールの作成と再ロード  

NCS2をUSBポートにブッ挿すして認識したか確認
```bash
lsusb 
```

以下があったら認識できてる
```
ID 03e7:2485
```

### Steps for Intel® Vision Accelerator Design with Intel® Movidius™ VPUs
今回はVPUを使わないのでスキップ  

デモプログラムの実行で動作確認

で、Run a Sample Application に行く前に、ログアウト＆再ログインでいいはずだけど、念のためリブート。


### Run a Sample Application
リブートして開いてたページが分からなくなるといけないので、念のためURL貼っとく。  
<https://docs.openvinotoolkit.org/2020.2/_docs_install_guides_installing_openvino_linux.html#run-a-sample>  

- デモ実行ディレクトリに移動。  
```bash
cd ~/inference_engine_samples_build/intel64/Release
```
- CPUでデモ実行  
```bash
./classification_sample_async -i /opt/intel/openvino/deployment_tools/demo/car.png -m ~/openvino_models/ir/public/squeezenet1.1/FP16/squeezenet1.1.xml -d CPU
```
- NCS2でデモ実行  
```bash
./classification_sample_async -i /opt/intel/openvino/deployment_tools/demo/car.png -m ~/openvino_models/ir/public/squeezenet1.1/FP16/squeezenet1.1.xml -d MYRIAD
```

このページの手順はここでおしまい。  


# 他のサンプルも試してみよう。  
## サンプルのbuild
### 前準備
``` bash
mkdir -p /work1/NCS/sample && cd /work1/NCS/sample/
cmake -DCMAKE_BUILD_TYPE=Release /opt/intel/openvino_2020.3.194/deployment_tools/inference_engine/samples/cpp/
```

### SSDを試してみよう
#### build
```bash
make -j2 object_detection_sample_ssd
```
#### モデルファイルのダウンロード
```bash
DL_URL1=https://download.01.org/opencv/2019/open_model_zoo/R4/20200117_150000_models_bin/face-detection-adas-0001/FP16
wget --no-check-certificate ${DL_URL1}/face-detection-adas-0001.bin
wget --no-check-certificate ${DL_URL1}/face-detection-adas-0001.xml
```

#### 実行
```bash
./intel64/Release/object_detection_sample_ssd -m face-detection-adas-0001.xml -d MYRIAD -i /work/data/data2/z_20141013051441.jpg 
```
>[!NOTE]
>コマンド実行時の``-i``オプションは入力画像ファイル。  
>人の顔が写っているjpegファイルを指定しましょう。 
>顔が写ってなければ顔検出できません(^^ゞ  

``[ INFO ] Execution successful``と表示されたら実行成功だと思う。  

#### 結果画像を表示してみる。  
```bash
eog out_0.bmp 
```

#### ***おーーーー***

# ここまでの作業でインストールしたpipパッケージ一覧
```
absl-py==0.9.0
astor==0.8.1
certifi==2020.4.5.2
chardet==3.0.4
decorator==4.4.2
defusedxml==0.6.0
gast==0.2.2
google-pasta==0.2.0
graphviz==0.8.4
grpcio==1.29.0
h5py==2.10.0
idna==2.9
importlib-metadata==1.6.1
Keras-Applications==1.0.8
Keras-Preprocessing==1.1.2
Markdown==3.2.2
mxnet==1.5.1
networkx==2.4
numpy==1.18.5
onnx==1.7.0
opt-einsum==3.2.1
protobuf==3.6.1
PyYAML==5.3.1
requests==2.23.0
six==1.15.0
tensorboard==1.15.0
tensorflow==1.15.3
tensorflow-estimator==1.15.1
termcolor==1.1.0
typing-extensions==3.7.4.2
urllib3==1.25.9
Werkzeug==1.0.1
wrapt==1.12.1
zipp==3.1.0
```
