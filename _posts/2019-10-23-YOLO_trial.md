---
title: YOLOv3を試す
date: 2019-10-23
tags: ["YOLOv3"]
excerpt: Native ＆ python でYOLOv3を実行してみる
---

# YOLOv3を試す

YOLOv3をubuntu上で実行してみた。  
opneVINOやNCStickは使用していない。  
単にYOLOv3の動作確認したかった＆python実装を探してたら見つかったサイトをトレースしてみただけの話。  
pyhton のバージョンは3.7.4  

元ネタはこちら→ <https://qiita.com/massie_g/items/a2bcfac4fed66b1b0717#yolo-v3-tiny-%E3%83%A2%E3%83%87%E3%83%AB>

とりあえず動かしてみた後にpythonのソース読んでみた。  
イメージの読み込みも、結果の描画も、保存もNativeなライブラリをコールしてるだけだ...   
完全なwrapperだ。。。  
やりたかったこととちょっと違う。。。orz....  

darknetは色々な処理(jpegファイルの操作とか)を自前で実装しているので、
色々ライブラリをインストールしなくて良いのは助かるんだけど、
他の処理系に移植するのはめんどくさそうなんだな。。。

ということで、さくっと試した手順だけ。  

```bash
export WORKDIR=/work1/YOLO
mkdir -p ${WORKDIR}
cd ${WORKDIR}
git clone https://github.com/pjreddie/darknet.git
cd darknet
wget https://pjreddie.com/media/files/yolov3.weights
wget https://pjreddie.com/media/files/yolov3-tiny.weights
cd ..
git clone https://github.com/mganeko/python3_yolov3.git
cp ./python3_yolov3/darknet-tiny-label.py ./darknet/python/
cd darknet
make
sudo ln -s ${WORKDIR}/darknet/libdarknet.so /usr/lib/libdarknet.so

# YOLOv3 native版の実行
./darknet detect cfg/yolov3.cfg yolov3.weights data/dog.jpg
# predictions.jpg が認識結果
mv predictions.jpg predictions_yolo.jpg 

# tinyYOLOv3 native版の実行
./darknet detect cfg/yolov3-tiny.cfg yolov3-tiny.weights data/dog.jpg
# predictions.jpg が認識結果
mv predictions.jpg predictions_tiny.jpg

# tinyYOLOv3 python版の実行
python python/darknet-tiny-label.py 
# detect_result.jpg が認識結果
```
