---
title:  tensorflowの転移学習に関するメモ
date: 2021-05-12
tags: ["DeepLearning", "Tensorflow"]
excerpt: tensorflowの転移学習を試したときのメモ
layout: default
---

# tensorflow 1.XでのSSDの転移学習の例

<https://github.com/ippei8jp/tf1_TransferLearning>{:target="_blank"}


# tensorflow 2.XでのSSDの転移学習の例

<https://github.com/ippei8jp/tf2_TransferLearning>{:target="_blank"}



# Pascal VOC で転移学習

ローカルマシン(Core-i7/Win10/WSL2/Ubuntu20.04/Tensorflow2.4)で試してみた手順が以下。  
かなり時間がかかるけど、GPUなくても24時間もあればそれなりの回数がこなせる(5000回くらい？)。  

``This TensorFlow binary is optimized with oneAPI Deep Neural Network Library (oneDNN) to use the following CPU instructions in performance-critical operations:  AVX2 FMA  To enable them in other operations, rebuild TensorFlow with the appropriate compiler flags.`` と言われているので、これらを有効にしてTensorflowを再構築すればもうちっと速くなるはず。  

>[!NOTE]
> ずいぶん前にtensorflow 1.1.0でAVXを有効にしたら、MNISTの学習で実行時間が半分になった記憶もあるが、  
> tensorflow 1.6以降でAVXは有効になってて、AVX2,FMAの有無では10%くらいしか違わないらしい。  
> 参考：[TensorFlowのAVX2, FMAの有無で性能の比較をする](https://www.acceluniverse.com/blog/developers/2019/05/tensorflowavx2-fma.html){:target="_blank"}  
> tensorflowのbuildに十何時間もかかることを考えたら 「ま、いっか」となっちゃうな...

## 実行手順

```bash
BASE_DIR=/work/test
MODELS_DIR=${BASE_DIR}/models
WORK_DIR=${BASE_DIR}/voc

# modelsリポジトリのclone
cd ${BASE_DIR}
git clone --depth 1 https://github.com/tensorflow/models.git
# object_detectionモジュール未インストールならインストールすること

# Pascal VOC データ取得
cd ${WORK_DIR}
wget http://host.robots.ox.ac.uk/pascal/VOC/voc2007/VOCtrainval_06-Nov-2007.tar -O - | tar xvf -

# 学習データ(tf-record)の作成
cd ${MODELS_DIR}/research/object_detection/
python create_pascal_tf_record.py --label_map_path ${MODELS_DIR}/research/object_detection/data/pascal_label_map.pbtxt --data_dir ${WORK_DIR}/VOCdevkit --year VOC2007 --set train --output_path ${WORK_DIR}/pascal_train.record
python create_pascal_tf_record.py --label_map_path ${MODELS_DIR}/research/object_detection/data/pascal_label_map.pbtxt --data_dir ${WORK_DIR}/VOCdevkit --year VOC2007 --set val --output_path ${WORK_DIR}/pascal_val.record

# 元となるモデルのダウンロード
cd ${WORK_DIR}/
wget http://download.tensorflow.org/models/object_detection/tf2/20200711/ssd_mobilenet_v2_fpnlite_320x320_coco17_tpu-8.tar.gz -O - | tar xzvf -
cp ssd_mobilenet_v2_fpnlite_320x320_coco17_tpu-8/pipeline.config .

# pipeline.config を編集(下記参照)

# 学習実行
cd ${MODELS_DIR}/research/object_detection/
python model_main_tf2.py --pipeline_config_path=${WORK_DIR}/pipeline.config --model_dir=${WORK_DIR}/output_training --alsologtostderr
```

### object_detectionモジュールのインストール方法
```bash
cd models/research
protoc object_detection/protos/*.proto --python_out=.
cp object_detection/packages/tf2/setup.py . 
# ↑ tf1の場合はtf1ディレクトリを指定する

pip install .
```

### pipeline.config	の修正例
```patch
--- ssd_mobilenet_v2_fpnlite_320x320_coco17_tpu-8/pipeline.config	2020-07-11 09:16:11.000000000 +0900
+++ pipeline.config	2021-05-11 05:22:30.943865000 +0900
@@ -1,6 +1,6 @@
 model {
   ssd {
-    num_classes: 90
+    num_classes: 20
     image_resizer {
       fixed_shape_resizer {
         height: 320
@@ -132,7 +132,7 @@
   }
 }
 train_config {
-  batch_size: 128
+  batch_size: 64
   data_augmentation_options {
     random_horizontal_flip {
     }
@@ -162,19 +162,19 @@
     }
     use_moving_average: false
   }
-  fine_tune_checkpoint: "PATH_TO_BE_CONFIGURED"
-  num_steps: 50000
+  fine_tune_checkpoint: "/work/test/voc/ssd_mobilenet_v2_fpnlite_320x320_coco17_tpu-8/checkpoint/ckpt-0"
+  num_steps: 2000
   startup_delay_steps: 0.0
   replicas_to_aggregate: 8
   max_number_of_boxes: 100
   unpad_groundtruth_tensors: false
-  fine_tune_checkpoint_type: "classification"
+  fine_tune_checkpoint_type: "detection"
   fine_tune_checkpoint_version: V2
 }
 train_input_reader {
-  label_map_path: "PATH_TO_BE_CONFIGURED"
+  label_map_path: "/work/test/models/research/object_detection/data/pascal_label_map.pbtxt"
   tf_record_input_reader {
-    input_path: "PATH_TO_BE_CONFIGURED"
+    input_path: "/work/test/voc/pascal_train.record"
   }
 }
 eval_config {
@@ -182,10 +182,10 @@
   use_moving_averages: false
 }
 eval_input_reader {
-  label_map_path: "PATH_TO_BE_CONFIGURED"
+  label_map_path: "/work/test/models/research/object_detection/data/pascal_label_map.pbtxt"
   shuffle: false
   num_epochs: 1
   tf_record_input_reader {
-    input_path: "PATH_TO_BE_CONFIGURED"
+    input_path: "/work/test/voc/pascal_val.record"
   }
 }
```

## 学習の中断

学習処理を中断したい場合は、CTRL+cを入力する。  
ただし、中断した時点でのチェックポイントの保存は行われないので、それまでに保存されたチェックポイントが有効。  
デフォルトではチェックポイントの保存は1000回毎なので、1000回未満で中断すると学習してないのと同じ(たぶん)。  

## 追加学習/学習の再開

中断した学習を再開したい場合や設定した学習回数では十分ではなかった場合の追加学習を行うには  
``model_main_tf2.py``を再度実行すればOK。  
それまで実行した学習結果の続きを実行してくれます。  
(特に設定ファイル類を変更する必要はないみたい)  

追加学習の場合や学習回数を変更したい場合は``--num_train_steps``オプションで新しい学習回数を指定するか、
``pipeline.config``ファイル内の``num_steps``の項目を変更します。  

また、デフォルトでは学習結果は1000回毎にセーブされるので、学習回数が1000回未満の場合や端数が出る場合、結果がセーブされません。  
この場合、``--checkpoint_every_n``オプションで何回毎にセーブするかを指定する必要があります。  

以下に例を示します。  

```bash
python model_main_tf2.py --pipeline_config_path=${WORK_DIR}/pipeline.config --model_dir=${WORK_DIR}/output_training --alsologtostderr --checkpoint_every_n=100 --num_train_steps=2300
```
## モデルのエクスポート

学習を行った結果をエクスポートしてsaved_modelを作成します。  

```bash
cd ${MODELS_DIR}/research/object_detection/
python exporter_main_v2.py --trained_checkpoint_dir ${WORK_DIR}/output_training --pipeline_config_path ${WORK_DIR}/pipeline.config --output_directory${WORK_DIR}/inference_voc
# ラベルファイルもコピーしておく
cp ${MODELS_DIR}/research/object_detection/data/pascal_label_map.pbtxt ${WORK_DIR}/inference_voc/
```


# 学習データ(tf-record)の確認方法
## セットアップ
```bash
mkdir -p /work/tfrecord
cd  /work/tfrecord
# 仮想環境の準備
pyenv virtualenv 3.8.9 tfrecord
pyenv local tfrecord 
pip install --upgrade pip setuptools
# 必要なモジュールのインストール
pip install tensorflow==2.*
pip install flask
pip install pillow
pip install tqdm
```

## リポジトリのclone

以下のリポジトリから
```bash
git clone https://github.com/sulc/tfrecord-viewer.git
cd tfrecord-viewer/
```
## Viewerの実行

webサーバを起動する  

```bash
python tfviewer.py «tf-recordファイル» 
```


例：  
```bash
python tfviewer.py /work/test/train.record 
```

ブラウザで以下に接続する(ポート番号は実行環境によって変わるかも)  
``http://localhost:5000/``  

表示下部にサムネイルが表示されるので、クリックすると中央に拡大表示される。  


## 元画像データの抽出


以下のパッチを当てる  
(元のファイル名がディレクトリ名を含んでいるとファイル作成エラーになるので)  
```patch
diff --git a/tfrecord_to_imfolder.py b/tfrecord_to_imfolder.py
index 81bb764..7a0e269 100644
--- a/tfrecord_to_imfolder.py
+++ b/tfrecord_to_imfolder.py
@@ -41,6 +41,7 @@ def parse_tfrecord(record):
     feat = example.features.feature

     filename = feat[args.filename_key].bytes_list.value[0].decode("utf-8")
+    filename = os.path.basename(filename)
     img =  feat[args.image_key].bytes_list.value[0]
     label = feat[args.class_label_key].bytes_list.value[0].decode("utf-8")
```

以下のコマンドを実行  
``--class-label-key`` には他にも指定できるものがあるけど、これくらいしか使わないと思う。  
```bash
python tfrecord_to_imfolder.py \
  --output_path «ファイル出力ディレクトリ» \
  --class-label-key image/object/class/text \
  -v \
   «tf-recordファイル»
```

実行すると、«ファイル出力ディレクトリ»/«クラス名»/の下に画像ファイルが生成される。  
(画像中に複数のクラスが含まれる場合は、一番最初のクラスが使用される)  

例：  
```bash
python tfrecord_to_imfolder.py \
  --output_path ./hogehoge \
  --class-label-key image/object/class/text \
  -v \
  /work/test/train.record
```



# 参考になるかもしれないページ

[TensorFlowでの物体検出が超手軽にできる「Object Detection Tools」をTensorFlow 2.xに対応しました](https://qiita.com/karaage0703/items/8c3197d11f61812546a9?fbclid=IwAR35TFl3mOK9XxXcZChP8wNkxp8cF6HZwnrWiTborZqETz7LJBZ88Dehvvs)

[Object Detection API」で物体検出の自前データを学習する方法（TensorFlow 2.x版）](https://qiita.com/karaage0703/items/8567cc192e151bac3e50?fbclid=IwAR35TFl3mOK9XxXcZChP8wNkxp8cF6HZwnrWiTborZqETz7LJBZ88Dehvvs)

