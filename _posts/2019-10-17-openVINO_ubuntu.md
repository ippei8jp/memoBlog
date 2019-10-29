---
title: openVINO フルパッケージをubuntuにインストール
date: 2019-10-17
tags: ["DeepLearning", "openVINO", "ubuntu"]
excerpt: openVINO フルパッケージをubuntuにインストールする
---

caffeモデルなどをopenVINOへ変換するには、フルパッケージが必要らしい。  
でもって、フルパッケージはRaspberryPiでは使用できなくて、WindowsやLinux、macOSが必要。  
ということで、openVINO フルパッケージをubuntu 18.04にインストールする。   
(16.04でも大丈夫かもしれないけど、今回は18.04を使う。LTSじゃないのはやめといた方が良さそう)  

# ダウンロード ＆ インストール前半

ダウンロードはこの辺を参考に。。。  
<https://qiita.com/ammo0613/items/a9bb3b7f20dc02a8d758>  
なにやら登録しないといけないらしい。  

ダウンロードしたら、てきとーなところに展開して、インストーラを実行する。  

> [!NOTE]
> 2910.10 「2019 R3.1」がリリースされた。ファイル名は「l_openvino_toolkit_p_2019.3.376.tgz」 

```bash
tar xzvf /Share/l_openvino_toolkit_p_2019.3.334.tgz 
cd l_openvino_toolkit_p_2019.3.334
sudo -E ./install_GUI.sh 
```

nextをクリックしていけば大丈夫(Agreeするとこはあるけど)。  
あとで色々インストールしろと言われるけど、あとでやるので無視して大丈夫  
・・・・しばらく待つ・・・・  
いったんFinishするとブラウザが表示される  
<https://docs.openvinotoolkit.org/latest/_docs_install_guides_installing_openvino_linux.html#install-external-dependencies>

# インストール後半 ＆ 動作確認

## 「Install External Software Dependencies」とな？

なんか実行してインストールしろってことらしい。  
root権限で実行しないとエラーになる。  


```bash
cd /opt/intel/openvino/install_dependencies
sudo -E ./install_openvino_dependencies.sh
```

なんか色々インストールされるっぽい。  
中身はOSのディストリビューションとバージョンでインストールパッケージを切り替えてインストールしてるらしい。  


## 「Set the Environment Variables」とな？

環境変数の設定らしい。

```bash
source /opt/intel/openvino/bin/setupvars.sh
```

~/.bashrcに追加しておくと良いとのことなので、そうする。

## 「Configure the Model Optimizer」とな？

モデルオプティマイザの設定。  
これが欲しかったのよ。  

必要なpipモジュールをインストールするらしい。  
必要なものだけインストールすることもできるけど、一括でインストールしといた方が手間がかからないでしょう。  

pyenvを使ってると、`sudo pip3`されると、systemのpip3が動いてしまい、pyenv環境にモジュールがインストールされない。  
スクリプトの中で必要なコマンドだけ実行する(随分スッキリしちゃったなぁ)。

```bash
pip install -r /opt/intel/openvino/deployment_tools/model_optimizer/requirements.txt
```

バージョン不一致とか言われたら、適宜バージョン合わせてアップグレードorダウングレードしてちょ。  

> [!NOTE]
> setuptoolsは``pip install -U setuptools``でOKなはず。  
> numpyは``mxnet 1.3.1 has requirement numpy<1.15.0,>=1.8.2, but you'll have numpy 1.17.3 which is incompatible.``と言われるのだけど、tensorflow 1.15.0だとnumpy 1.16.0以上を要求する。  
> とりあえず、tenssorflowを1.13.1にしてnumpyを1.14.6にしてみて様子見。  
> 現状のバージョン一覧は以下。これを``requirements.txt``として保存し、``pip install -r requirements.txt``するとこのバージョンでそろえてくれるはず。  
>   
> ```
> absl-py==0.8.1
> astor==0.8.0
> certifi==2019.9.11
> chardet==3.0.4
> decorator==4.4.0
> defusedxml==0.6.0
> gast==0.2.2
> google-pasta==0.1.7
> graphviz==0.8.4
> grpcio==1.24.3
> h5py==2.10.0
> idna==2.8
> Keras-Applications==1.0.8
> Keras-Preprocessing==1.1.0
> Markdown==3.1.1
> mock==3.0.5
> mxnet==1.3.1
> networkx==2.3
> numpy==1.14.6
> onnx==1.6.0
> opt-einsum==3.1.0
> pipdeptree==0.13.2
> protobuf==3.6.1
> requests==2.22.0
> six==1.12.0
> tensorboard==1.13.1
> tensorflow==1.13.1
> tensorflow-estimator==1.13.0
> termcolor==1.1.0
> typing-extensions==3.7.4
> urllib3==1.25.6
> Werkzeug==0.16.0
> wrapt==1.11.2
> ```

> [!NOTE]
> オリジナルの方法はこちら
> ```bash
> cd /opt/intel/openvino/deployment_tools/model_optimizer/install_prerequisites
> sudo -E ./install_prerequisites.sh
> ```

## 「Run the Verification Scripts to Verify Installation」とな？

なになに、実行必須？たしかにapt installが実行される。  
なら、タイトルに "to Verify Installation" とか書くなよ！  

build前に``apt install`` と ``pip install``が走る。

こっちもpyenv使ってるとpipで悲しいことになるので、先にpipだけ実行しておく。  
スクリプト側でもpipが走ってsystemのモジュールが追加されるが、悪影響はないと思うので、そのままにしておく。  

```bash
pip install -r /opt/intel/openvino/deployment_tools/open_model_zoo/tools/downloader/requirements.in 
```

```bash
cd /opt/intel/openvino/deployment_tools/demo
./demo_squeezenet_download_convert_run.sh
```

・・・・こんなことをやってるらしい・・・・

- ``target_precision`` は FP16 になっている
- ``apt install`` で必要なモジュールをインストール
- ``pip install``で必要なモジュールをインストール
- ``deployment_tools/open_model_zoo/tools/downloaderdownloader.py``でモデルのダウンロードを行う
    - ダウンロード済みならスキップ>>
- ``deployment_tools/model_optimizer/mo.py``でモデル変換を行う
    - 変換済みならスキップ>>
- サンプルプログラムのbuild
- サンプルプログラム(classification_sample_async)の実行  
    実行結果はこんな感じ  

```
Run ./classification_sample_async -d CPU -i /opt/intel/openvino/deployment_tools/demo/car.png -m ~/openvino_models/ir/FP16//public/squeezenet1.1/squeezenet1.1.xml 

[ INFO ] InferenceEngine: 
	API version ............ 2.1
	Build .................. custom_releases/2019/R3_cb6cad9663aea3d282e0e8b3e0bf359df665d5d0
	Description ....... API
[ INFO ] Parsing input parameters
[ INFO ] Parsing input parameters
[ INFO ] Files were added: 1
[ INFO ]     /opt/intel/openvino/deployment_tools/demo/car.png
[ INFO ] Creating Inference Engine
	CPU
	MKLDNNPlugin version ......... 2.1
	Build ........... 30677

[ INFO ] Loading network files
[ INFO ] Preparing input blobs
[ WARNING ] Image is resized from (787, 259) to (227, 227)
[ INFO ] Batch size is 1
[ INFO ] Loading model to the device
[ INFO ] Create infer request
[ INFO ] Start inference (10 asynchronous executions)
[ INFO ] Completed 1 async request execution
[ INFO ] Completed 2 async request execution
[ INFO ] Completed 3 async request execution
[ INFO ] Completed 4 async request execution
[ INFO ] Completed 5 async request execution
[ INFO ] Completed 6 async request execution
[ INFO ] Completed 7 async request execution
[ INFO ] Completed 8 async request execution
[ INFO ] Completed 9 async request execution
[ INFO ] Completed 10 async request execution
[ INFO ] Processing output blobs

Top 10 results:

Image /opt/intel/openvino/deployment_tools/demo/car.png

classid probability label
------- ----------- -----
817     0.8364176   sports car, sport car
511     0.0945683   convertible
479     0.0419195   car wheel
751     0.0091233   racer, race car, racing car
436     0.0068038   beach wagon, station wagon, wagon, estate car, beach waggon, station waggon, waggon
656     0.0037315   minivan
586     0.0025940   half track
717     0.0016044   pickup, pickup truck
864     0.0012045   tow truck, tow car, wrecker
581     0.0005833   grille, radiator grille

[ INFO ] Execution successful

[ INFO ] This sample is an API example, for any performance measurements please use the dedicated benchmark_app tool
```

- 終了


もういっちょでも実行。  

```bash
./demo_security_barrier_camera.sh
```

やってることは前のと同じ。  
こっちはopenVINOのモデルをダウンロードするので、モデル変換はない。  
最終的に実行しているデモプログラムはこんな感じ。  

```
Run ./security_barrier_camera_demo -d CPU -d_va CPU -d_lpr CPU -i /opt/intel/openvino/deployment_tools/demo/car_1.bmp -m ~/openvino_models/ir/FP16/intel/vehicle-license-plate-detection-barrier-0106/FP16/vehicle-license-plate-detection-barrier-0106.xml -m_lpr ~/openvino_models/ir/FP16/intel/license-plate-recognition-barrier-0001/FP16/license-plate-recognition-barrier-0001.xml -m_va ~/openvino_models/ir/FP16/intel/vehicle-attributes-recognition-barrier-0039/FP16/vehicle-attributes-recognition-barrier-0039.xml 
```




## GPUやNCStick使わないから以下スキップ

<!--
## 「Run a Sample Application」

NCStickなどVPUベースの環境で実行するにはFP16モデルが必要
デフォルトはFP32

FP16: 16bit浮動小数点
FP32: 32bit浮動小数点
====
mkdir ~/squeezenet1.1_FP16
cd ~/squeezenet1.1_FP16
python3 /opt/intel/openvino/deployment_tools/model_optimizer/mo.py --input_model ~/openvino_models/models/FP32/classification/squeezenet/1.1/caffe/squeezenet1.1.caffemodel --data_type FP16 --output_dir .

====




./classification_sample_async -i /opt/intel/openvino/deployment_tools/demo/car.png -m ~/squeezenet1.1_FP16/squeezenet1.1.xml -d CPU
-->
