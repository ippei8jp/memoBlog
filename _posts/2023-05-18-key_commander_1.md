---
title: キーボードコマンダーのひな型(C言語版)
date: 2023-05-18
tags: ["linux", "sample program"]
excerpt: linuxでのテストプログラム用キーボードコマンダー
---
# 概要
[test shellのひな型](https://ippei8jp.github.io/memoBlog/2023/05/15/test_shell_1.html){:target="_blank"}
のようなテストシェルでコマンド処理するほどでもないが、いくつかのパターンを繰り返し実行してテストしてみたい
場合に使えるキーボードコマンダー(という名前がふさわしいか分からないが)のひな型を作ってみた。  

キー入力1個(例えば``a``キー)でリターンを押さずに何らかの処理が実行できると便利な時がある。  
また、ターゲットボードのスイッチ入力の代替処理としても便利かもしれない。  

Windowsの``getch()``関数みたいなものと言えば分かるかな？  
キー入力自体はブロッキング処理なので、``kbhit()``みたいな使い方はできない。  
(これを行うには``select()``をタイムアウト付きで組み合わせて使う必要があるが、
簡単なテスト用を想定しているので そこまでは対応しない)


プログラムの動作についてはソース読んでちょ。  
大体コメントに書いたつもり。  

# ソース
gistにupしたので、gistの埋め込みリンク貼っとく。  
もしダウンロードしたいときは
[こちら](https://gist.github.com/ippei8jp/6435ac7e3381ec2f8af0b1fdb166d469){:target="_blank"}
からどうぞ。  


<dev class="accordion_head"></dev>
<dev class="my-gist">
  <script src="https://gist.github.com/ippei8jp/6435ac7e3381ec2f8af0b1fdb166d469.js"></script>
</dev>

