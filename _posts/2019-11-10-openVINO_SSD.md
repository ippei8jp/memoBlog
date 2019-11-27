---
title: openVINO でSSD
date: 2019-11-10
tags: ["DeepLearning", "openVINO", "Ubuntu", "RaspberryPi"]
excerpt: openVINOのSSDのサンプルプログラムを動かしてみる
---


YOLOとは別のアルゴリズムSSDで物体認識するサンプルプログラムがあったので動かしてみた。  
サンプルプログラムはフルパッケージにしか入ってないので、元のプログラムはフルパッケージをインストールして確認してちょ。
/opt/intel/openvino/deployment_tools/open_model_zoo/demos/python_demos/object_detection_demo_ssd_async

pythonはpyenv環境で3.7.4を使用

以下は 
[openVINO フルパッケージをubuntuにインストール]({{ site.baseurl }}/2019/10/17/openVINO_ubuntu.html) 
にしたがって、openVINO フルパッケージ(2019 R3.1) をインストールしたubuntuでの作業。

#  モデルデータのダウンロード

``models.list``によると、以下のモデルデータが使用できるらしい。  

```
face-detection-adas-????
face-detection-adas-binary-????
face-detection-retail-????
pedestrian-and-vehicle-detector-adas-????
pedestrian-detection-adas-????
pedestrian-detection-adas-binary-????
person-detection-retail-????
vehicle-detection-adas-????
vehicle-detection-adas-binary-????
vehicle-license-plate-detection-barrier-????
```

ここでは、vehicle-detection-adas-binary-????を使ってみることにする。  

以下の手順でモデルデータをダウンロードする。  

```bash
models_dir=/work/NCS2/openvino_models/FP16
DL_URL1=https://download.01.org/opencv/2019/open_model_zoo/R3/20190905_163000_models_bin/pedestrian-and-vehicle-detector-adas-0001/FP16/pedestrian-and-vehicle-detector-adas-0001
wget ${DL_URL1}.bin -P ${models_dir}
wget ${DL_URL1}.xml -P ${models_dir}
```

ラベルデータは用意されていないので、ラベルデータを以下の内容で、``${models_diir}/pedestrian-and-vehicle-detector-adas-0001.labels``のファイル名で作成する。  
オリジナルでは``--label``オプションでラベルデータファイルを指定するようになっているが、
モデルデータファイルの拡張子を``.labels``に変更したものをデフォルトのラベルデータファイルとして認識するように変更しておいた。  

```
UNKNOWN
vehicles
pedestrians
UNKNOWN
```

どのIDが何を示すか書いてる場所を見つけられなかったんだよなぁ～。  
とりあえず、結果表示から推測するしかないか。  

## デモプログラムのソース

ちょっとのつもりで改造してたら、結構たくさんの変更になったので、ソース全体を掲載しておく。  
(RaspberryPiにはソース入ってないし)  
おもな変更点は以下  

- ``--save`` ``--log`` ``--sync`` ``--no_disp`` オプションの追加
- 結果解析部分の関数化(後でYOLOと比較しやすいように)

```python
#!/usr/bin/env python
"""
 Copyright (C) 2018-2019 Intel Corporation

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
"""

import sys
import os
from argparse import ArgumentParser, SUPPRESS
import cv2
import time
import logging as log
import numpy as np

from openvino.inference_engine import IENetwork, IECore

# コマンドラインパーサの構築
def build_argparser():
    parser = ArgumentParser(add_help=False)
    args = parser.add_argument_group('Options')
    args.add_argument('-h', '--help', action='help', default=SUPPRESS, help='Show this help message and exit.')
    args.add_argument("-m", "--model", help="Required. Path to an .xml file with a trained model.",
                      required=True, type=str)
    args.add_argument("-i", "--input",
                      help="Required. Path to a image/video file. (Specify 'cam' to work with camera)", 
                      required=True, type=str)
    args.add_argument("-l", "--cpu_extension",
                      help="Optional. Required for CPU custom layers. Absolute path to a shared library with "
                           "the kernels implementations.", type=str, default=None)
    args.add_argument("-d", "--device",
                      help="Optional. Specify the target device to infer on; CPU, GPU, FPGA, HDDL or MYRIAD is "
                           "acceptable. The demo will look for a suitable plugin for device specified. "
                           "Default value is CPU", default="CPU", type=str)
    args.add_argument("--labels", help="Optional. Labels mapping file", default=None, type=str)
    args.add_argument("-pt", "--prob_threshold", help="Optional. Probability threshold for detections filtering",
                      default=0.5, type=float)
    parser.add_argument("--save", help="Optional. Save result to specified file", default=None, type=str)
    parser.add_argument("--log", help="Optional. Save log to specified file", default=None, type=str)
    parser.add_argument("--sync", action='store_true', help="Optional. Sync mode")
    parser.add_argument("--no_disp", action='store_true', help="Optional. without image display")
    return parser

# 結果の解析と表示
def parse_result(net, res, frame, labels_map, args) :
    img_height, img_width = frame.shape[:2]
    out_blob = list(net.outputs.keys())[0]
    
    # print(res[out_blob].shape)
    #  -> (1, 1, 200, 7)        200:バウンディングボックスの数
    # データ構成は
    # https://docs.openvinotoolkit.org/2019_R1/_pedestrian_and_vehicle_detector_adas_0001_description_pedestrian_and_vehicle_detector_adas_0001.html
    # の「outputs」を参照
    for obj in res[out_blob][0][0]:     # このループは200回まわる
        conf = obj[2]                       # confidence for the predicted class(スコア)
        if conf > args.prob_threshold:      # 閾値より大きいものだけ処理
            class_id = int(obj[1])
            xmin = int(obj[3] * img_width)
            ymin = int(obj[4] * img_height)
            xmax = int(obj[5] * img_width)
            ymax = int(obj[6] * img_height)
            
            # 表示色
            # color = (min(class_id * 12.5, 255), min(class_id * 7, 255), min(class_id * 5, 255))
            if class_id == 1 :
                # class_id = 1のときは緑
                color = (128, 255, 128)
            else :
                # それ以外のときは赤
                color = (128, 128, 255)
            
            # ラベルが定義されていればラベルを読み出し、なければclass ID
            if labels_map :
                if len(labels_map) > class_id :
                    det_label = labels_map[class_id]
                else :
                    det_label = str(class_id)
            else :
                det_label = str(class_id)
            
            # バウンディングボックスとラベル、スコアを表示
            cv2.rectangle(frame, (xmin, ymin), (xmax, ymax), color, 2)
            cv2.putText(frame, f"{det_label} {round(conf * 100, 1)}%", (xmin, ymin - 7), cv2.FONT_HERSHEY_COMPLEX, 0.4, color, 1)
    return

def main():
    log.basicConfig(format="[ %(levelname)s ] %(message)s", level=log.INFO, stream=sys.stdout)
    args = build_argparser().parse_args()
    
    model_xml = args.model
    model_bin = os.path.splitext(model_xml)[0] + ".bin"
    
    no_disp = args.no_disp
    
    model_label = None
    if args.labels:
        model_label = args.labels
    else:
        model_label = os.path.splitext(model_xml)[0] + ".labels"
    if not os.path.isfile(model_label)  :
        model_label = None
    
    # ------------- 1. Plugin initialization for specified device and load extensions library if specified -------------
    log.info("Creating Inference Engine...")
    ie = IECore()
    if args.cpu_extension and 'CPU' in args.device:
        ie.add_extension(args.cpu_extension, "CPU")
    
    # -------------------- 2. Reading the IR generated by the Model Optimizer (.xml and .bin files) --------------------
    log.info(f"Loading network files:\n\t{model_xml}\n\t{model_bin}\n\t{model_label}")
    net = IENetwork(model=model_xml, weights=model_bin)
    
    # ---------------------------------- 3. Load CPU extension for support specific layer ------------------------------
    if "CPU" in args.device:
        supported_layers = ie.query_network(net, "CPU")
        not_supported_layers = [l for l in net.layers.keys() if l not in supported_layers]
        if len(not_supported_layers) != 0:
            log.error("Following layers are not supported by the plugin for specified device {}:\n {}".
                      format(args.device, ', '.join(not_supported_layers)))
            log.error("Please try to specify cpu extensions library path in sample's command line parameters using -l "
                      "or --cpu_extension command line argument")
            sys.exit(1)
    
    # ---------------------------------------------- 
    # print(net.outputs)
    assert len(net.outputs) == 1, "Demo supports only single output topologies"

    # ---------------------------------------------- 4. Preparing inputs -----------------------------------------------
    log.info("Preparing inputs")
    # print(net.inputs)
    # SSDのinputsは1とは限らないのでスキャンする
    img_info_input_blob = None
    for blob_name in net.inputs:
        # print(f'{blob_name}   {net.inputs[blob_name].shape}')
        if len(net.inputs[blob_name].shape) == 4:
            input_blob = blob_name
        elif len(net.inputs[blob_name].shape) == 2:
            img_info_input_blob = blob_name
        else:
            raise RuntimeError("Unsupported {}D input layer '{}'. Only 2D and 4D input layers are supported"
                               .format(len(net.inputs[blob_name].shape), blob_name))
    
    # Read and pre-process input image
    input_n, input_colors, input_height, input_width = net.inputs[input_blob].shape
    
    feed_dict = {}
    if img_info_input_blob:
        feed_dict[img_info_input_blob] = [input_height, input_width, 1]
    
    if args.input == 'cam':
        input_stream = 0
    else:
        input_stream = os.path.abspath(args.input)
        assert os.path.isfile(input_stream), "Specified input file doesn't exist"
    
    cap = cv2.VideoCapture(input_stream)
    
    # print(f'save flag : {args.save}')
    writer = None
    # 幅と高さを取得
    img_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    img_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    disp_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) + 90      # 情報表示領域分を追加
    # フレームレート(1フレームの時間単位はミリ秒)の取得
    frame_rate = int(cap.get(cv2.CAP_PROP_FPS))
    if args.save :
        # フォーマット
        fmt = cv2.VideoWriter_fourcc('m', 'p', '4', 'v')
        writer = cv2.VideoWriter(args.save, fmt, frame_rate, (img_width, disp_height))
    
    log_f = None
    if args.log :
        log_f = open(args.log, mode='w')
        log_f.write(f'frame_number, frame_time, preprocess_time, inf_time, parse_time, render_time, wait_time\n')     # 見出し行
    
    if model_label:
        with open(model_label, 'r') as f:
            labels_map = [x.strip() for x in f]
    else:
        labels_map = None
    
    cur_request_id = 0
    next_request_id = 1
    
    log.info("Starting inference in async mode...")
    is_async_mode = not args.sync

    number_input_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    number_input_frames = 1 if number_input_frames != -1 and number_input_frames < 0 else number_input_frames
    
    wait_key_code = 1
    
    # Number of frames in picture is 1 and this will be read in cycle. Sync mode is default value for this case
    if number_input_frames != 1:
        ret, frame = cap.read()
    else:
        is_async_mode = False
        wait_key_code = 0
    
    # ----------------------------------------- 5. Loading model to the plugin -----------------------------------------
    log.info("Loading model to the plugin")
    exec_net = ie.load_network(network=net, num_requests=2, device_name=args.device)

    # ----------------------------------------------- 6. Doing inference -----------------------------------------------
    log.info("Starting inference...")
    print("To close the application, press 'CTRL+C' here or switch to the output window and press ESC key")
    print("To switch between sync/async modes, press TAB key in the output window")
    
    frame_time = 0
    preprocess_time = 0
    inf_time = 0
    parse_time = 0
    render_time = 0
    prev_time = time.time()
    frame_number = 0
    
    while cap.isOpened():
        preprocess_start = time.time()
        if is_async_mode:
            ret, next_frame = cap.read()
        else:
            ret, frame = cap.read()
        if not ret:
            break
        
        # 表示用領域を含んだフレーム
        pad_img = np.zeros((disp_height, img_width, 3), np.uint8)
        preprocess_end = time.time()
        preprocess_time = preprocess_end - preprocess_start

        inf_start = time.time()
        if is_async_mode:
            request_id = next_request_id
            in_frame = cv2.resize(next_frame, (input_width, input_height))
        else:
            request_id = cur_request_id
            in_frame = cv2.resize(frame, (input_width, input_height))
        
        # resize input_frame to network size
        in_frame = in_frame.transpose((2, 0, 1))  # Change data layout from HWC to CHW
        in_frame = in_frame.reshape((input_n, input_colors, input_height, input_width))     # CHW→BCHW
        feed_dict[input_blob] = in_frame
        
        exec_net.start_async(request_id=request_id, inputs=feed_dict)
        if exec_net.requests[cur_request_id].wait(-1) == 0:
            inf_end = time.time()
            inf_time = inf_end - inf_start
            
            # Parse detection results of the current request
            parse_start = time.time()
            res = exec_net.requests[cur_request_id].outputs
            parse_result(net, res, frame, labels_map, args)
            parse_end = time.time()
            parse_time = parse_end - parse_start
            
            # Draw performance stats
            inf_time_message     = "Inference time: N\A for async mode" if is_async_mode else \
                                   "Inference time: {:.3f} ms".format(inf_time * 1000)
            frame_time_message   = "Frame time: {:.3f} ms".format(frame_time * 1000)
            render_time_message  = "OpenCV rendering time: {:.3f} ms".format(render_time * 1000)
            async_mode_message   = "Async mode is on. Processing request {}".format(cur_request_id) if is_async_mode else \
                                   "Async mode is off. Processing request {}".format(cur_request_id)
            parsing_time_message = "parse time is {:.3f}".format(parse_time * 1000)
            
            """
            cv2.putText(frame, inf_time_message,    (15, 15),                   cv2.FONT_HERSHEY_COMPLEX, 0.5, (200,  10,  10), 1)
            cv2.putText(frame, parsing_time_message,(15, 30),                   cv2.FONT_HERSHEY_COMPLEX, 0.5, ( 10,  10, 200), 1)
            cv2.putText(frame, render_time_message, (15, 45),                   cv2.FONT_HERSHEY_COMPLEX, 0.5, ( 10,  10, 200), 1)
            cv2.putText(frame, frame_time_message,  (10, int(img_height - 35)), cv2.FONT_HERSHEY_COMPLEX, 0.5, (200,  10,  10), 1)
            cv2.putText(frame, async_mode_message,  (10, int(img_height - 20)), cv2.FONT_HERSHEY_COMPLEX, 0.5, ( 10,  10, 200), 1)
            """
            cv2.putText(pad_img, inf_time_message,    (10, img_height + 15), cv2.FONT_HERSHEY_COMPLEX, 0.5, (255, 128, 128), 1)
            cv2.putText(pad_img, parsing_time_message,(10, img_height + 30), cv2.FONT_HERSHEY_COMPLEX, 0.5, (255, 128, 128), 1)
            cv2.putText(pad_img, render_time_message, (15, img_height + 45), cv2.FONT_HERSHEY_COMPLEX, 0.5, (255, 128, 128), 1)
            cv2.putText(pad_img, frame_time_message,  (10, img_height + 60), cv2.FONT_HERSHEY_COMPLEX, 0.5, (255, 128, 128), 1)
            cv2.putText(pad_img, async_mode_message,  (10, img_height + 75), cv2.FONT_HERSHEY_COMPLEX, 0.5, (255, 128, 128), 1)
        
        # 表示
        render_start = time.time()
        pad_img[:img_height, :img_width] = frame        # 表示用領域に画像をコピー
        
        if not no_disp :
            cv2.imshow("Detection Results", pad_img)        # 表示
        else :
            print(f'frame_number: {frame_number:5d}')
        
        if writer:
            # 保存が設定されているときは画像を保存
            writer.write(pad_img)
        
        render_end = time.time()
        render_time = render_end - render_start
        
        wait_start = time.time()
        if is_async_mode:
            # 非同期モードではフレームバッファ入れ替え
            cur_request_id, next_request_id = next_request_id, cur_request_id
            frame = next_frame
        
        key = cv2.waitKey(wait_key_code)
        if key == 27:
            # ESCキー
            break
        if key == 9:
            # TABキー
            exec_net.requests[cur_request_id].wait()    # ASYNC→SYNC切り替え時にREQUEST_BUSYでアボートする不具合の対策
            is_async_mode = not is_async_mode
            log.info("Switched to {} mode".format("async" if is_async_mode else "sync"))
        
        wait_end = time.time()
        wait_time = wait_end - wait_start
        
        cur_time = time.time()
        frame_time = cur_time - prev_time         # 1フレームの処理時間
        prev_time = cur_time
        if log_f :
            log_f.write(f'{frame_number:5d}, {frame_time * 1000:.3f}, {preprocess_time * 1000:.3f}, {inf_time * 1000:.3f}, {parse_time * 1000:.3f}, {render_time * 1000:.3f}, {wait_time * 1000:.3f}\n')
        frame_number = frame_number + 1
    
    # 後片付け
    if writer:
        writer.release()
    if log_f :
        log_f.close()
    cv2.destroyAllWindows()

if __name__ == '__main__':
    sys.exit(main() or 0)
```

# デモ実行

## ヘルプ表示

使用できるオプションはヘルプ表示で。

```bash
python object_detection_demo_ssd_async.py  -h

usage: object_detection_demo_ssd_async.py [-h] -m MODEL -i INPUT
                                          [-l CPU_EXTENSION] [-d DEVICE]
                                          [--labels LABELS]
                                          [-pt PROB_THRESHOLD] [--save SAVE]
                                          [--log LOG] [--sync] [--no_disp]

optional arguments:
  --save SAVE           Optional. Save result to specified file
  --log LOG             Optional. Save log to specified file
  --sync                Optional. Sync mode
  --no_disp             Optional. without image display

Options:
  -h, --help            Show this help message and exit.
  -m MODEL, --model MODEL
                        Required. Path to an .xml file with a trained model.
  -i INPUT, --input INPUT
                        Required. Path to a image/video file. (Specify 'cam'
                        to work with camera)
  -l CPU_EXTENSION, --cpu_extension CPU_EXTENSION
                        Optional. Required for CPU custom layers. Absolute
                        path to a shared library with the kernels
                        implementations.
  -d DEVICE, --device DEVICE
                        Optional. Specify the target device to infer on; CPU,
                        GPU, FPGA, HDDL or MYRIAD is acceptable. The demo will
                        look for a suitable plugin for device specified.
                        Default value is CPU
  --labels LABELS       Optional. Labels mapping file
  -pt PROB_THRESHOLD, --prob_threshold PROB_THRESHOLD
                        Optional. Probability threshold for detections
                        filtering
```


## 静止画の場合

buntuでの実行コマンドは以下。  
dataディレクトリに認識用の画像データを用意してある(以下同じ)。

```bash
models_dir=/work/NCS2/openvino_models/FP16
python object_detection_demo_ssd_async.py \
--model ${models_dir}/pedestrian-and-vehicle-detector-adas-0001.xml \
--cpu_extension /opt/intel/openvino/deployment_tools/inference_engine/lib/intel64/libcpu_extension_avx2.so \
--input ../../data/000004.jpg
```

RaspberryPiでの実行コマンドは以下。  

```bash
models_dir=/work/NCS2/openvino_models/FP16
python object_detection_demo_ssd_async.py \
--device MYRIAD \
--model ${models_dir}/pedestrian-and-vehicle-detector-adas-0001.xml \
--input ../../data/000004.jpg
```



## 動画の場合

ubuntuでの実行コマンドは以下。  
カメラからの入力を使用する場合は``--input cam``とするらしい。  

```bash
models_dir=/work/NCS2/openvino_models/FP16
python object_detection_demo_ssd_async.py \
--model ${models_dir}/pedestrian-and-vehicle-detector-adas-0001.xml \
--cpu_extension /opt/intel/openvino/deployment_tools/inference_engine/lib/intel64/libcpu_extension_avx2.so \
--input ../../data/testvideo3.mp4
```

RaspberryPiでの実行コマンドは以下。  

```bash
models_dir=/work/NCS2/openvino_models/FP16
python object_detection_demo_ssd_async.py \
--device MYRIAD \
--model ${models_dir}/pedestrian-and-vehicle-detector-adas-0001.xml \
--input ../../data/testvideo3.mp4
```

# おまけ

## 認識結果をMP4ファイルに保存する

``--save``オプションでファイル名を指定すると認識結果をファイルに保存する。  
上書き確認などは行わないので、ファイル名指定は注意すること。  


## 各処理の実行時間をファイルに記録する

``--log``オプションでファイル名を指定する。  
どこの実行時間かはソース参照してちょ。  

ファイルの内容はこんな感じ。  

```
frame_number, frame_time, preprocess_time, inf_time, parse_time, render_time, wait_time
    0, 178.326, 1.303, 0.000, 0.000, 153.768, 9.029
    1, 39.792, 1.131, 20.440, 1.309, 0.123, 16.418
    2, 132.989, 1.615, 125.333, 1.368, 0.125, 4.147
    3, 99.224, 1.106, 84.768, 1.487, 0.136, 11.368
    4, 78.163, 1.054, 73.622, 1.362, 0.156, 1.577
```

## 認識結果の画像を表示しない

``--no_disp``オプションを指定すると、認識結果の画像を表示しない。  
あまり使い道はないが、GUI環境がない場合に``--save``オプションとともに指定すると、GUIがない場合でも実行できる。  
(実際は、VS codeのリモート開発でデバッグ時に画像表示部分がエラーになってデバッグできなかったので、入れただけなんだけどね)


## 同期モードで実行する

TABキーを入力することで、非同期モード⇔同期モードを切り替えられるが、
実行開始時から同期モードで動作させたいときに``--sync``オプションを指定する。  
デフォルトでは非同期モードで実行。  

