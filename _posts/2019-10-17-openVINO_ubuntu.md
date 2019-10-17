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

```bash
tar xzvf /Share/l_openvino_toolkit_p_2019.3.334.tgz 
cd l_openvino_toolkit_p_2019.3.334
sudo ./install_GUI.sh 
```

nextをクリックしていけば大丈夫(Agreeするとこはあるけど)。  
あとで色々インストールしろと言われるけど、あとでやるので無視して大丈夫  
・・・・しばらく待つ・・・・  
いったんFinishするとブラウザが表示される  
<https://docs.openvinotoolkit.org/2019_R2/_docs_install_guides_installing_openvino_linux.html#install-external-dependencies>

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

```bash
cd /opt/intel/openvino/deployment_tools/model_optimizer/install_prerequisites
sudo ./install_prerequisites.sh
```

## 「Run the Verification Scripts to Verify Installation」とな？

なになに、実行必須？たしかにapt installが実行される。  
なら、タイトルに "to Verify Installation" とか書くなよ！  

build前に``apt install`` と ``pip install``が走る。


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
