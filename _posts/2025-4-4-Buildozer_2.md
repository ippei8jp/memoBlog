---
title: Buildozerでブロック崩しを作る
date: 2025-4-4
tags: ["Android", "python"]
excerpt: PythonプログラムをAndroidアプリ化できるBuildozerでブロック崩しを作ってみたときのメモ
layout: default
---


# 概要
[Buildozerをお試し]({{ site.baseurl }}/2025/03/31/Buildozer_1.html)では訳も分からずとりあえずbuildして実行してみたが、
少し何がどうなっているか調べてみたところ、
実行の実体は[python for android](https://github.com/kivy/python-for-android){:target="_blank"}
というもので、Buildozerはこのプロジェクトをbuildするためのヘルパーらしい。  

で、githubのリポジトリを眺めていると``pythonforandroid/recipes``にモジュールをbuildするためのレシピが置いてあるようだ。  
そこに、``pygame``というディレクトリがあったので、たぶんゲームを作るためのモジュールなんだろうとあたりをつけて
ぐぐってみた。  

で、[【Pygame】ブロック崩しの作り方とサンプルコード（効果音付き）](https://python.joho.info/pygame/pygame-blockout/){:target="_blank"}
にブロック崩しのプログラムの例があったので拝借してAndroidアプリ化してみることにした。  

今回は趣向を変えて、失敗事例も含めて書いてみる。  


以下、[Buildozerをお試し]({{ site.baseurl }}/2025/03/31/Buildozer_1.html)での環境構築が終わっているものとして進める。  

# 使用したソース
[【Pygame】ブロック崩しの作り方とサンプルコード（効果音付き）](https://python.joho.info/pygame/pygame-blockout/){:target="_blank"}
のソースそのままでは動かなかったので、色々試行錯誤した結果のソースが以下。  

画像ファイルとオーディオファイルをプロジェクトフォルダに移動して
アクセスするためのベースディレクトリを環境変数``ANDROID_APP_PATH``から取得するようにした。  
(相対パスだとうまく動かない。実行時のディレクトリがmain.pyがあるディレクトリと異なるため)  

あと、全画面表示にするため``pygame.display.set_mode``に第2パラメータ``(SCALED | FULLSCREEN)``を追加している。  

```python
import math
import sys
import os

import pygame
from pygame.locals import *
import pygame.mixer

# ベースディレクトリの設定
# Androidだとchdirされて相対パスでアクセスできなくなるので

BASE_DIR = os.getenv('ANDROID_APP_PATH')    # アプリケーションの格納されているパスを環境変数から取得
if BASE_DIR is None:
    BASE_DIR = os.getcwd()                  # 設定されていない(Androidでない)→ カレントディレクトリを設定

# 画面サイズ
WIDTH = 400
HEIGHT = 400
SCREEN = Rect(0, 0, WIDTH, HEIGHT)

# 画像ファイルのパス
PADDLE_IMG_PATH = os.path.join(BASE_DIR, 'images','paddle.png')
BLOCK_IMG_PATH  = os.path.join(BASE_DIR, 'images','block.png')
BALL_IMG_PATH   = os.path.join(BASE_DIR, 'images','ball.png')

# オーディオファイルのパス
PADDLE_SOUND_PATH   = os.path.join(BASE_DIR, 'sound', 'paddle_sound.mp3')
BLOCK_SOUND_PATH    = os.path.join(BASE_DIR, 'sound', 'block_sound.mp3')
GAMEOVER_SOUND_PATH = os.path.join(BASE_DIR, 'sound', 'gameover_sound.mp3')

# バドルのスプライトクラス
class Paddle(pygame.sprite.Sprite):
    # コンストラクタ
    def __init__(self, filename):
        pygame.sprite.Sprite.__init__(self, self.containers)
        self.image = pygame.image.load(filename).convert()
        self.rect = self.image.get_rect()
        self.rect.bottom = SCREEN.bottom - 20          # パドルのy座標

    def update(self):
        self.rect.centerx = pygame.mouse.get_pos()[0]  # マウスのx座標をパドルのx座標に
        self.rect.clamp_ip(SCREEN)                     # ゲーム画面内のみで移動

# ボールのスプライトクラス
class Ball(pygame.sprite.Sprite):
    # コンストラクタ
    def __init__(self, filename, paddle, blocks, score, speed, angle_left, angle_right):
        pygame.sprite.Sprite.__init__(self, self.containers)
        self.image = pygame.image.load(filename).convert()
        self.rect = self.image.get_rect()
        self.dx = self.dy = 0  # ボールの速度
        self.paddle = paddle  # パドルへの参照
        self.blocks = blocks  # ブロックグループへの参照
        self.update = self.start # ゲーム開始状態に更新
        self.score = score
        self.hit = 0  # 連続でブロックを壊した回数
        self.speed = speed # ボールの初期速度
        self.angle_left = angle_left # パドルの反射方向(左端:135度）
        self.angle_right = angle_right # パドルの反射方向(右端:45度）

    # ゲーム開始状態（マウスを左クリック時するとボール射出）
    def start(self):
        # ボールの初期位置(パドルの上)
        self.rect.centerx = self.paddle.rect.centerx
        self.rect.bottom = self.paddle.rect.top

        # 左クリックでボール射出
        if pygame.mouse.get_pressed()[0] == 1:
            self.dx = 0
            self.dy = -self.speed
            self.update = self.move

    # ボールの挙動
    def move(self):
        self.rect.centerx += self.dx
        self.rect.centery += self.dy

        # 壁との反射
        if self.rect.left < SCREEN.left:    # 左側
            self.rect.left = SCREEN.left
            self.dx = -self.dx              # 速度を反転
        if self.rect.right > SCREEN.right:  # 右側
            self.rect.right = SCREEN.right
            self.dx = -self.dx
        if self.rect.top < SCREEN.top:      # 上側
            self.rect.top = SCREEN.top
            self.dy = -self.dy

        # パドルとの反射(左端:135度方向, 右端:45度方向, それ以外:線形補間)
        # 2つのspriteが接触しているかどうかの判定
        if self.rect.colliderect(self.paddle.rect) and self.dy > 0:
            self.hit = 0                                # 連続ヒットを0に戻す
            (x1, y1) = (self.paddle.rect.left - self.rect.width, self.angle_left)
            (x2, y2) = (self.paddle.rect.right, self.angle_right)
            x = self.rect.left                          # ボールが当たった位置
            y = (float(y2-y1)/(x2-x1)) * (x - x1) + y1  # 線形補間
            angle = math.radians(y)                     # 反射角度
            self.dx = self.speed * math.cos(angle)
            self.dy = -self.speed * math.sin(angle)
            self.paddle_sound.play()                    # 反射音

        # ボールを落とした場合
        if self.rect.top > SCREEN.bottom:
            self.update = self.start                    # ボールを初期状態に
            self.gameover_sound.play()
            self.hit = 0
            self.score.set_score(0)                               # スコアを0点にする
            #self.score.add_score(-100)                  # スコア減点-100点

        # ボールと衝突したブロックリストを取得（Groupが格納しているSprite中から、指定したSpriteと接触しているものを探索）
        blocks_collided = pygame.sprite.spritecollide(self, self.blocks, True)
        if blocks_collided:  # 衝突ブロックがある場合
            oldrect = self.rect
            for block in blocks_collided:
                # ボールが左からブロックへ衝突した場合
                if oldrect.left < block.rect.left and oldrect.right < block.rect.right:
                    self.rect.right = block.rect.left
                    self.dx = -self.dx
                    
                # ボールが右からブロックへ衝突した場合
                if block.rect.left < oldrect.left and block.rect.right < oldrect.right:
                    self.rect.left = block.rect.right
                    self.dx = -self.dx

                # ボールが上からブロックへ衝突した場合
                if oldrect.top < block.rect.top and oldrect.bottom < block.rect.bottom:
                    self.rect.bottom = block.rect.top
                    self.dy = -self.dy

                # ボールが下からブロックへ衝突した場合
                if block.rect.top < oldrect.top and block.rect.bottom < oldrect.bottom:
                    self.rect.top = block.rect.bottom
                    self.dy = -self.dy
                self.block_sound.play()     # 効果音を鳴らす
                self.hit += 1               # 衝突回数をカウント
                self.score.add_score(self.hit * 10)   # 衝突回数に応じてスコア加点

# ブロック
class Block(pygame.sprite.Sprite):
    def __init__(self, filename, x, y):
        pygame.sprite.Sprite.__init__(self, self.containers)
        self.image = pygame.image.load(filename).convert()
        self.rect = self.image.get_rect()
        # ブロックの左上座標
        self.rect.left = SCREEN.left + x * self.rect.width
        self.rect.top = SCREEN.top + y * self.rect.height

# スコア
class Score():
    def __init__(self, x, y):
        self.sysfont = pygame.font.SysFont(None, 20)
        self.score = 0
        (self.x, self.y) = (x, y)
    def draw(self, screen):
        img = self.sysfont.render("SCORE:" + str(self.score), True, (255,255,250))
        screen.blit(img, (self.x, self.y))
    def add_score(self, x):
        self.score += x
    def set_score(self, score):
        self.score = score

def main():
    # 初期化
    pygame.init()

    # スクリーンの設定
    # screen = pygame.display.set_mode(SCREEN.size)
    screen = pygame.display.set_mode(SCREEN.size, (SCALED | FULLSCREEN))    # (SCALED | FULLSCREEN) で前画面に拡大表示できる

    # オーディオ初期化
    pygame.mixer.init()

    # 各種効果音の設定
    Ball.paddle_sound = pygame.mixer.Sound(PADDLE_SOUND_PATH)               # パドルにボールが衝突した時の効果音取得
    Ball.block_sound = pygame.mixer.Sound(BLOCK_SOUND_PATH)                 # ブロックにボールが衝突した時の効果音取得
    Ball.gameover_sound = pygame.mixer.Sound(GAMEOVER_SOUND_PATH)           # ゲームオーバー時の効果音取得
    
    # 描画用のスプライトグループ
    group = pygame.sprite.RenderUpdates()  

    # 衝突判定用のスプライトグループ
    blocks = pygame.sprite.Group()   

    # スプライトグループに追加    
    Paddle.containers = group
    Ball.containers = group
    Block.containers = group, blocks

    # パドルの作成
    paddle = Paddle(PADDLE_IMG_PATH)

    # ブロックの作成(14*10)
    for x in range(1, 15):
        for y in range(1, 11):
            Block(BLOCK_IMG_PATH, x, y)

    # スコアを画面(10, 10)に表示
    score = Score(10, 10)    

    # ボールを作成
    Ball(BALL_IMG_PATH, paddle, blocks, score, 5, 135, 45)
    
    clock = pygame.time.Clock()

    running = True  # ループ処理の実行を継続するフラグ

    while running:
        clock.tick(60)      # フレームレート(60fps)
        screen.fill((0,20,0))
        # 全てのスプライトグループを更新
        group.update()
        # 全てのスプライトグループを描画       
        group.draw(screen)
        # スコアを描画  
        score.draw(screen) 
        # 画面更新 
        pygame.display.update()

        # イベント処理
        for event in pygame.event.get():
            # 閉じるボタンが押されたら終了
            if event.type == QUIT: 
                running = False
            # キーイベント
            if event.type == KEYDOWN:
                # Escキーが押されたら終了
                if event.key == K_ESCAPE:   
                    running = False
    # 終了処理
    pygame.quit()
    sys.exit()

if __name__ == "__main__":
    main()
```

画像ファイルとオーディオファイルは参照元のページにあるリンクからダウンロードして以下のように配置する。  

```
.
├── main.py
├── images
│   ├── ball.png
│   ├── block.png
│   └── paddle.png
└── sound
    ├── block_sound.mp3
    ├── gameover_sound.mp3
    └── paddle_sound.mp3
```

とりあえずホスト上で動作するか確認してみる。  
(Android上のpython/pygameとバージョンが違うので厳密な動作確認にはならないけど、大体OKを確認したいだけなのでこれでいく)  

pygameのインストールは以下。  
```bash
pip install pygame
```

WSLではデフォルトでオーディオ再生するためのライブラリ類がインストールされていないので、以下でインストールする。
```bash
sudo apt install pulseaudio
```

>[!NOTE]
> WSLってオーディオ再生できるんだ。  
> 初めて知った...  

で実行してみる。  
```bash
python main.py
```

全画面表示になるので、終了はESCキー押下で。  




# まずは何も考えずにbuildしてみる(失敗)  

buildozer.spec の生成
```bash
buildozer init
```

とりあえず最低限必要な修正だけで試してみる。  
buildozer.spec を以下の内容で修正。  

```diff
--- block0/buildozer.spec       2025-04-04 07:08:53.520218478 +0900
+++ block1/buildozer.spec       2025-04-04 06:25:27.858934801 +0900
@@ -13,10 +13,10 @@
 source.dir = .

 # (list) Source files to include (let empty to include all the files)
-source.include_exts = py,png,jpg,kv,atlas
+source.include_exts = py,png,jpg,kv,atlas,mp3

 # (list) List of inclusions using pattern matching
-#source.include_patterns = assets/*,images/*.png
+source.include_patterns = assets/*,images/*.png,sound/*.mp3

 # (list) Source files to exclude (let empty to not exclude anything)
 #source.exclude_exts = spec
@@ -37,7 +37,7 @@

 # (list) Application requirements
 # comma separated e.g. requirements = sqlite3,kivy
-requirements = python3,kivy
+requirements = python3,kivy,pygame

 # (str) Custom source folders for requirements
 # Sets custom source for any requirements with recipes
```
build実行  

```bash
buildozer -v android debug 2>&1 | tee mk.log
```

しばらくするとエラーで止まる。  
mk.logを確認してみると、以下のようなエラーメッセージがあった。

```
/work/Buildozer/biock1/.buildozer/android/platform/build-arm64-v8a_armeabi-v7a/build/other_builds/pygame/arm64-v8a__ndk_target_21/pygame/setup.py:70: DeprecationWarning: The distutils package is deprecated and slated for removal in Python 3.12. Use setuptools or check PEP 632 for potential alternatives
・・・
src_c/_sdl2/sdl2.c:211:12: fatal error: 'longintrepr.h' file not found
```

どうやらpygameのbuuild中に``longintrepr.h``が見つからなくてエラーになっているらしい。  
「longintrepr.h」でぐぐってみると、python 3.10 → 3.11 の変更で削除されたファイルらしい。  


# それならばpygameのバージョンを新しくしてbuildしてみる(失敗)  

pygameをpython 3.11に対応しているバージョンに変更して試してみる。  
調べてみると、2.1.3からpython 3.11 に対応しているようである。  


作成済みのファイルを削除  
``buildozer android clean``でも良さそうだけど、念のため全部消して最初からやってみる。  
```bash
rm -fr .buildozer bin buildozer.spec mk.log
```
buildozer.spec の生成
```bash
buildozer init
```

buildozer.spec を以下の内容で修正。  
pygameのバージョンを2.1.3指定している。    

```diff
--- block0/buildozer.spec       2025-04-04 07:08:53.520218478 +0900
+++ block2/buildozer.spec       2025-04-04 09:32:40.050228726 +0900
@@ -13,10 +13,10 @@
 source.dir = .

 # (list) Source files to include (let empty to include all the files)
-source.include_exts = py,png,jpg,kv,atlas
+source.include_exts = py,png,jpg,kv,atlas,mp3

 # (list) List of inclusions using pattern matching
-#source.include_patterns = assets/*,images/*.png
+source.include_patterns = assets/*,images/*.png,sound/*.mp3

 # (list) Source files to exclude (let empty to not exclude anything)
 #source.exclude_exts = spec
@@ -37,7 +37,7 @@

 # (list) Application requirements
 # comma separated e.g. requirements = sqlite3,kivy
-requirements = python3,kivy
+requirements = python3,kivy,pygame==2.1.3

 # (str) Custom source folders for requirements
 # Sets custom source for any requirements with recipes
```

build実行  

```bash
buildozer -v android debug 2>&1 | tee mk.log
```
しばらく待つと、以下のように表示されたので、buildは成功したようである。  

```
# Android packaging done!
# APK myapp-0.1-arm64-v8a_armeabi-v7a-debug.apk available in the bin directory
```

なので、実行してみる。  
Windows側でadbサーバを起動しておき、以下を実行。  

```bash
buildozer -v android deploy run logcat 2>&1 | tee run.log
```

起動はするが、すぐに落ちてしまう。  
なにやらエラーが発生している模様。ログで何が起こっているか確認する。  
無関係なログも多く含まれているので、python関連のログだけ抜き出してみる  

```bash
grep -i python run.log > run_python.log
```
>[!NOTE]
> ``buildozer.spec`` に以下を追加するとlogcatのフィルタが有効になるので、設定しておくと良いかもしれない。  
> ```
> android.logcat_filters = *:S python:V pythonutil:V PythonActivity:V
> ```
> コマンドラインで指定できると良いのがだが...
> adbを直接起動すればコマンドラインで設定できるけど。  
>
> タグ``python``がpythonプログラム内のログ、その他は実行時の制御を行っている部分らしい。  
> また、プログラム内のprintによるメッセージ出力もここに表示される。  


ログファイルの最後の部分には以下のように出力されている。  
```
 I python  : Traceback (most recent call last):
 I python  :   File "/work/Buildozer/block2/.buildozer/android/app/main.py", line 34, in <module>
 I python  :   File "/work/Buildozer/block2/.buildozer/android/platform/build-arm64-v8a_armeabi-v7a/build/python-installs/myapp/arm64-v8a/pygame/__init__.py", line 70, in __getattr__
 I python  : NotImplementedError: sprite module not available (ImportError: dlopen failed: cannot locate symbol "alphablit_alpha_sse2_argb_surf_alpha" referenced by "/data/data/org.test.myapp/files/app/_python_bundle/site-packages/pygame/surface.so"...)
 I python  : Python for android ended.
```

どうやらpygameの初期化時に``alphablit_alpha_sse2_argb_surf_alpha``が見つからないということらしい。  
単にバージョン変えるだけではダメで、ちゃんとレシピも修正しないといけないらしい。   


# python for androidのバージョンを下げてみる(成功)

python 3.10以下にして試してみることも考えたが、同様にレシピの変更なしで動くとは思えないので
python for androidのバージョンを下げて試してみることにする。  


作成済みのファイルを削除  

```bash
rm -fr .buildozer bin buildozer.spec mk.log
```
buildozer.spec の生成
```bash
buildozer init
```

buildozer.spec を以下の内容で修正。  
``p4a.branch = release-2022.12.20`` と指定してrelease-2022.12.20を使用するように設定している。  
このバージョンは python 3.9.9 を使用している。  

```diff
+++ block3/buildozer.spec       2025-04-04 12:28:23.302885362 +0900
@@ -13,10 +13,10 @@
 source.dir = .

 # (list) Source files to include (let empty to include all the files)
-source.include_exts = py,png,jpg,kv,atlas
+source.include_exts = py,png,jpg,kv,atlas,mp3

 # (list) List of inclusions using pattern matching
-#source.include_patterns = assets/*,images/*.png
+source.include_patterns = assets/*,images/*.png,sound/*.mp3

 # (list) Source files to exclude (let empty to not exclude anything)
 #source.exclude_exts = spec
@@ -37,7 +37,7 @@

 # (list) Application requirements
 # comma separated e.g. requirements = sqlite3,kivy
-requirements = python3,kivy
+requirements = python3,kivy,pygame

 # (str) Custom source folders for requirements
 # Sets custom source for any requirements with recipes
@@ -321,7 +321,7 @@
 #p4a.fork = kivy

 # (str) python-for-android branch to use, defaults to master
-#p4a.branch = master
+p4a.branch = release-2022.12.20

 # (str) python-for-android specific commit to use, defaults to HEAD, must be within p4a.branch
 #p4a.commit = HEAD
```


build実行  

```bash
buildozer -v android debug 2>&1 | tee mk.log
```
しばらく待つと、以下のように表示されたので、buildは成功したようである。  

```
# Android packaging done!
# APK myapp-0.1-arm64-v8a_armeabi-v7a-debug.apk available in the bin directory
```

なので、実行してみる。  
Windows側でadbサーバを起動しておき(前のセクションで起動してれば再度実行する必要なし)、以下を実行。  

```bash
buildozer -v android deploy run logcat 2>&1 | tee run.log
```

で、動いた。  
メデタシメデタシ。  
ログがファイルに格納され続けてしまうので、早めにCTRL+Cで止めておきましょう。  













