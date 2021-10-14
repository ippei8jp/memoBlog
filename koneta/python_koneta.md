---
title: python 小ネタ集
date: 2020-09-20
tags: ["python"]
excerpt: pythonの小ネタ集
---

# pyenvのインストール

[pyenvのインストール]({{ site.baseurl }}/2019/06/27/pyenv.html)  

## pyenv-virtualenvでベースバージョンにインストールされたパッケージを参照できるようにする

以下のように``--system-site-packages``オプションを指定する。  
```bash
pyenv virtualenv --system-site-packages «バージョン» «仮想環境名»
```



# csvファイルをエクセルファイルに変換する

[csvファイルをエクセルファイルに変換する]({{ site.baseurl }}/2020/06/29/csv2xls.html)  


# pipでインストールしたモジュールの依存関係の確認方法

pipでインストールしたモジュールの依存関係を知りたいときがたまにある。  
そんな場合は、以下の手順で。  

まずは必要なモジュールのインストール  
```bash
pip install pipdeptree
```

以下を実行  
```bash
pipdeptree
```
参考：[Python: pipdeptree でパッケージの依存関係を調べる](https://blog.amedama.jp/entry/2016/05/29/182402?fbclid=IwAR1HwuEEKG3-lbCYNJeDBpwgBDZsNae3Ww6GYwrMCFjXt7kqo5-iAyaOXNI)

ちなみに、依存関係の矛盾がないかだけ確認したいなら、以下のコマンドでも可能。  
こっちは特にインストールする必要はない。  
```bash
pip check
```


