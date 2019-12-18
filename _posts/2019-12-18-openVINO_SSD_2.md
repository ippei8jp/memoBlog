---
title: openVINO でSSD(その2)
date: 2019-12-18
tags: ["DeepLearning", "openVINO", "Ubuntu", "RaspberryPi"]
excerpt: openVINOのSSDのサンプルプログラムのモデルデータを変更してみる
---


[openVINO でSSD]({{ site.baseurl }}/2019/11/10/openVINO_SSD.html) でSSDを動かしてみたが、
検出できるオブジェクトの種類が少なくてちょっと寂しかったので、別のモデルがないか探してみた。  

で、調べてみると、openCVのopen_model_zoo以外にもTensorFlowの公式モデルなどをダウンロードして変換するスクリプトが用意されていた。  
で、以下手順。  

# モデルのダウンロード＆モデルのIRへの変換

#### テンポラリディレクトリの作成＆移動

とりあえず作業用のディレクトリを作成しておく。

```bash
mkdir -p /work/temp
cd /work/temp
```


### 使用できるモデルの一覧を表示

```bash
${INTEL_OPENVINO_DIR}/deployment_tools/tools/model_downloader/downloader.py  --print_all
```

ちなみに、モデル毎の設定は以下にあるので、雰囲気で解読してちょ。  

```
${INTEL_OPENVINO_DIR}/deployment_tools/open_model_zoo/models/public/${modelname}/model.yml
```

### このへんのモデルを使ってみる

なんとなく、mobilenetが小さそうなので。   

```bash
modelname=ssd_mobilenet_v2_coco
```

または

```bash
modelname=ssdlite_mobilenet_v2
```

ssdlightの方がモデルデータが小さい。その分精度は落ちるらしい。  
検出できるオブジェクトの種類は同じ。  
出力は90種類だが、途中欠番があるみたいなので実質80種類くらい。  
変わったところでは「テディベア」なんてのもある。試してみたらちゃんと認識した(あたりまえか...)。  
cocoデータセット<http://cocodataset.org/#home>なので、有名どころですね。  
あ、「80 object categories 91 stuff categories」ってちゃんと書いてある...  

### ダウンロード

まずはダウンロード。  

```bash
${INTEL_OPENVINO_DIR}/deployment_tools/tools/model_downloader/downloader.py --name ${modelname}
```

``public/${modelname}/``にモデルがダウンロードされる。  


### モデルデータをIRファイルへ変換

もとのモデルデータはTensorFlowで使用するProtocolBuffer形式なので、openVINOで使用できるIR形式に変換する。  

```bash
${INTEL_OPENVINO_DIR}/deployment_tools/tools/model_downloader/converter.py --precisions FP16 --name ${modelname}
```

``public/${modelname}/FP16/``にIRモデルが出来る。  


### そのままの場所で使用しても良いが、他のモデルとまとめておく

モデルがあちこちにあると管理しずらくなるので、他のモデルと同じところに置いておく。  
必要なのはxmlとbin。  

```bash
cp public/${modelname}/FP16/${modelname}.{xml,bin} /work/NCS2/openvino_models/FP16/
```

``.{xml,bin}``のところにスペースなどを入れてしまうとうまく動かないので注意。  
結構「あとで読みやすいように」と入れてしまいがち(特にスクリプト書くとき)なので注意。 


### ラベルファイルの作成

``/work/NCS2/openvino_models/FP16/${modelname}.labels``にラベルデータを作成しておく。  
なくても可。  
作り方は後述。  


### 実行

[openVINO でSSD]({{ site.baseurl }}/2019/11/10/openVINO_SSD.html) の「デモ実行」と同じ手順で
モデルファイルを差し替えて(``--model``オプション)実行すれば良い。  

# ラベルファイルの作成方法

ラベルデータはモデルデータには含まれていないようなので、作成する方法を検討してみた。  

### tensorflowのmodelsモジュールをダウンロード

まず、モデルデータの作成情報のあるモジュールをダウンロードしておく。  
gitでなくてもzipをダウンロードして展開しておいても可(ちょっとデカいので)。  

```bash
git clone https://github.com/tensorflow/models.git models_tf
```

### 作業ディレクトリに移動

あとでpythonプログラムを作成するときに色々面倒がないので、作業ディレクトリはココで。  

```bash
cd models_tf/research
```

``object_detection/samples/configs``から対応するconfigファイルを探して(なんとなく雰囲気で探せ！)表示  
``label_map_path``に記載されたファイルがlabel_mapファイル  
このとき、PATH_TO_BE_CONFIGURED は ``object_detection/data`` に読み替えること  

ssd_mobilenet_v2_cocoの場合は以下のファイル。  

```
object_detection/samples/configs/ssd_mobilenet_v2_coco.config
```

上記ファイルの場合、label_mapは以下のファイル。  

```
object_detection/data/mscoco_label_map.pbtxt"
```

こにファイルにIDとラベルが定義されているが、そのままラベルファイルとしては認識できない。  
IDには途中抜けがあるので注意(そのままgrepで抜き出してはダメ)  

## ラベルデータ変換プログラムを作成する

label_map.pbtxtからラベル一覧を取得するのを手作業で行うのは大変なので、プログラムを作成する。  

### protocのインストール

まずは必要なモジュールのインストール。  

```bash
sudo apt install protobuf-compiler
```

### protoファイルからpythonモジュールを作成する

```bash
protoc object_detection/protos/*.proto --python_out=.
```

### 変換プログラムのソース

label_mapからテーブルを作成するスクリプト(labelmap2labels.py)をカレントディレクトリに作成する。  
やっつけ仕事なので、かなりテキトー(笑)、、、  

```python
import sys
import os
from object_detection.utils import label_map_util

def usage() :
    print("==== USAGE ====")
    print(f"    python {sys.argv[0]} label_map_file")
    sys.exit(0)

if len(sys.argv) != 2 :
    # パラメータが1個でない
    usage()

# label_map_file = "object_detection/data/mscoco_complete_label_map.pbtxt"
label_map_file = sys.argv[1]
if not os.path.exists(label_map_file) :
    # 第一パラメータのファイルが存在しない
    print(f"error: '{label_map_file}' not exist\n")
    usage()

# label_mapからカテゴリインデックスを作成
category_index = label_map_util.create_category_index_from_labelmap(label_map_file)

for i in range(len(category_index)+1) :
    # print(i)
    try:
        name = category_index[i]["name"]
    except:
        name = str(i)
    
    # print(f'{name}\t# {i}')
    print(name)
    
# 個数確認のためにダミーを出力
print(len(category_index)+1)
```

### スクリプトの実行

```bash
python labelmap2labels.py label_map_file
```

結果は標準出力へ出力されるので、ファイルにcastして使用する

例：

```bash
python labelmap2labels.pyobject_detection/data/mscoco_complete_label_map.pbtxt > mscoco_complete.labels
```

出来上がったlabelsファイルを必要なところへコピーして使ってちょ。  







