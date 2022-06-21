---
title: Pythonのasyncioでnon-blockingなコンソール入力
date: 2022-06-22
tags: ["Ubuntu","RaspberryPi","Windows","python"]
excerpt: Pythonのasyncioでnon-blockingなコンソール入力を行うためのクラス
---

# 概要
pythonでasyncioを使ったときにnon-blockingなコンソール入力(キーボード入力)ができなくて困ったので、実現するためのクラスを作ってみた。  

もともと Linux用に作ったら、Windowsだとうまく動かない。  
ちょっと汚い方法だけど、とりあえず動くようにしてお茶を濁しておく。  
(あんまりテストしてないから動かなかったらごめん)  

# プログラム
<dev class="accordion_head"></dev>
<dev class="my-gist">
  <script src="https://gist.github.com/ippei8jp/5033eec9b9b774ede4f87604a51fb162.js"></script>
</dev>

# 実行

お試しならこのソースをそのまま実行すると実行できます。  
``char_mode = False`` の部分を変更すると、1行入力モードと1文字入力モードを切り替えられます。  
``timeout_mode = True`` の部分を変更すると、タイムアウトなしとタイムアウトありを切り替えられます。  

実際に使用するには、このソースをimportして使ってください。  


# 注意

Linuxで1文字入力モードを使っている場合は、終了時(例外で死んだ場合も含めて)``prompt.terminate()``を実行しないと悲しいことになります。  
(ターミナルの入力モードが変更されてしまうので、うまく入力できなくなる)  
そのために、``atexit.retister()``で終了処理ルーチンを登録し、その中で``prompt.terminate()``を実行するようにしています。  

# ひとりごと

asyncioのサンプルって、タスク1個で動かしてることが多いからあんまり ありがたみが分からんのかな...  
あと、タスクとコルーチンが同じように語られていて分かり難いのもあると思う。  


