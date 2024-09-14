---
title: tkinter で 低層のウィジェットでイベントを検出する
date: 2024-09-14
tags: ["python", "tkinter"]
excerpt: tkinter で 低層のウィジェットでイベントを検出する
layout: default
---

# 概要
tkinterでイベントを検出する際、対象のウィジェットの手前に別のウィジェットがあるとイベントを検出できません。  
それを回避し、手前にウィジェットが存在してもイベントが検出できるサンプルプログラムを書いてみました。  

# サンプルプログラム

さっそくサンプルプログラムを貼りつけておきます。  

<dev class="accordion_head"></dev>
<dev class="my-gist">
    <script src="https://gist.github.com/ippei8jp/59faf9f974e22d34a8e988954a32518b.js"></script>
</dev>

## 解説のようなもの

### canvasにバインドしたイベントハンドラ

以下の部分が普通にcanvasにマウスクリックイベントをバインドしている部分です。  
```python
        self.test_canvas.bind('<ButtonPress-1>', self._on_click_canvas)
```
canvas上(水色の部分)でクリックすると``_on_click_canvas``が実行され、
``_on_click_canvas : click on canvas``と表示されます。  
しかし、その上に配置されたラベル(labex_1x)上でクリックしたときは表示されません。  

labelもcanvasの一部なので、ここでもクリック処理が動いてほしいことはよくあると思います。  


### rootにバインドしたイベントハンドラ

そこで、以下の部分でrootにマウスクリックイベントをバインドします。  
```python
        self.winfo_toplevel().bind('<ButtonPress-1>', self._on_click)
```
これはrootにバインドされたイベントですから、当然canvas以外の部分でも処理が動きます。  
そこで、イベントハンドラでマウス座標を取得し、canvasの範囲内かを確認し、
そうであればクリック処理(ここでは``_on_click : click on canvas``を表示)を実行します。  

こちらの処理はcanvas上(水色の部分)でクリックしたときも
その上に配置されたラベル(labex_1x)上でクリックしたときもクリック処理が実行されます。  

なお、イベントハンドラに渡されるパラメータ``event``の``event.x``、``event.y``はウィジェット内の相対座標なので
比較には``event.x_root``、``event.y_root``を使用して画面上の座標を使用します。  
当然比較するcanvasの座標も``widget.winfo_rootx()``、``widget.winfo_rooty()``で画面上の座標を使用しなければなりません。  

### おまけ

おまけとして、ダブルクリックした位置に存在するウィジェットの一覧を表示する処理を入れておきました(``_on_doubleclick``) 。  
ダブルクリックに意味はなく、クリックは既に使っていたのでダブルクリックにしただけです。  

> おーちゃくせずに別のプログラム書けよ ＞ 自分

### ふと思ったこと
``event.widget`` から 順に ``master`` をたどって行き、対象のウィジェットが見つかるかで判断する方法もあるなぁ...  
rootの ``master`` は ``None`` なのでそこでサーチ終了。  
どっちが簡単かな...  


