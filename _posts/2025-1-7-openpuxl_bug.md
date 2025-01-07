---
title: openpyxlのバグ
date: 2025-1-7
tags: ["python", "openpyxl"]
excerpt: openpyxl(3.1.5)のバグ(ではないけど、あえてそう書いておく)
layout: default
---

# 内容
openpyxl(3.1.2)でExcelのグラフを作成するスクリプトを使っていたが、
openpyxlを現時点での最新版(3.1.5)にアップデートしたところ、表示されるグラフの見た目が変わってしまった。  

# 原因
検索してみたところ、teratailに
『[python openpyxl グラフ作成　グラフ書式が変わったのを治せない](https://teratail.com/questions/5q9cujzlc2307x){:target="_blank"}』
というエントリを見つけた。  

どうやら、Excelの仕様に厳密に従ったらExcelのバグに引っかかった ということらしい。  
(バグが他のバグ回避になってた、みたいな感じ)  

# 対策
Excelのバグの修正を待っててもしかたないので、なんとか出来る方法を探してみた。  
この部分は openpyxl の 3.1.4 で仕様変更されたようなので、3.1.3以前を使うというのも手なのだけど、  
最新版を使いたい場合はExcelのバグに引っかかってる部分だけ元にもどしてやれば良い。  

ということで、上のページにあった変更点を出力している部分を探して修正してみた。  

結論から言うと、以下のパッチをインストールしたライブラリにあててやれば良い。  
```patch
diff -urpN openpyxl.org/packaging/extended.py openpyxl/packaging/extended.py
--- openpyxl.org/packaging/extended.py  2025-01-07 07:23:30.159676700 +0900
+++ openpyxl/packaging/extended.py      2025-01-07 07:41:28.823592900 +0900
@@ -126,7 +126,8 @@ class ExtendedProperties(Serialisable):
         self.HLinks = None
         self.HyperlinksChanged = HyperlinksChanged
         self.DigSig = None
-        self.Application = f"Microsoft Excel Compatible / Openpyxl {__version__}"
+        # self.Application = f"Microsoft Excel Compatible / Openpyxl {__version__}"
+        self.Application = f"Microsoft Excel"
         self.AppVersion = ".".join(__version__.split(".")[:-1])
         self.DocSecurity = DocSecurity
```

で、試してみたところ うまくグラフが表示されるようになった。  
メデタシメデタシ。  


