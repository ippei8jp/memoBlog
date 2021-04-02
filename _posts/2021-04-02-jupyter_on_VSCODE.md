---
title: Visual Studio Code で Jupyter Notebook
date: 2021-04-02
tags: ["VSCode", "リモートデバッグ", "WSL"]
excerpt: Visual Studio Code で Jupyter Notebookを実行する
layout: default
---

# 概要

Visual Studio CodeでJupyter Notebookを実行する。  

サンプルプログラムがJupyter Notebookだったりするとブラウザで動かすのめんどいので、Visual Studio Codeで動かしてみた。  
参考：このあたりかな？ [Visual Studio CodeでJupyter Notebookを使う方法](https://codeaid.jp/vscode-jupyter/){:target="_blank"}  

以下では、[SSD と YOLO を用いた物体検出](https://www.koi.mashykom.com/tensorflow.html){:target="_blank"} の「Object Detection APIを用いた物体検出」を参考に進めてみる。  


# 前準備
作業ディレクトリとツール類のインストール  

```bash
# 作業ディレクトリ
mkdir -p /work/Tensorflow
cd /work/Tensorflow

# pyenvの仮想環境作成と切り替え
pyenv virtualenv 3.7.10 tensorflow
pyenv local tensorflow
# お約束
pip install --upgrade pip setuptools

# Protocol buffers コンパイラのインストール(Jupyter Notebookの実行には関係ない)
sudo apt install protobuf-compiler

# Jupyter Notebook のモジュールインストール
pip install notebook
```

# modelsリポジトリのクローン
実行するプログラムの準備

```bash
git clone https://github.com/tensorflow/models.git
```

# Visual Studio Codeの起動
```bash
cd models/
code .
```
**＊＊＊ Visual Studio Code起動 ＊＊＊**


# Visual Studio Codeでの作業
以下、Visual Studio Codeで作業する

## 準備
拡張機能から「Jupyter」と「Python」を選択し、対象マシンにインストール

## 使用するpythonを選択その1

コマンドパレットから以下のコマンドを選び、使用するPythonを選択する  

コマンドパレットを表示するには、メニューの表示→コマンドパレットを選択する。  
- Python: インタプリター選択
  - これはどこで有効なんだろうか？念のため設定しておこう。  
- Jupyter: Select interpreter to start jupyter server  
  - たぶん、Jupyter Notebookそのものを実行するためのPython  
    jupyter-notebookモジュールがインストールされている必要がある  



## 対象ファイルをオープン
エクスプローラから  
``research/object_detection/colab_tutorials/object_detection_tutorial.ipynb``
を開く  
``a notebook could execute harmful code when opened. ～ ``
と言われるので、``Trust`` をクリック



## 使用するpythonを選択その2

コマンドパレットから以下のコマンドを選び、使用するPythonを選択する  
(ipynbファイルを開かないと選べない)

コマンドパレットを表示するには、メニューの表示→コマンドパレットを選択する。  

- Jupyter: Select a Kernel  
  - たぶん、Notebook内のpythonスクリプトを実行するためのPython  
    システムコマンド(!を行頭につけて指定)として実行したり、``%%bash`` で指定したCode cell で実行した  
    python スクリプト(pipコマンドなども含む)を実行した場合もこのバージョンが使用される
  - ipykernelモジュールをインストールしておく必要があるが、入ってなければVSCodeからインストールできるので気にしなくても大丈夫。  
    (Jupyter Notebook のモジュールがインストールされていれば同時にインストールされている)  

>[!NOTE]
> その1、その2で選択するバージョンはそれぞれ異なるバージョンを設定できるが、  
> 上でpyenvで選択したバージョンで統一しておくのが混乱しなくて良いと思う。  

>[!NOTE]
> Select a Kernel の設定内容は以下のファイルに保存されるらしい。  
> ``~/.vscode-server/data/User/globalStorage/ms-toolsai.jupyter/kernelSpecPaths.json``  
> この設定はシステム(ターゲットマシン)で1つのようなので、他のプロジェクトで設定を変更した場合は再度確認しておくのが良いと思う。  


## エラーになる部分の対策

### その1
「Get tensorflow/models or cd to parent directory of the repository.」
の下のCode cellの最後に以下を追加

```python
import sys
print(sys.path)
cwd=os.getcwd()
sys.path.insert(0, cwd + "/models/research/slim")
sys.path.insert(0, cwd + "/models/research")
print(sys.path)
```

### その2
以下のcellを削除(エラーになる)  
(おそらく、その1で追加している処理に相当)  
```
%%bash 
cd models/research
pip install .
```


### その3
「Instance Segmentation」以下はエラーになる(RCNNのモデル形状が変更された？)ので削除しておく。  
(手順の本筋に関係ないので)  

## 実行
最初のCode cell(Installの下)で▶(Run)をクリック  
あとは、続くcellで▶(Run)をクリックしていく。  

または、ツールバーの⏩(Run all cells)をクリックする


# おまけ
## ipynbファイルをpythonファイルにエクスポートする。

Visual Studio Codeのエクスプローラペインで対象のipynbファイルを右クリックして  
``Convert a Notebook to Python Script``を選択すると、変換結果が新しいファイルとしてエディタに開かれる。  
これを名前を付けて保存する。  

または、コマンドラインから以下のコマンドを実行する。  
```bash
jupyter nbconvert «対象ファイル».ipynb --to python
```
デフォルトの出力ファイル名は«対象ファイル名».py(拡張子をipynb→pyに変えたもの)になる。  


ただし、単独で動かす場合は ``get_ipython()`` で始まる行(システムコマンドを実行する部分)はエラーになるので、コメントアウトしておくこと。  

