---
title: MediaPipeで手の認識
date: 2022-03-17
tags: ["python", "MediaPipe"]
excerpt: MediaPipe Handsで手の認識処理をやってみる
---

# 概要

MediaPipe Handsを使って手の認識処理を行ってみる。  
MediaPipeを使用するとかなり簡単に手の特徴点を取得できる。  
また、各特徴点の位置がわかるので、それらの位置関係からポーズを取得することもできる。  

参考： <https://google.github.io/mediapipe/solutions/hands.html>{:target="_blank"}  


# 準備

## python仮想環境の準備
```bash
# 作業ディレクトリ作成
mkdir -p /work/ble/mediapipe
cd /work/ble/mediapipe

# 仮想環境構築
pyenv virtualenv 3.8.11 mediapipe
pyenv local mediapipe
pip install --upgrade pip setuptools wheel

# 必要なライブラリのインストール
pip install mediapipe
```

# プログラム
## 共通ルーチン

各指の関節と指先の位置関係から指が伸びているのか、曲がっているのかを判別し(親指だけは各関節の角度から判別)、  
その組み合わせからどのようなポーズなのかを判別している。  
アルゴリズムは <https://github.com/geaxgx/openvino_hand_tracker> から拝借した。  
元のプログラムは各関節の位置を検出された手の画像を回転して角度調整した画像のY座標から取得しているが、  
今回は手の角度が分からないので、手首から各関節位置までの距離を比較するように変更した。  

{% include filename.html filename="hand_gesture.py" %}
```python
import numpy as np
import mediapipe as mp
mp_hands = mp.solutions.hands
HandLandmark = mp_hands.HandLandmark


def distance(a, b):
    # a, b: 2 points in 3D (x,y,z)
    return np.linalg.norm(a - b)

def angle(a, b, c):
    # a, b and c : points as np.array([x, y, z]) 
    ba = a - b
    bc = c - b
    cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
    angle = np.arccos(cosine_angle)
    
    return np.degrees(angle)

# ジェスチャの認識
# 参考： https://github.com/geaxgx/openvino_hand_tracker
def recognize_gesture(landmarks, image_height, image_width, debug = False):
    # 各landmarkの手首からの距離を求める
    lm_pos = np.array([[lm.x, lm.y, lm.z] for lm in landmarks.landmark])    # 計算のためndarray化
    # lm_pos = np.array([[lm.x, lm.y] for lm in landmarks.landmark])          # 計算のためndarray化(zは無視)
    r_ = np.linalg.norm(lm_pos - lm_pos[HandLandmark.WRIST], axis=1)        # numpyなので一括計算
    
    # 親指の角度で状態判別
    distance0 = distance(lm_pos[HandLandmark.THUMB_IP],     lm_pos[HandLandmark.INDEX_FINGER_MCP])     # 親指の第二関節と人差し指の付け根の距離
    distance1 = distance(lm_pos[HandLandmark.THUMB_MCP],    lm_pos[HandLandmark.THUMB_IP]        )     # 親指の付け根と親指の第二関節の距離
    angle0 = angle(lm_pos[HandLandmark.WRIST],      lm_pos[HandLandmark.THUMB_CMC], lm_pos[HandLandmark.THUMB_MCP])     # 親指付け根の角度
    angle1 = angle(lm_pos[HandLandmark.THUMB_CMC],  lm_pos[HandLandmark.THUMB_MCP], lm_pos[HandLandmark.THUMB_IP] )     # 親指第二関節の角度
    angle2 = angle(lm_pos[HandLandmark.THUMB_MCP],  lm_pos[HandLandmark.THUMB_IP],  lm_pos[HandLandmark.THUMB_TIP])     # 親指第一関節の角度
    thumb_angle = angle0 + angle1 + angle2
    if thumb_angle > 460 and distance0 / distance1 > 1.2: 
        thumb_state = 1
    else:
        thumb_state = 0
    
    # 人差し指の状態
    if r_[HandLandmark.INDEX_FINGER_TIP] > r_[HandLandmark.INDEX_FINGER_DIP] > r_[HandLandmark.INDEX_FINGER_PIP] :
        index_state = 1
    elif r_[HandLandmark.INDEX_FINGER_PIP] > r_[HandLandmark.INDEX_FINGER_TIP] :
        index_state = 0
    else :
        index_state = -1

    # 中指の状態
    if r_[HandLandmark.MIDDLE_FINGER_TIP] > r_[HandLandmark.MIDDLE_FINGER_DIP] > r_[HandLandmark.MIDDLE_FINGER_PIP] :
        middle_state = 1
    elif r_[HandLandmark.MIDDLE_FINGER_PIP] > r_[HandLandmark.MIDDLE_FINGER_TIP] :
        middle_state = 0
    else :
        middle_state = -1

    # 薬指の状態
    if r_[HandLandmark.RING_FINGER_TIP] > r_[HandLandmark.RING_FINGER_DIP] > r_[HandLandmark.RING_FINGER_PIP] :
        ring_state = 1
    elif r_[HandLandmark.RING_FINGER_PIP] > r_[HandLandmark.RING_FINGER_TIP] :
        ring_state = 0
    else :
        ring_state = -1

    # 小指の状態
    if r_[HandLandmark.PINKY_TIP] > r_[HandLandmark.PINKY_DIP] > r_[HandLandmark.PINKY_PIP] :
        pinky_state = 1
    elif r_[HandLandmark.PINKY_PIP] > r_[HandLandmark.PINKY_TIP] :
        pinky_state = 0
    else :
        pinky_state = -1

    # Gesture
    if thumb_state == 0 and index_state == 0 and middle_state == 0 and ring_state == 0 and pinky_state == 0:
        gesture = "FIST"
    elif thumb_state == 1 and index_state == 0 and middle_state == 0 and ring_state == 0 and pinky_state == 0:
        gesture = "OK" 
    elif thumb_state == 0 and index_state == 1 and middle_state == 1 and ring_state == 0 and pinky_state == 0:
        gesture = "PEACE"
    elif thumb_state == 0 and index_state == 1 and middle_state == 0 and ring_state == 0 and pinky_state == 0:
        gesture = "ONE"
    elif thumb_state == 1 and index_state == 1 and middle_state == 0 and ring_state == 0 and pinky_state == 0:
        gesture = "TWO"
    elif thumb_state == 1 and index_state == 1 and middle_state == 1 and ring_state == 0 and pinky_state == 0:
        gesture = "THREE"
    elif thumb_state == 0 and index_state == 1 and middle_state == 1 and ring_state == 1 and pinky_state == 0:      # 日本型の3
        gesture = "THREE_J"
    elif thumb_state == 0 and index_state == 1 and middle_state == 1 and ring_state == 1 and pinky_state == 1:
        gesture = "FOUR"
    elif thumb_state == 1 and index_state == 1 and middle_state == 1 and ring_state == 1 and pinky_state == 1:
        gesture = "FIVE"
    else:
        gesture = None
    
    # for debug
    # print(f'{r_[HandLandmark.INDEX_FINGER_MCP]:6.3f}  {r_[HandLandmark.INDEX_FINGER_PIP]:6.3f}  {r_[HandLandmark.INDEX_FINGER_DIP]:6.3f}  {r_[HandLandmark.INDEX_FINGER_TIP]:6.3f}    {index_state}')

    if debug :
        for i in range(21):
            lm_x = landmarks.landmark[i].x # * image_width
            lm_y = landmarks.landmark[i].y # * image_height
            lm_z = landmarks.landmark[i].z
            print(f'{str(HandLandmark(i)):32s}({i:2d}):   {lm_x:9.3f}, {lm_y:9.3f},{lm_z:9.3f} {r_[i]:6.3f}')
    
    return gesture
```




## カメラ画像から認識
カメラ画像から認識してみる。  
こっちの方が用途は多いかな。  
コマンドラインオプションについてはソース見てちょ。  

{% include filename.html filename="test_camera.py" %}
```python
# 参考：
# https://google.github.io/mediapipe/solutions/hands.html

import cv2
import time
import mediapipe as mp
import numpy as np
from argparse import ArgumentParser
from hand_gesture import recognize_gesture

mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

def build_argparser():
    parser = ArgumentParser()
    parser.add_argument('-v', '--verbose',  action='store_true',                help="(optional) disp verbose message")
    parser.add_argument('--detail',         action='store_true',                help="(optional) use full model")
    parser.add_argument("-nh", "--num_hand",         default=2,   type=int,     help="(optional) Max number of hands")
    parser.add_argument("-dt", "--detect_threshold", default=0.5, type=float,   help="(optional) Detection threshold")
    parser.add_argument("-tt", "--track_threshold",  default=0.5, type=float,   help="(optional) Tracking threshold")
    
    return parser

# コマンドラインパラメータの取得
args = build_argparser().parse_args()

# mediapipe パラメータ
model_complexity         = 1 if args.detail else 0  # 0: liteモデル /1: fullモデル
max_num_hands            = args.num_hand            # 検出する手の個数
min_detection_confidence = args.detect_threshold    # 閾値
min_tracking_confidence  = args.track_threshold     # 閾値
verbose                  = args.verbose             # デバッグメッセージ
verbose2                 = args.verbose
use_mirror_image         = True                    # 鏡像使用

print(f'max_num_hands:{max_num_hands}   model_complexity:{model_complexity}    min_detection_confidence:{min_detection_confidence}    min_tracking_confidence:{min_tracking_confidence}')

# カメラ
cap = cv2.VideoCapture(0)

# mediapipeのオープン
with mp_hands.Hands(
                        static_image_mode   = False,            # 動画モード
                        max_num_hands    = max_num_hands,       # 検出する手の個数
                        model_complexity = model_complexity,    # 0: liteモデル /1: fullモデル
                        min_detection_confidence = min_detection_confidence,    # 閾値
                        min_tracking_confidence  = min_tracking_confidence      # 閾値
        ) as hands:
    
    prev_time = time.time()                              # 前のフレーム処理完了時刻を初期化
    
    while cap.isOpened():
        # キャプチャ
        success, image = cap.read()
        if not success:
            # エラーになったら再度キャプチャ
            print("Ignoring empty camera frame.")
            continue
        
        # 鏡像表示する場合は左右反転する
        if use_mirror_image :
            image = cv2.flip(image, 1)
        
        # 画像サイズ
        image_height, image_width, _ = image.shape
        
        # BGR画像をRGB画像に変換して認識処理
        results = hands.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
        
        # 検出結果の処理
        if results.multi_hand_landmarks:
            for hand_landmarks, handedness in zip(results.multi_hand_landmarks, results.multi_handedness):
                if verbose or verbose2 :
                    print('--------------------------------------------------------------------------')
                
                # データは鏡像として判別されているので、鏡像でなければラベルを入れ替え
                if use_mirror_image :
                    label = handedness.classification[0].label
                else :
                    if handedness.classification[0].label == "Left" :
                        label = "Right"
                    else :
                        label = "Left"
                
                # ジェスチャの認識
                gesture = recognize_gesture(hand_landmarks, image_height, image_width, verbose)
                
                if verbose2 :
                    print('==== sore =======================')
                    print(f'index   : {handedness.classification[0].index}')
                    print(f'score   : {handedness.classification[0].score}')
                    print(f'label   : {handedness.classification[0].label}')            # あんまりあてにならないな...
                    print(f'gesture : {gesture}')
                    print('=================================')
                
                # landmarkの描画
                mp_drawing.draw_landmarks(
                    image,                              # 画像
                    hand_landmarks,                     # ランドマーク
                    mp_hands.HAND_CONNECTIONS,          # ランドマーク接続リスト
                    mp_drawing_styles.get_default_hand_landmarks_style(),       # ランドマーク描画スタイル
                    mp_drawing_styles.get_default_hand_connections_style()      # 接続描画スタイル
                )
                # ジェスチャ表示
                if gesture :
                    # 人差し指の付け根あたりに表示
                    x = int(hand_landmarks.landmark[mp_hands.HandLandmark.INDEX_FINGER_MCP ].x * image_width)
                    y = int(hand_landmarks.landmark[mp_hands.HandLandmark.INDEX_FINGER_MCP ].y * image_height)
                    cv2.putText(
                        image,                      # 画像
                        f'{gesture}   {label}',     # 文字列
                        (x, y),                     # 座標
                        cv2.FONT_HERSHEY_SIMPLEX,   # フォント
                        1,                          # フォントスケール
                        (0, 0, 255),                # 色
                        2,                          # 文字の太さ
                        cv2.LINE_AA                 # 描画アルゴリズム
                    )
        
        # フレーム処理時間
        cur_time = time.time()                              # 現在のフレーム処理完了時刻
        frame_time = cur_time - prev_time                   # このフレームの処理時間
        prev_time = cur_time
        
        # FPS表示
        cv2.putText(
                image,                      # 画像
                f'FPS:{1/frame_time:.2f}',  # 文字列
                (0, 50),                    # 座標
                cv2.FONT_HERSHEY_SIMPLEX,   # フォント
                2,                          # フォントスケール
                (0, 0, 255),                # 色
                2,                          # 文字の太さ
                cv2.LINE_AA                 # 描画アルゴリズム
            )
        cv2.imshow('MediaPipe Hands', image)
        
        # 表示終了待ち
        k = cv2.waitKey(1)
        if k == ord('v'):
            verbose = not verbose
        if k == ord('b'):
            verbose2 = not verbose2
        if k == ord('q') or k == 27:
            break

# ウィンドウをすべて閉じる
cv2.destroyAllWindows()

# カメラリリース
cap.release()
```


## 静止画像から認識

デバッグ用途など、静止画から認識する場合はこちら。  


{% include filename.html filename="test_photo.py" %}
```python
# 参考：
# https://google.github.io/mediapipe/solutions/hands.html

import cv2
import time
import mediapipe as mp
import numpy as np
from argparse import ArgumentParser
from hand_gesture import recognize_gesture

mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

def build_argparser():
    parser = ArgumentParser()
    parser.add_argument('input', metavar="INPUT_FILE",                          help="Path to the input picture ")
    parser.add_argument('-v', '--verbose', action='store_true',                 help="(optional) disp verbose message")
    parser.add_argument('--detail', action='store_true',                        help="(optional) use full model")
    parser.add_argument('--world', action='store_true',                         help="(optional) disp world landmark map")
    parser.add_argument("-nh", "--num_hand",         default=2,   type=int,     help="(optional) Max number of hands")
    parser.add_argument("-dt", "--detect_threshold", default=0.5, type=float,   help="(optional) Detection threshold")
    parser.add_argument("-tt", "--track_threshold",  default=0.5, type=float,   help="(optional) Tracking threshold")
    
    return parser

# コマンドラインパラメータの取得
args = build_argparser().parse_args()

# 入力ファイル名
file = args.input

# mediapipe パラメータ
model_complexity         = 1 if args.detail else 0  # 0: liteモデル /1: fullモデル
max_num_hands            = args.num_hand            # 検出する手の個数
min_detection_confidence = args.detect_threshold    # 閾値
min_tracking_confidence  = args.track_threshold     # 閾値
verbose                  = args.verbose             # デバッグメッセージ
use_mirror_image         = False                    # 鏡像使用しない

print(f'max_num_hands:{max_num_hands}   model_complexity:{model_complexity}    min_detection_confidence:{min_detection_confidence}    min_tracking_confidence:{min_tracking_confidence}')

# mediapipeのオープン
with mp_hands.Hands(
                        static_image_mode = True,               # 静止画モード
                        max_num_hands    = max_num_hands,       # 検出する手の個数
                        model_complexity = model_complexity,    # 0: liteモデル /1: fullモデル
                        min_detection_confidence = min_detection_confidence,    # 閾値
                        min_tracking_confidence  = min_tracking_confidence      # 閾値
                    ) as hands:
    
    # 画像読み込み
    image = cv2.imread(file)
    print(f'file name : {file}   image size : {image.shape}')
    
    # 鏡像表示する場合は左右反転する
    if use_mirror_image :
        image = cv2.flip(image, 1)
    
    # 画像サイズ
    image_height, image_width, _ = image.shape
    
    # BGR画像をRGB画像に変換して認識処理
    results = hands.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    
    # 検出結果の処理
    if results.multi_hand_landmarks:
        for hand_landmarks, handedness in zip(results.multi_hand_landmarks, results.multi_handedness):
            if verbose :
                print('--------------------------------------------------------------------------')
            
            # データは鏡像として判別されているので、鏡像でなければラベルを入れ替え
            if use_mirror_image :
                label = handedness.classification[0].label
            else :
                if handedness.classification[0].label == "Left" :
                    label = "Right"
                else :
                    label = "Left"
            
            # ジェスチャの認識
            gesture = recognize_gesture(hand_landmarks, image_height, image_width, verbose)
            
            print('==== sore =======================')
            print(f'index   : {handedness.classification[0].index}')
            print(f'score   : {handedness.classification[0].score}')
            print(f'label   : {label}')
            print(f'gesture : {gesture}')
            print('=================================')
            
            # landmarkの描画
            mp_drawing.draw_landmarks(
                image,                              # 画像
                hand_landmarks,                     # ランドマーク
                mp_hands.HAND_CONNECTIONS,          # ランドマーク接続リスト
                mp_drawing_styles.get_default_hand_landmarks_style(),       # ランドマーク描画スタイル
                mp_drawing_styles.get_default_hand_connections_style()      # 接続描画スタイル
            )
            # ジェスチャ表示
            if gesture :
                # 人差し指の付け根あたりに表示
                x = int(hand_landmarks.landmark[mp_hands.HandLandmark.INDEX_FINGER_MCP ].x * image_width)
                y = int(hand_landmarks.landmark[mp_hands.HandLandmark.INDEX_FINGER_MCP ].y * image_height)
                cv2.putText(
                    image,                      # 画像
                    f'{gesture}   {label}',     # 文字列
                    (x, y),                     # 座標
                    cv2.FONT_HERSHEY_SIMPLEX,   # フォント
                    1,                          # フォントスケール
                    (0, 0, 255),                # 色
                    2,                          # 文字の太さ
                    cv2.LINE_AA                 # 描画アルゴリズム
                )
    else:
        print("** NO HANDS **")
    
    # 表示
    cv2.imshow('MediaPipe Hands', image)
    
    # 表示終了待ち
    while True:
        k = cv2.waitKey(1)
        if k == ord('p') :
            cv2.imwrite(
                    'output_' + str(file), 
                    image
                )
        elif not k < 0:
          break
    
    # ウィンドウをすべて閉じる
    cv2.destroyAllWindows()
    
    if args.world :
        # hand world landmarks の 3D座標の表示
        if results.multi_hand_world_landmarks:
            for hand_world_landmarks in results.multi_hand_world_landmarks:
                mp_drawing.plot_landmarks(
                                hand_world_landmarks, 
                                mp_hands.HAND_CONNECTIONS, 
                                azimuth=5
                            )
```



# 実行
## カメラ画像から認識
```bash
usage: test_camera.py [-h] [-v] [--detail] [-nh NUM_HAND]
                      [-dt DETECT_THRESHOLD] [-tt TRACK_THRESHOLD]

optional arguments:
  -h, --help            show this help message and exit
  -v, --verbose         (optional) disp verbose message
  --detail              (optional) use full model
  -nh NUM_HAND, --num_hand NUM_HAND
                        (optional) Max number of hands
  -dt DETECT_THRESHOLD, --detect_threshold DETECT_THRESHOLD
                        (optional) Detection threshold
  -tt TRACK_THRESHOLD, --track_threshold TRACK_THRESHOLD
                        (optional) Tracking threshold
```


## 静止画像から認識
```bash
usage: test_photo.py [-h] [-v] [--detail] [--world] [-nh NUM_HAND]
                     [-dt DETECT_THRESHOLD] [-tt TRACK_THRESHOLD]
                     INPUT_FILE

positional arguments:
  INPUT_FILE            Path to the input picture

optional arguments:
  -h, --help            show this help message and exit
  -v, --verbose         (optional) disp verbose message
  --detail              (optional) use full model
  --world               (optional) disp world landmark map
  -nh NUM_HAND, --num_hand NUM_HAND
                        (optional) Max number of hands
  -dt DETECT_THRESHOLD, --detect_threshold DETECT_THRESHOLD
                        (optional) Detection threshold
  -tt TRACK_THRESHOLD, --track_threshold TRACK_THRESHOLD
                        (optional) Tracking threshold
```

# 説明

説明....するほどのことはないな。  
ほとんど出来あいの処理。  

各指の状態からポーズを取得する処理を変更すれば、ほかの認識(ジャンケン認識など)にも変更可能。  
また、人差し指の指先をトラッキングしていけば、バーチャルお絵描きなんてのもできるかも。  
