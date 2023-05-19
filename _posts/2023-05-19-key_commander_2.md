---
title: キーボードコマンダーのひな型(python版)
date: 2023-05-19
tags: ["linux", "python", "sample program"]
excerpt: linuxでのテストプログラム用キーボードコマンダーのpython版
---
# 概要
[キーボードコマンダーのひな型(C言語版)]({{ site.baseurl }}/2023/05/18/key_commander_1.html){:target="_blank"}
のpython版も作{{ site.baseurl }}定して使うだけなんだけど、  
stdinの設定を元に戻すのを忘れないように、クラス化してデストラクタで設定を戻すようにしてみた。  

>[!NOTE]
> これまでatexitモジュール使って終了処理ルーチン登録して  
> そこで元に戻してたけど、処理追加忘れて悲しいことになったことが数知れず...

# ちょっと解説
このクラスは、複数の箇所からインスタンスを作成してしまうとstdinの設定変更が複数箇所で行われてしまい、  
デストラクタの実行順序によっては正常に元に戻せなくなる可能性がある。  
それを回避するため、Singletonパターンを適用し、インスタンスが一つだけ保持するようにした。  

しかし、これだけでは不十分で、コンストラクタ(``__init__()``)が``KeyReader()``実行の度に実行されてしまう。(下のNOTE参照)   
そこで、インスタンス変数にコンストラクタ実行済みフラグ(``_inited``)を用意し、
これが存在しないときのみコンストラクタ処理を実行するようにしている。  

>[!NOTE]
> ``__new__``、``__init__``、``__del__``の実行タイミングは以下のプログラムで確認できる。  
> 
> ```pythn
> class Hoge:
>     def __new__(cls, *args, **kargs):
>         print("__new__")
>         if not hasattr(cls, "_instance"):
>             print("create")
>             cls._instance = super().__new__(cls)
>         return cls._instance
>     
>     # コンストラクタ
>     def __init__(self):
>         print("__init__")
>         if not hasattr(self, "_inited"):
>             print("init")
>             self._inited = True
>     
>     # デストラクタ
>     def __del__(self):
>         print("__del__")
>     
>     def __call__(self):
>         print("__call__")
> 
> def func2() :
>     h2 = Hoge()
>     print("h2 before")
>     h2()
>     print("h2 after")
> 
> def func1() :
>     h1 = Hoge()
>     print("h1 before")
>     h1()
>     print("h1 after")
> 
> print("func1 before")
> func1()
> print("func1 after")
> 
> print("func2 before")
> func2()
> print("func2 after")
> 
> print("end")
> 
> ```
> 実行結果は以下。  
> 
> ```bash
> func1 before
> __new__
> create                  ← 1回だけ表示されている
> __init__
> init                    ← 1回だけ表示されている
> h1 before
> __call__
> h1 after
> func1 after
> func2 before
> __new__
> __init__
> h2 before
> __call__
> h2 after
> func2 after
> end
> __del__
> ```
>
> ``Hoge()``が実行されると、``__new__()``が実行されるが、
> 2回目以降は新たにインスタンスを作成せずクラス変数``_instance``に格納されたインスタンスを返す。  
> (2回目は「create」が表示されていない)  
> 
> ``__init__()``が``Hoge()``実行の度に実行されているのが分かる。  
> (つまりインスタンス生成時に実行されるわけではない)  
> ``__init__()``内でインスタンス変数``_inited``の存在をチェックしているので  
> 「init」は1回しか表示されていないのが分かる。  
> 
> ``__del__()`` はインスタンス破棄時に実行されるので、1回しか実行されない。  
> 



その他のプログラムの動作についてはソース読んでちょ。  
って、ほとんど何もしてないけど。  

# ソース
gistにupしたので、gistの埋め込みリンク貼っとく。  
もしダウンロードしたいときは
[こちら](https://gist.github.com/ippei8jp/52abfcb0406019319befdbbbba83c5cc){:target="_blank"}
からどうぞ。  


<dev class="accordion_head"></dev>
<dev class="my-gist">
  <script src="https://gist.github.com/ippei8jp/52abfcb0406019319befdbbbba83c5cc.js"></script>
</dev>

