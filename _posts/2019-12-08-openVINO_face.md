---
title: openVINO で顔検出(特定人物識別)
date: 2019-12-08
tags: ["DeepLearning", "openVINO", "Ubuntu", "RaspberryPi"]
excerpt: openVINOの顔検出(特定人物識別)のサンプルプログラムを動かしてみる
---


openVINOで顔検出(特定人物識別)するサンプルプログラムがあったので動かしてみた。  
サンプルプログラムはフルパッケージにしか入ってないので、元のプログラムはフルパッケージをインストールして確認してちょ。
/opt/intel/openvino/deployment_tools/open_model_zoo/demos/python_demos/face_recognition_demo

pythonはpyenv環境で3.7.4を使用

以下は 
[openVINO フルパッケージをubuntuにインストール]({{ site.baseurl }}/2019/10/17/openVINO_ubuntu.html) 
にしたがって、openVINO フルパッケージ(2019 R3.1) をインストールしたubuntuでの作業。

# ソースをワークディレクトリにコピー

ファイルのオーナがrootなので、編集しやすいようにワークディレクトリにソースをコピーし、そこで作業する。  

```bash
cp -r /opt/intel/openvino/deployment_tools/open_model_zoo/demos/python_demos/face_recognition_demo .
cd face_recognition_demo/
```

#  モデルデータのダウンロード

いくつかのモデルデータが必要になるので、ダウンロードする。  
ワイルドカードでファイル指定したかったので、wgetでなくcurlを使う。  

```bash
mkdir models
cd models
curl https://download.01.org/opencv/2019/open_model_zoo/R3/20190905_163000_models_bin/face-detection-retail-0004/FP16/face-detection-retail-0004.\{xml,bin\} -O
curl https://download.01.org/opencv/2019/open_model_zoo/R3/20190905_163000_models_bin/landmarks-regression-retail-0009/FP16/landmarks-regression-retail-0009.\{xml,bin\} -O
curl https://download.01.org/opencv/2019/open_model_zoo/R3/20190905_163000_models_bin/face-reidentification-retail-0095/FP16/face-reidentification-retail-0095.\{xml,bin\} -O
cd ..
```

> [!NOTE]
> curlは「カレントディレクトリにターゲットと同じファイル名で保存」の``-O`` と 「任意のファイル名で保存」の``-o``オプションしかなく、
> wgetの「ターゲットと同じファイル名で保存先ディレクトリを指定して保存」の``-P``に相当するオプションがないので、
> カレントディレクトリを保存先に移動してから``-O`` オプションでコマンドを実行する。  

# 足りないモジュールのインストール

使用するモジュールでこれまでのお試しで未インストールのモジュールがあるのでインストールしておく。  

```bash
pip install scipy
```

# ソースの修正

ソースはそのままで問題ないが、ちょっと修正しておく。  

主な変更内容は以下の通り。  

- ``--run_detector_no_save`` オプションの追加と関連処理
- Unknownと識別できた場合で検出枠の色を変える
- 入力ファイルを絶対パスに変換(不具合対策)
- 出力ファイルのフォーマットのmp4対応を追加(オリジナルはaviのみ対応)


```diff
diff -ur face_recognition_demo.org/face_recognition_demo.py face_recognition_demo/face_recognition_demo.py
--- face_recognition_demo.org/face_recognition_demo.py	2019-11-20 05:58:14.497000000 +0900
+++ face_recognition_demo/face_recognition_demo.py	2019-11-27 06:29:07.507574900 +0900
@@ -62,6 +62,10 @@
     gallery.add_argument('--run_detector', action='store_true',
                          help="(optional) Use Face Detection model to find faces" \
                          " on the face images, otherwise use full images.")
+    gallery.add_argument('--run_detector_no_save', action='store_true',
+                         help="(optional) Use Face Detection model to find faces" \
+                         " on the face images, otherwise use full images." \
+                         " not save detected face image.")
 
     models = parser.add_argument_group('Models')
     models.add_argument('-m_fd', metavar="PATH", default="", required=True,
@@ -142,7 +146,7 @@
         log.info("Building faces database using images from '%s'" % (args.fg))
         self.faces_database = FacesDatabase(args.fg, self.face_identifier,
                                             self.landmarks_detector,
-                                            self.face_detector if args.run_detector else None, args.no_show)
+                                            self.face_detector if args.run_detector or args.run_detector_no_save else None, args.no_show, args.run_detector_no_save)
         self.face_identifier.set_faces_database(self.faces_database)
         log.info("Database is built, registered %s identities" % \
             (len(self.faces_database)))
@@ -261,9 +265,8 @@
             .face_identifier.get_identity_label(identity.id)
 
         # Draw face ROI border
-        cv2.rectangle(frame,
-                      tuple(roi.position), tuple(roi.position + roi.size),
-                      (0, 220, 0), 2)
+        color1 = (0, 220, 0) if identity.id == FaceIdentifier.UNKNOWN_ID else (0, 0, 220)
+        cv2.rectangle(frame, tuple(roi.position), tuple(roi.position + roi.size), color1, 2)
 
         # Draw identity label
         text_scale = 0.5
@@ -398,19 +401,17 @@
         try:
             stream = int(path)
         except ValueError:
-            pass
+            # 数字でなければ絶対パスに変換
+            stream = osp.abspath(path)
         return cv2.VideoCapture(stream)
 
     @staticmethod
     def open_output_stream(path, fps, frame_size):
         output_stream = None
         if path != "":
-            if not path.endswith('.avi'):
-                log.warning("Output file extension is not 'avi'. " \
-                        "Some issues with output can occur, check logs.")
+            forcc = cv2.VideoWriter.fourcc(*'mp4v') if path.endswith('.mp4') else cv2.VideoWriter.fourcc(*'MJPG')
             log.info("Writing output to '%s'" % (path))
-            output_stream = cv2.VideoWriter(path,
-                                            cv2.VideoWriter.fourcc(*'MJPG'), fps, frame_size)
+            output_stream = cv2.VideoWriter(path, forcc, fps, frame_size)
         return output_stream
 
 
diff -ur face_recognition_demo.org/faces_database.py face_recognition_demo/faces_database.py
--- face_recognition_demo.org/faces_database.py	2019-11-20 05:58:14.497000000 +0900
+++ face_recognition_demo/faces_database.py	2019-11-20 06:31:13.481819754 +0900
@@ -36,10 +36,11 @@
         def cosine_dist(x, y):
             return cosine(x, y) * 0.5
 
-    def __init__(self, path, face_identifier, landmarks_detector, face_detector=None, no_show=False):
+    def __init__(self, path, face_identifier, landmarks_detector, face_detector=None, no_show=False, no_db_save=False):
         path = osp.abspath(path)
         self.fg_path = path
         self.no_show = no_show
+        self.no_db_save = no_db_save
         paths = []
         if osp.isdir(path):
             paths = [osp.join(path, f) for f in os.listdir(path) \
@@ -96,7 +97,7 @@
                     self.add_item(descriptor, label)
 
     def ask_to_save(self, image):
-        if self.no_show:
+        if self.no_show or self.no_db_save:
             return None
         save = False
         label = None
@@ -209,12 +210,14 @@
             match = len(self.database)-1
         else:
             filename = "{}-{}.jpg".format(label, len(self.database[match].descriptors)-1)
-        filename = osp.join(self.fg_path, filename)
-
-        log.debug("Dumping image with label {} and path {} on disk.".format(label, filename))
-        if osp.exists(filename):
-            log.warning("File with the same name already exists at {}. So it won't be stored.".format(self.fg_path))
-        cv2.imwrite(filename, image)
+        
+        if name :
+            filename = osp.join(self.fg_path, filename)
+            log.info("Dumping image with label {} and path {} on disk.".format(label, filename))
+            if osp.exists(filename):
+                log.warning("File with the same name already exists at {}. So it won't be stored.".format(self.fg_path))
+            else :
+                cv2.imwrite(filename, image)
         return match
 
     def add_item(self, desc, label):
```




# 前準備

識別したい顔の画像を適当なディレクトリに保存しておく。ファイル形式はjpgまたはpng。  
一人ずつ1画像で顔部分のみ切り出しておく。  
複数の人の顔を識別したい場合はそれぞれ別々に保存しておく。  


# デモ実行

## 実行用スクリプトの作成

実行コマンドが長ったらしくて入力が面倒なので、以下のスクリプト(demo.sh)を作成しておく。  
UbuntuとRaspberrypiを識別して自動でコマンドオプションを変更するようにしてある。 
作成したら実行属性を付与しておく。  

```bash
#!/bin/bash

cmd="face_recognition_demo.py"

opt="       -m_fd models/face-detection-retail-0004.xml"
opt="${opt} -m_lm models/landmarks-regression-retail-0009.xml"
opt="${opt} -m_reid models/face-reidentification-retail-0095.xml"

if [ `uname -m` == "armv7l" ] ; then
    echo "Raspberry Pi"
    opt="${opt} -d_fd MYRIAD"
    opt="${opt} -d_lm MYRIAD"
    opt="${opt} -d_reid MYRIAD"
else
    echo "Ubuntu"
    opt="${opt} --cpu_lib /opt/intel/openvino/deployment_tools/inference_engine/lib/intel64/libcpu_extension_avx2.so"
fi


if [ $# -eq 0 -o $# -eq 1 ]; then
	# パラメータなし/1個はエラー
    echo -e "\n==== usage ===="
    echo -e "$0 database_dir input_file [other option(s)]\n\n\n"
    exit 1
else
    opt="${opt} -fg ${1} --input ${2}"
    # 3番目以降すべてのパラメータを追加
    opt="${opt} ${@:3:($#-2)}"
fi
echo "python ${cmd} ${opt}"
python ${cmd} ${opt}
```


## 実行例

第1パラメータに識別子する顔画像を保存したディレクトリ、第2パラメータに入力ビデオファイル名を指定する。  
これらのパラメータは省略不可。  
追加でオプションを指定したい場合は第3パラメータ以降に指定する。  
たとえば、こんな感じ。  

```bash
./demo.sh data data/video.mp4  --output result.mp4
```

## ヘルプ表示

使用できるオプションはヘルプ表示で。

```bash
python face_recognition_demo.py -h
usage: face_recognition_demo.py [-h] [-i PATH] [-o PATH] [--no_show] [-tl]
                                [-cw CROP_WIDTH] [-ch CROP_HEIGHT] -fg PATH
                                [--run_detector] [--run_detector_no_save]
                                -m_fd PATH -m_lm PATH -m_reid PATH
                                [-d_fd {CPU,GPU,FPGA,MYRIAD,HETERO,HDDL}]
                                [-d_lm {CPU,GPU,FPGA,MYRIAD,HETERO,HDDL}]
                                [-d_reid {CPU,GPU,FPGA,MYRIAD,HETERO,HDDL}]
                                [-l PATH] [-c PATH] [-v] [-pc] [-t_fd [0..1]]
                                [-t_id [0..1]] [-exp_r_fd NUMBER]
                                [--allow_grow]

optional arguments:
  -h, --help            show this help message and exit

General:
  -i PATH, --input PATH
                        (optional) Path to the input video ('0' for the
                        camera, default)
  -o PATH, --output PATH
                        (optional) Path to save the output video to
  --no_show             (optional) Do not display output
  -tl, --timelapse      (optional) Auto-pause after each frame
  -cw CROP_WIDTH, --crop_width CROP_WIDTH
                        (optional) Crop the input stream to this width
                        (default: no crop). Both -cw and -ch parameters should
                        be specified to use crop.
  -ch CROP_HEIGHT, --crop_height CROP_HEIGHT
                        (optional) Crop the input stream to this height
                        (default: no crop). Both -cw and -ch parameters should
                        be specified to use crop.

Faces database:
  -fg PATH              Path to the face images directory
  --run_detector        (optional) Use Face Detection model to find faces on
                        the face images, otherwise use full images.
  --run_detector_no_save
                        (optional) Use Face Detection model to find faces on
                        the face images, otherwise use full images. not save
                        detected face image.

Models:
  -m_fd PATH            Path to the Face Detection model XML file
  -m_lm PATH            Path to the Facial Landmarks Regression model XML file
  -m_reid PATH          Path to the Face Reidentification model XML file

Inference options:
  -d_fd {CPU,GPU,FPGA,MYRIAD,HETERO,HDDL}
                        (optional) Target device for the Face Detection model
                        (default: CPU)
  -d_lm {CPU,GPU,FPGA,MYRIAD,HETERO,HDDL}
                        (optional) Target device for the Facial Landmarks
                        Regression model (default: CPU)
  -d_reid {CPU,GPU,FPGA,MYRIAD,HETERO,HDDL}
                        (optional) Target device for the Face Reidentification
                        model (default: CPU)
  -l PATH, --cpu_lib PATH
                        (optional) For MKLDNN (CPU)-targeted custom layers, if
                        any. Path to a shared library with custom layers
                        implementations
  -c PATH, --gpu_lib PATH
                        (optional) For clDNN (GPU)-targeted custom layers, if
                        any. Path to the XML file with descriptions of the
                        kernels
  -v, --verbose         (optional) Be more verbose
  -pc, --perf_stats     (optional) Output detailed per-layer performance stats
  -t_fd [0..1]          (optional) Probability threshold for face
                        detections(default: 0.6)
  -t_id [0..1]          (optional) Cosine distance threshold between two
                        vectors for face identification (default: 0.3)
  -exp_r_fd NUMBER      (optional) Scaling ratio for bboxes passed to face
                        recognition (default: 1.15)
  --allow_grow          (optional) Allow to grow faces gallery and to dump on
                        disk. Available only if --no_show option is off.
```

主なオプションの意味は以下の通り。  


### ``-m_fd``

必須。  
顔位置検出モデルファイル

### ``ｰm_lm``

必須。  
顔特徴点検出モデルファイル  

### ``-m_reid``

必須。  
顔識別モデルファイル  

### ``-d_fd``

顔位置検出に使用するデバイス。省略時はCPU。

### ``-d_lm``

顔特徴点検出に使用するデバイス。省略時はCPU。

### ``-d_reid``

顔識別に使用するデバイス。省略時はCPU。

### ``--cpu_lib``

CPU用カスタムレイヤライブラリ(?)ファイル

### ``--gpu_lib``

GPU用カスタムレイヤライブラリ(?)ファイル(使ったことないからワカラン)

### ``-fg``

必須。  
識別する顔画像を格納したディレクトリ  
このディレクトリ内のjpg、pngファイルのみ抽出してくれるので、他のファイルが混在しても大丈夫。  

### ``--input``

必須。  
入力ファイル(動画ファイル)を指定する。   
静止画でもエラーにならないが、一瞬で消えるので、オプション --timelapse でキー入力待ちにするか、
オプション --outputでファイル出力すると確認できる。  
省略時はカメラが指定される。

### ``--output``

認識結果をファイルに出力する。  
指定しなければファイルは作成されない(表示のみ)。 
拡張子がmp4のときはMP4(追加した処理)。  
それ以外はMJPEGで保存(aviにするのが望ましい。それ以外だとffmpegがなんか言うがファイルはできてるっぽい)。  

### ``--no_show``

画像表示しない。  
通常は--outputと組み合わせて使う。  

### ``--timelapse`` 

1フレーム表示するごとにキー入力待ちになる。  

### ``--crop_width``、``--crop_height``

入力画像を指定したサイズに切り取る。切り取る場所は元画像の中心。  
両方指定しないと無効。  

### ``--run_detector``

オプションを指定するとデータベース作成時に顔検出して新たに顔画像を作成してくれる。  
データベースファイルが全身画像だったり、複数人数が一緒に写っていてもOK。  
1回指定すれば画像が残っているので以降は指定しなくても良い。  

### ``--run_detector_no_save``

追加したオプション  
指定するとデータベース作成時に顔検出するが、顔画像の保存はしない。  

### ``--verbose`` 

指定するとloglevelがDEBUGになる  

### ``--perf_stats`` 

指定するとフレーム毎にパフォーマンスステータスを表示する  

### ``-t_fd``

顔位置検出に使用する閾値。省略時は0.6。

### ``-t_reid``

顔識別に使用する閾値。省略時は0.3。

### ``-exp_r_fd``

顔位置検出した枠のサイズを何倍にするか。ギリギリだとうまく行かないから？省略時は1.15

### ``--allow_grow`` 

認識画像で知らない顔が出てきたらその都度登録するか確認する。


