---
title: HTMLで疑似トースト表示
date: 2024-07-28
tags: ["HTML"]
excerpt: HTMLで疑似(なんちゃって)トースト表示するサンプル
layout: default
---

# 概要
Javascriptでスクリプト書いていて、alert表示するとOKボタン押すまで戻ってこなくて使い勝手が悪いので、
一定時間表示して勝手に消えるトースト表示みたいな表示ができないかと作ってみた。  
あくまで簡易的なものなので、ウィンドウ作ったりとかはしてない。  

妙なこだわりで、消えるときはふわと消える(フェードアウト)にしてみた。  
``fadetime``を0にしたらぱっと消える。  
ま、ぱっと出てぱっと消えるなら``style.visibility ="visible"``と``style.visibility ="hidden"``でいいけど。  


# ソース
以下のソースを適当に保存して、ブラウザで開いてちょ。  
ローカルファイル(file://)で開いてもOK。  

説明するほどのことはないので省略。  

ページの先頭に固定なので、スクロールしたら消えちゃうけど、
表示領域の固定(position: fixed など)を使えばなんとかなりそう。  

表示が消える前に次の表示を始めたらうまくいかないかも...  


```html
<!DOCTYPE HTML>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>疑似トースト表示</title>
<script>
// msgをdisptime(msec)表示後、fadetime(msec)でフェードアウトする
function toast_message(msg, disptime=2000, fadetime=2000) {
  let elm = document.getElementById("toast")
  elm.innerText = msg;            // 表示メッセージの変更
  elm.style.animation = "none";   // アニメーションをキャンセルして表示する
  setTimeout(() => {              // disptime経過後、アニメーションを開始する。
    elm.style.animation = `fadeOut ${fadetime}ms forwards`;
  }, disptime);
}

// ボタンクリック時にコールされる関数
function message1() {
  toast_message("メッセージ1",1000, 4000);
}
function message2() {
  toast_message("メッセージ2", 3000, 1000);
}
function message3() {
  toast_message("メッセージ3");
}
function message4() {
  toast_message("メッセージ4", 3000, 0);
}
</script>
</head>

<style>
/* フェードアウトのキーフレーム */
@keyframes fadeOut {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

/* トースト表示領域 */
#toast{
  /* 背景色 */
  background-color: rgb(128,256,128);
  /* 0secでアニメーションして表示を消しておく */
  animation: fadeOut 0s forwards;
}
/* ボタンを大きくしたいので */
.font-large{
    font-size: 130%;
}
</style>

<body>
<font size="5">
<div>
  <H3>疑似トースト表示</H3>
  <!-- トースト表示領域 -->
  <div id="toast">
    メッセージ領域
  </div>
  
  <!-- テスト用ボタン -->
  <div>
    <p>
      <input type="button" value="メッセージ1" onclick="message1();" class="font-large"/> 
      <input type="button" value="メッセージ2" onclick="message2();" class="font-large"/> 
      <input type="button" value="メッセージ3" onclick="message3();" class="font-large"/> 
      <input type="button" value="メッセージ4" onclick="message4();" class="font-large"/> 
    </p>
  <div>
</div>
</font>
</body>
</html>
```

