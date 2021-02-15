---
title: Google spreadsheet にREST APIを追加(その2)
date: 2021-02-16
tags: ["Google"]
excerpt: Google Apps Scriptのライブラリ化
layout: default
---

# 概要
[Google spreadsheet にREST APIを追加 その1]({{ site.baseurl }}/2021/02/15/spreadsheet_RESET.html){:target="_blank"}   では
Spreadsheetに埋め込んだスクリプトにすべて記述しましたが、 新しいSpreadsheetを作成する度にコードをコピーするのは大変ですし、
何らかの不具合が見つかったときに複数のファイルをメンテナンスしなければならないのは現実的ではありません。  
そこで、スプレッドシートにデータを登録する部分をライブラリ化し、Spreadsheetに埋め込んだスクリプトには最低限のコードだけ記載するようにしてみます。  

# 手順
まずはスクリプトライブラリを作成します  
- [Googleドライブ](https://drive.google.com/drive/){:target="_blank"}   を開く
- 左側「新規」→ 「その他」→「Google Apps Script」で新しいスクリプトエディタが開く
  - 「無題のプロジェクト」をクリックして名前を入力  
  - コード.gsに以下を入力([その1]({{ site.baseurl }}/2021/02/15/spreadsheet_RESET.html){:target="_blank"}  の``AddDataToSeet()``と同一)  

```javascript
/**
 * GETリクエストで渡されたデータをスプレッドシートの最終行に追加する
 *
 * @param {event object} e - 要求パラメータ
 * @return {object} HTML出力
 */
function AddDataToSeet(e) {
  Logger.log("AddDataToSeet start");

  // 記録するシート(現在のスプレッドシートのアクティブなシート)
  var sheet = SpreadsheetApp.getActiveSheet();

  var dt = new Date();    // 日付
  var v0 = "";            // デフォルト値
  var v1 = "";
  var v2 = "";

  if(e.parameter.v0 !== undefined){
    v0 = e.parameter.v0;    // GETパラメータでv0が設定されていたら変数設定
  }
  if(e.parameter.v1 !== undefined){
    v1 = e.parameter.v1;    // GETパラメータでv1が設定されていたら変数設定
  }
  if(e.parameter.v2 !== undefined){
    v2 = e.parameter.v2;    // GETパラメータでv2が設定されていたら変数設定
  }

  // スプレッドシートの最終行に追加
  sheet.appendRow([dt, v0, v1, v2]);

  // HTML表示データを生成
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.TEXT);
  // メッセージボディ
  output.setContent("set data:" + "date=" + dt + ",v0=" + v0 + ",v1=" + v1 + ",v2=" + v2);
  return output;
}
```
- 右上の青いボタン「デプロイ」→「新しいデプロイ」をクリック
  - 「デプロイタイプを選択してください」と言われるので、
    - 「種類の選択」横の歯車アイコンをクリック → 「ライブラリ」をクリック
    - 「説明」に説明文を入力(省略可)
    - 「デプロイ」をクリック
  - 新しいデプロイウィンドウが表示されるので、「完了」をクリック  
- 画面左の歯車アイコン「プロジェクトの設定」をクリック
  - 「プロジェクトの設定」の真ん中あたりの「スクリプトID」をメモしておく

次に操作されるspreadsheetを作成します。  
- [Googleドライブ](https://drive.google.com/drive/){:target="_blank"}   を開く
- 左側「新規」→ 「Googleスプレッドシート」で新しいスプレッドシートが開く
- 無題のスプレッドシート」をクリックして名前を入力
- SpreadsheetにGoogle Apps Script(GAS)を追加します。  
  - メニューの「ツール」→「スクリプトエディタ」をクリック

新しいウィンドウでスクリプトエディタが開きます。  
- 「ライブラリ」の横の＋マーク(ライブラリを追加)をクリック
- 「ライブラリの追加」ウィンドウが開くので、「スクリプトID」の欄に上でメモしたスクリプトIDを入力し、「検索」をクリック
- バージョンで使用するバージョンを選択(HAEAD(開発モード)を選択すると、デプロイするまえの最新ソースが使用される)
- ID を設定します。
> [!NOTE]
> ID は node.jsで言うところの、以下の部分の「変数名」に相当する
> ```javascript
> var 変数名 = require('モジュール名')
> ```


- コード.gs に以下のコードを入力  

```javascript
/**
 * GETリクエストの処理
 *
 * @param {event object} e - 要求パラメータ
 * @return {object} HTML出力
 */
function doGet(e) {
  // 処理本体
  output = MySpreadsheetLib.AddDataToSeet(e);
  return output;
}
```


以降、([その1]({{ site.baseurl }}/2021/02/15/spreadsheet_RESET.html){:target="_blank"} のデプロイ作業と同一です。  

