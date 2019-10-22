---
title: openCV で MPEG再生
date: 2019-10-22
tags: ["openCV", "python"]
excerpt: python + openCV でMPEGファイルを再生する
---

python + openCV で MPEGファイルを再生するには、以下のようにread→imshowを繰り返せば良い。  
しかし、これではフレームレートを考慮していないため、実際の時間とは異なる速度で再生されてしまう。  

```python
import cv2
cap = cv2.VideoCapture(filepath)
while true:
    ret, frame = cap.read()
    if not ret :
        break
    cv2.imshow("Frame", frame)
cap.release()
cv2.destroyAllWindows()
```

そこで、フレーム間に待ち時間を確保し、実際の時間と同じになるように再生する方法を考える。  

# フレーム間の待ち時間を決め打ちで待つパターン(一番シンプルなパターン)

最も簡単な方法は、フレーム間に決め打ちでwait処理を挿入する方法である。  
フレームレートは一定であるため、待ち時間も一定になる。  
再生中にキー入力による中止を検出したいので、``time.sleep()``ではなく、``cv2.waitKey(delay)``を使用している。  
試した環境では、``cv2.waitKey()`` は 25くらいを指定すると大体30fpsに合うくらいの間隔になる(ちょっと早いかも)。  
設定値はトライ&エラーで設定値を探るしかない。  

しかし、MPEG再生しか行わない場合はこれでも問題ないが、フレーム間に他の処理を行うと待ち時間が変わってきてしまう。

```python
import cv2
import numpy as np
import time
import sys
import os

# ファイル名はFullpathでないとエラーになる
filepath = os.path.abspath("./video.mp4") 

# 動画の読み込み
cap = cv2.VideoCapture(filepath)

# 読み込み失敗なら終了
if not cap.isOpened() :
    sys.exit()

# フレームレート
fps = round(cap.get(cv2.CAP_PROP_FPS))
sec_per_frame = 1/fps

# 全フレーム数
frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

# 確認
print(f'FPS = {fps}    sec_per_frame = {sec_per_frame}    frame_count = {frame_count}')

# フレーム番号の初期化
index = 0

# 再生位置を先頭に設定
cap.set(cv2.CAP_PROP_POS_FRAMES, index)

# 前回時刻を0クリア
# ここで前回時刻を取得すると、readやimshowの時間が含まれてしまうので具合が悪い
prev_time = 0

# 動画終了まで繰り返し
while True :
    # フレームを取得
    ret, frame = cap.read()
    
    if not ret :
        # 最終フレームなどfalseが返ってきたら終了
        break
    
    # フレームを表示
    cv2.imshow("Frame", frame)
    
    if prev_time == 0 :
        # 最初のフレームの時のみここで前回時刻を取得
        prev_time = time.time()
        start_time = prev_time
    
    # 現在時刻
    cur_time = time.time()
    
    index = index + 1
    
    if index >= frame_count :
        # 終了位置を超えたら終了
        break

    # 再生位置と時刻を確認
    print(f'index = {index:5d}    time = {cur_time - start_time:.3f}    {int((cur_time - prev_time) * 1000):4d}')
    prev_time = cur_time
    
    # delay = 1         # 最速再生
    delay = 25          # それっぽい再生速度になるように決め打ちで
    
    # qキーが押されたら途中終了
    if cv2.waitKey(delay) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
```

# 前回の時刻からフレーム間の待ち時間を決めるパターン

前回の表示時刻を覚えておき、今回の表示時刻との間隔がフレームレートに一致するように待ち時間を調整する。  
これなら、フレーム間に他の処理を挿入しても(その処理時間が一定でなくても)、その処理時間を除いて待ち時間を設定できる。  

しかし、挿入した処理がフレームレートを超えてしまうと、回復する術がなく、どんどん遅れていってしまう。  


```python
import cv2
import numpy as np
import time
import sys
import os

# ファイル名はFullpathでないとエラーになる
filepath = os.path.abspath("./video.mp4") 

# 動画の読み込み
cap = cv2.VideoCapture(filepath)

# 読み込み失敗なら終了
if not cap.isOpened() :
    sys.exit()

# フレームレート
fps = round(cap.get(cv2.CAP_PROP_FPS))
sec_per_frame = 1/fps

# 全フレーム数
frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

# 確認
print(f'FPS = {fps}    sec_per_frame = {sec_per_frame}    frame_count = {frame_count}')

# フレーム番号の初期化
index = 0

# 再生位置を先頭に設定
cap.set(cv2.CAP_PROP_POS_FRAMES, index)

# 前回時刻を0クリア
# ここで前回時刻を取得すると、readやimshowの時間が含まれてしまうので具合が悪い
prev_time = 0

# 動画終了まで繰り返し
while True :
    # フレームを取得
    ret, frame = cap.read()
    
    if not ret :
        # 最終フレームなどfalseが返ってきたら終了
        break
    
    # フレームを表示
    cv2.imshow("Frame", frame)
    
    if prev_time == 0 :
        # 最初のフレームの時のみここで前回時刻を取得
        prev_time = time.time()
        start_time = prev_time
        tmp_time = prev_time
    
    # 現在時刻
    cur_time = time.time()
    
    index = index + 1
    
    if index >= frame_count :
        # 終了位置を超えたら終了
        break

    # 再生位置と時刻を確認
    print(f'index = {index:5d}    time = {cur_time - start_time:.3f}    {int((cur_time - prev_time) * 1000):4d}')
    prev_time = cur_time
    
    # 待ち時間計算用起点からの差分とsec/frameから待ち時間決定
    delta_time = cur_time - tmp_time
    delay = int((sec_per_frame - delta_time) * 1000)
    # print(f'delta =  {int(delta_time*1000)}    {delay}')
    # 待ち時間がsec/frameを超えてたら最小値に設定
    if delay < 1 :
        delay = 1

    # qキーが押されたら途中終了
    if cv2.waitKey(delay) & 0xFF == ord('q'):
        break
    
    # 待ち時間計算用起点
    tmp_time = time.time()

cap.release()
cv2.destroyAllWindows()
```

# 経過時間から表示すべきフレームを求めて移動しながら表示するパターン

現在時刻と再生開始時刻の差から表示すべきフレーム番号を求め、必要であれば``cap.set(cv2.CAP_PROP_POS_FRAMES, index)``で読み込みフレームを移動して現在時刻とフレームの同期をとる。  

``cap.set()``は処理に時間がかかるので、無条件で実行すると再生フレームレートが遅くなるため、フレーム飛びが発生したときのみ実行するようにする。  


```python
import cv2
import numpy as np
import time
import sys
import os

# ファイル名はFullpathでないとエラーになる
# filepath = os.path.abspath("./video.mp4") 
filepath = os.path.abspath("./stopwatch.mp4") 

# 動画の読み込み
cap = cv2.VideoCapture(filepath)

# 読み込み失敗なら終了
if not cap.isOpened() :
    sys.exit()

# フレームレート
fps = round(cap.get(cv2.CAP_PROP_FPS))
sec_per_frame = 1/fps

# 全フレーム数
frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

# 確認
print(f'FPS = {fps}    sec_per_frame = {sec_per_frame}    frame_count = {frame_count}')

# フレーム番号の初期化
index = 0

# 再生位置を先頭に設定
cap.set(cv2.CAP_PROP_POS_FRAMES, index)

# 前回時刻を0クリア
# ここで前回時刻を取得すると、readやimshowの時間が含まれてしまうので具合が悪い
prev_time = 0

# 動画終了まで繰り返し
while True :
    # フレームを取得
    ret, frame = cap.read()
    
    if not ret :
        # 最終フレームなどfalseが返ってきたら終了
        break
    
    # フレームを表示
    cv2.imshow("Frame", frame)
    
    if prev_time == 0 :
        # 最初のフレームの時のみここで前回時刻を取得
        prev_time = time.time()
        start_time = prev_time
    
    # 前回表示フレーム番号の更新
    prev_index = index
    
    while True :
        # 現在時刻
        cur_time = time.time()
        
        # 表示するフレーム位置の取得
        index = int((cur_time - start_time) / sec_per_frame)
        # print(f"{prev_time}    {cur_time}    {prev_index}    {index}")
        if prev_index == index:
            # 前回と同じフレーム番号ならちょっと待つ
            time.sleep(0.001)
            continue
        
        break
    
    if index >= frame_count :
        # 終了位置を超えたら終了
        break

    # 再生位置と時刻を確認
    print(f'index = {index:5d}    time = {cur_time - start_time:.3f}    {int((cur_time - prev_time) * 1000):4d}')
    prev_time = cur_time
    
    # 表示するフレーム位置が連続するフレームでなければ移動
    if index != prev_index + 1 :
        cap.set(cv2.CAP_PROP_POS_FRAMES, index)
    
    # qキーが押されたら途中終了
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break
    
    # 動作確認0.5秒待ってみる
    # time.sleep(0.5)

cap.release()
cv2.destroyAllWindows()
```


