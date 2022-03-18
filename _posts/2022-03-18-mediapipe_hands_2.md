---
title: MediaPipeの手の認識でお絵かき
date: 2022-03-18
tags: ["python", "MediaPipe"]
excerpt: MediaPipe Handsでの手の認識結果と使ってお絵かきしてみる
---

# 概要
MediaPipeで手の認識

『[ MediaPipeで手の認識 ]({{ site.baseurl }}/2022/03/17/mediapipe_hands.html){:target="_blank"}』の手の認識子処理を使って空間にお絵かきしてみる。  


# 準備
『[ MediaPipeで手の認識 ]({{ site.baseurl }}/2022/03/17/mediapipe_hands.html){:target="_blank"}』を参照。  

# プログラム
## 共通ルーチン
『[ MediaPipeで手の認識 ]({{ site.baseurl }}/2022/03/17/mediapipe_hands.html){:target="_blank"}』を参照。  





## お絵かきプログラム

お絵かきプログラム本体。  
人差し指先端に点を打っていくことでお絵かきしている。  
人差し指だけ立てた状態(ジェスチャ ONE)だと赤、人差し指と中指を立てた状態(ジェスチャ PEACE)だと緑で描画するようにしてあるが、この組み合わせにあまり意味はない。なんとなく色を切り替えてみたかったので。  
コマンドラインオプションと表示中操作についてはソース見てちょ。  

{% include filename.html filename="oekaki.py" %}
```python
# 参考：
# https://google.github.io/mediapipe/solutions/hands.html

import cv2
import time
import datetime
import mediapipe as mp
import numpy as np
from argparse import ArgumentParser
from hand_gesture import recognize_gesture

mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles
HandLandmark = mp_hands.HandLandmark

def build_argparser():
    parser = ArgumentParser()
    parser.add_argument('-v', '--verbose',  action='store_true',                help="(optional) disp verbose message")
    parser.add_argument('--detail',         action='store_true',                help="(optional) use full model")
#     parser.add_argument("-nh", "--num_hand",         default=2,   type=int,     help="(optional) Max number of hands")
    parser.add_argument("-dt", "--detect_threshold", default=0.5, type=float,   help="(optional) Detection threshold")
    parser.add_argument("-tt", "--track_threshold",  default=0.5, type=float,   help="(optional) Tracking threshold")
    
    return parser

# コマンドラインパラメータの取得
args = build_argparser().parse_args()

# mediapipe パラメータ
model_complexity         = 1 if args.detail else 0  # 0: liteモデル /1: fullモデル
# max_num_hands            = args.num_hand            # 検出する手の個数
max_num_hands            = 1                        # 検出する手の個数 今回は1固定
min_detection_confidence = args.detect_threshold    # 閾値
min_tracking_confidence  = args.track_threshold     # 閾値
verbose                  = args.verbose             # デバッグメッセージ
verbose2                 = args.verbose

use_mirror_image         = True                    # 鏡像使用
fg_only                  = False

print(f'max_num_hands:{max_num_hands}   model_complexity:{model_complexity}    min_detection_confidence:{min_detection_confidence}    min_tracking_confidence:{min_tracking_confidence}')

COLOR_WHITE = (255, 255, 255)
COLOR_BLUE  = (255,   0,   0)
COLOR_GREEN = (  0, 255,   0)
COLOR_RED   = (  0,   0, 255)

# カメラ
cap = cv2.VideoCapture(0)

# 画像サイズ
image_width  = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
image_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps          = cap.get(cv2.CAP_PROP_FPS)
print(f'image size : {image_width} x {image_height} @ {fps}Hz')

# 前景イメージを作成
image_fg = np.full((image_height, image_width, 3), COLOR_WHITE, np.uint8)

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
        
        
        # BGR画像をRGB画像に変換して認識処理
        results = hands.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
        
        if results.multi_hand_landmarks:        # 検出できたか?
            # ポーズの認識
            gesture = recognize_gesture(results.multi_hand_landmarks[0], image_height, image_width, verbose)
            
            # 人差し指先の位置
            finger_x = int(results.multi_hand_landmarks[0].landmark[HandLandmark.INDEX_FINGER_TIP ].x * image_width)
            finger_y = int(results.multi_hand_landmarks[0].landmark[HandLandmark.INDEX_FINGER_TIP ].y * image_height)
            if verbose2 :
                print(f'({finger_x:4d}, {finger_y:4d})  {gesture}')
            
            # ポーズによって色を変更
            if gesture == 'ONE' :
                color = COLOR_RED           # 赤
            elif gesture == 'PEACE' :
                color = COLOR_GREEN         # 緑
            else :
                color = None
            if color :
                # 前景イメージに点を打つ
                cv2.circle(image_fg, (finger_x, finger_y) , 5, color, thickness=-1)
        
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
                COLOR_RED,                  # 色
                2,                          # 文字の太さ
                cv2.LINE_AA                 # 描画アルゴリズム
            )
        # 表示
        if fg_only :
            # 前景イメージだけ表示
            cv2.imshow('MediaPipe Hands', image_fg)
        else :
            # 画像を重ね合わせ(COLOR_WHITEを透過色として指定)て表示
            cv2.imshow('MediaPipe Hands', np.where(image_fg == COLOR_WHITE, image, image_fg))
        
        # 表示終了待ち
        k = cv2.waitKey(1)
        if k == ord('c'):
            # 前景イメージを初期化
            image_fg = np.full((image_height, image_width, 3), COLOR_WHITE, np.uint8)
        elif k == ord('d'):
            fg_only = not fg_only
        elif k == ord('v'):
            verbose = not verbose
        elif k == ord('b'):
            verbose2 = not verbose2
        elif k == ord('p') :
            cv2.imwrite(
                    f'z_oekaki_{datetime.datetime.now().strftime("%d_%H%M%S")}.jpg', 
                    image_fg
                )
        elif k == ord('q') or k == 27:
            break

# ウィンドウをすべて閉じる
cv2.destroyAllWindows()

# カメラリリース
cap.release()
```





# 実行
```bash
usage: oekaki.py [-h] [-v] [--detail] [-dt DETECT_THRESHOLD]
                 [-tt TRACK_THRESHOLD]

optional arguments:
  -h, --help            show this help message and exit
  -v, --verbose         (optional) disp verbose message
  --detail              (optional) use full model
  -dt DETECT_THRESHOLD, --detect_threshold DETECT_THRESHOLD
                        (optional) Detection threshold
  -tt TRACK_THRESHOLD, --track_threshold TRACK_THRESHOLD
                        (optional) Tracking threshold
```

# 感想

それなりにお絵かきできるけど...  
- 認識処理が遅いと手をゆっくり動かさないと線にならない  
- ポーズの認識の精度がイマイチで描画結果が微妙な感じになる  

実際にユーザインタフェースとして使うには色々と工夫が必要かな。  

