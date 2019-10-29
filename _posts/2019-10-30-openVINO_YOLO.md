---
title: openVINO でtinyYOLO
date: 2019-10-30
tags: ["DeepLearning", "openVINO", "ubuntu", "RaspberryPi"]
excerpt: darknetのモデルデータをopenVINOのモデルデータに変換し、tinyYOLOで画像認識を行う
---


openVINOの2019 R3.1 がリリー(2019.10.29現在、ubuntu用のみ)スされ、YOLOのサンプルプログラムが用意されていたので、tinyYOLOを実行してみた。  

参考：<https://docs.openvinotoolkit.org/latest/_docs_MO_DG_prepare_model_convert_model_tf_specific_Convert_YOLO_From_Tensorflow.html>

pythonはpyenv環境で3.7.4を使用

以下は 
[openVINO フルパッケージをubuntuにインストール]({{ site.baseurl }}/2019/10/17/openVINO_ubuntu.html) 
にしたがって、openVINO フルパッケージ(2019 R3.1) をインストールしたubuntuでの作業。

#  darknetのモデルデータをopenVINOのモデルデータに変換

上記参考サイトの手順に従って、darknetのtinyYOLOモデルデータをopenVINOのモデルデータに変換する。  

## darknet → tensorflow 変換のためのプログラム取得

```bash
git clone https://github.com/mystic123/tensorflow-yolo-v3.git
cd tensorflow-yolo-v3/
git checkout ed60b90
```

## darknet tinyYOLOモデルデータ取得

```bash
wget https://raw.githubusercontent.com/pjreddie/darknet/master/data/coco.names
wget https://pjreddie.com/media/files/yolov3-tiny.weights
```

# darknet → tensorflow モデルデータ変換

```bash
python convert_weights_pb.py --class_names coco.names --data_format NHWC --weights_file yolov3-tiny.weights --tiny
mv frozen_darknet_yolov3_model.pb yolo_v3_tiny.pb
```

## デモプログラムをコピー

モデルデータをデモプログラムと同じところに置いておきたいので、ここでデモプログラムをコピっておく。  

```bash
cd ..
cp -r /opt/intel/openvino/deployment_tools/open_model_zoo/demos/python_demos/object_detection_demo_yolov3_async .
cd object_detection_demo_yolov3_async/
```

## 上で作ったpbファイルをコピー

変換処理で直接上のディレクトリを参照すれば良いという説も...  

```bash
cp ../tensorflow-yolo-v3/yolo_v3_tiny.pb .
```

## ラベルデータもコピー

pbファイルにはラベルデータが入っているはずだが、この後の変換でラベルデータは欠落するらしい。  

```bash
cp ../tensorflow-yolo-v3/coco.names .
```

## モデルデータを変換

```bash
python /opt/intel/openvino/deployment_tools/model_optimizer/mo_tf.py \
--input_model ./yolo_v3_tiny.pb \
--tensorflow_use_custom_operations_config /opt/intel/openvino/deployment_tools/model_optimizer/extensions/front/tf/yolo_v3_tiny.json \
--output_dir FP16 \
--data_type FP16 \
--batch 1
```

FP16ディレクトリに yolo_v3_tiny.bin yolo_v3_tiny.mapping yolo_v3_tiny.xml の3つが出来る

> [!NOTE]
> FP32で計算する場合はこちら  
> NCStick使用時はFP16のみサポートなので、FP16で作っておくと使い回しできて楽。  
> そんなに認識精度が変わるわけでもなさそうだし。  
> 
> ```bash
> python /opt/intel/openvino/deployment_tools/model_optimizer/mo_tf.py \
> --input_model ./yolo_v3_tiny.pb \
> --tensorflow_use_custom_operations_config /opt/intel/openvino/deployment_tools/model_optimizer/extensions/front/tf/yolo_v3_tiny.json \
> --output_dir FP32 \
> --data_type FP32 \
> --batch 1
> ```

# デモ実行

## ソース修正

コピったソースそのままでも大丈夫だが、ちょっと修正しておく。

- MP4ファイルのパスが絶対パスでないと正常にオープンできない対策(ubuntuではやらなくても大丈夫)
- 1フレームあたりの処理時間の計測と表示処理を追加
- 認識枠の表示色変更(ちょっと見難かったので)
- 計測データ表示処理の並べ替え(ソースが見難かったので。フレーム時間の追加以外の動作は変更なし)

```diff
--- object_detection_demo_yolov3_async.py.org	2019-10-29 05:08:34.982999999 +0900
+++ object_detection_demo_yolov3_async.py	2019-10-29 11:20:46.112091500 +0900
@@ -210,7 +210,8 @@
     else:
         labels_map = None
 
-    input_stream = 0 if args.input == "cam" else args.input
+    # input_stream = 0 if args.input == "cam" else args.input
+    input_stream = 0 if args.input == "cam" else os.path.abspath(args.input)
 
     is_async_mode = True
     cap = cv2.VideoCapture(input_stream)
@@ -234,6 +235,8 @@
     next_request_id = 1
     render_time = 0
     parsing_time = 0
+    frame_time = 0
+    prev_time = time()
 
     # ----------------------------------------------- 6. Doing inference -----------------------------------------------
     log.info("Starting inference...")
@@ -263,6 +266,8 @@
 
         # Start inference
         start_time = time()
+        frame_time = start_time - prev_time         # 1フレームの処理時間
+        prev_time = start_time
         exec_net.start_async(request_id=request_id, inputs={input_blob: in_frame})
         det_time = time() - start_time
 
@@ -303,8 +308,9 @@
             # Validation bbox of detected object
             if obj['xmax'] > origin_im_size[1] or obj['ymax'] > origin_im_size[0] or obj['xmin'] < 0 or obj['ymin'] < 0:
                 continue
-            color = (int(min(obj['class_id'] * 12.5, 255)),
-                     min(obj['class_id'] * 7, 255), min(obj['class_id'] * 5, 255))
+            # color = (int(min(obj['class_id'] * 12.5, 255)),
+            #          min(obj['class_id'] * 7, 255), min(obj['class_id'] * 5, 255))
+            color = (255, 128, 128)
             det_label = labels_map[obj['class_id']] if labels_map and len(labels_map) >= obj['class_id'] else \
                 str(obj['class_id'])
 
@@ -322,16 +328,17 @@
         # Draw performance stats over frame
         inf_time_message = "Inference time: N\A for async mode" if is_async_mode else \
             "Inference time: {:.3f} ms".format(det_time * 1e3)
+        frame_time_message = "Frame time: {:.3f} ms".format(frame_time * 1e3)
         render_time_message = "OpenCV rendering time: {:.3f} ms".format(render_time * 1e3)
         async_mode_message = "Async mode is on. Processing request {}".format(cur_request_id) if is_async_mode else \
             "Async mode is off. Processing request {}".format(cur_request_id)
         parsing_message = "YOLO parsing time is {:.3f}".format(parsing_time * 1e3)
 
-        cv2.putText(frame, inf_time_message, (15, 15), cv2.FONT_HERSHEY_COMPLEX, 0.5, (200, 10, 10), 1)
-        cv2.putText(frame, render_time_message, (15, 45), cv2.FONT_HERSHEY_COMPLEX, 0.5, (10, 10, 200), 1)
-        cv2.putText(frame, async_mode_message, (10, int(origin_im_size[0] - 20)), cv2.FONT_HERSHEY_COMPLEX, 0.5,
-                    (10, 10, 200), 1)
-        cv2.putText(frame, parsing_message, (15, 30), cv2.FONT_HERSHEY_COMPLEX, 0.5, (10, 10, 200), 1)
+        cv2.putText(frame, inf_time_message,    (15, 15),                          cv2.FONT_HERSHEY_COMPLEX, 0.5, (200,  10,  10), 1)
+        cv2.putText(frame, parsing_message,     (15, 30),                          cv2.FONT_HERSHEY_COMPLEX, 0.5, ( 10,  10, 200), 1)
+        cv2.putText(frame, render_time_message, (15, 45),                          cv2.FONT_HERSHEY_COMPLEX, 0.5, ( 10,  10, 200), 1)
+        cv2.putText(frame, frame_time_message,  (10, int(origin_im_size[0] - 35)), cv2.FONT_HERSHEY_COMPLEX, 0.5, (200,  10,  10), 1)
+        cv2.putText(frame, async_mode_message,  (10, int(origin_im_size[0] - 20)), cv2.FONT_HERSHEY_COMPLEX, 0.5, ( 10,  10, 200), 1)
 
         start_time = time()
         cv2.imshow("DetectionResults", frame)
```


## 静止画の場合

実行コマンドは以下。  
dataディレクトリに認識用の画像データを用意してある(以下同じ)。

```bash
python object_detection_demo_yolov3_async.py \
--model FP16/yolo_v3_tiny.xml \
--cpu_extension /opt/intel/openvino/deployment_tools/inference_engine/lib/intel64/libcpu_extension_avx2.so \
--labels coco.names \
--input data/000004.jpg
```

## 動画の場合

実行コマンドは以下。  
入力ファイルをmp4に変えるだけ。  
カメラからの入力を使用する場合は``--input cam``とするらしいが、カメラないので未確認。  

```bash
python object_detection_demo_yolov3_async.py \
--model FP16/yolo_v3_tiny.xml \
--cpu_extension /opt/intel/openvino/deployment_tools/inference_engine/lib/intel64/libcpu_extension_avx2.so \
--labels coco.names \
--input data/testvideo3.mp4
```

# RaspberryPi3B+  ＋ NCStickでデモを動かす

以下は 
[Intel NCStick2用動作環境の構築]({{ site.baseurl }}/2019/09/01/NCS_1.html) 
にしたがって環境構築したRaspberryPiを使用。  


RaspberryPi用はopenVINO 2019R3のまま(2019.10.29現在、R3.1はリリースされていない)だけど、問題なし。


ubuntuで作成した object_detection_demo_yolov3_async ディレクトリをまるごとRaspberryPiにコピーする。  

## 静止画の場合

実行コマンドは以下。  ubuntuの実行コマンドと比べて、以下の変更がある。  
- ``--device MYRIAD``を追加
- ``--cpu_extension``を削除

```bash
python object_detection_demo_yolov3_async.py \
--device MYRIAD \
--model FP16/yolo_v3_tiny.xml \
--labels coco.names \
--input data/000004.jpg
```


## 動画の場合

実行コマンドは以下。  
こちらも入力ファイルをmp4に変えるだけ。

```bash
python object_detection_demo_yolov3_async.py \
--device MYRIAD \
--model FP16/yolo_v3_tiny.xml \
--labels coco.names \
-i data/testvideo3.mp4
```


# おまけ

## 認識結果をMP4ファイルに保存する

openCVではMP4ファイルを保存することができる。  
object_detection_demo_yolov3_async.py に以下の変更を加えることで、認識結果をMP4ファイルに保存することができる。  

以下の修正ファイルは簡易的に保存する処理を追加したため、保存ファイル名は決め打ち。   
汎用的にするなら、オプションで指定できるようにしてもいいかもね。

ただし、実際に保存するタイミングとMP4ファイルのタイムインデックスが一致するわけではないので、
処理時の見た目と保存ファイルを再生したときの見た目は異なるので注意が必要。  

```diff
--- object_detection_demo_yolov3_async.py	2019-10-29 11:20:46.112091500 +0900
+++ record.py	2019-10-29 11:35:37.296005608 +0900
@@ -218,6 +218,18 @@
     number_input_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
     number_input_frames = 1 if number_input_frames != -1 and number_input_frames < 0 else number_input_frames
 
+    # =====================================================================================
+    # 幅と高さを取得
+    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
+    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
+    size = (width, height)
+    # フレームレート(1フレームの時間単位はミリ秒)の取得
+    frame_rate = int(cap.get(cv2.CAP_PROP_FPS))
+    # フォーマット
+    fmt = cv2.VideoWriter_fourcc('m', 'p', '4', 'v')
+    writer = cv2.VideoWriter('./outtest.mp4', fmt, frame_rate, size)
+    # =====================================================================================
+
     wait_key_code = 1
 
     # Number of frames in picture is 1 and this will be read in cycle. Sync mode is default value for this case
@@ -342,6 +354,9 @@
 
         start_time = time()
         cv2.imshow("DetectionResults", frame)
+        # =====================================================================================
+        writer.write(frame)
+        # =====================================================================================
         render_time = time() - start_time
 
         if is_async_mode:
@@ -359,6 +374,10 @@
             is_async_mode = not is_async_mode
             log.info("Switched to {} mode".format("async" if is_async_mode else "sync"))
 
+    # =====================================================================================
+    writer.release()
+    # =====================================================================================
+
     cv2.destroyAllWindows()
```








