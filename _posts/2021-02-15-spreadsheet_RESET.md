---
title: Google spreadsheet にREST APIを追加(その1)
date: 2021-02-15
tags: ["Google"]
excerpt: HTTP GETリクエストでGoogle spreadsheetに追記する
layout: default
---

# 概要

[Node.jsでGoogle spreadsheet にデータを書き込む]({{ site.baseurl }}/2019/10/01/spreadsheet.html){:target="_blank"} で
Google Drive APIでGoogle spreadsheet にデータを書き込む方法を紹介しましたが、
クライアント側の処理をもっと簡単にするためにREST APIを追加してHTTP GETリクエストでデータを書き込めるようにしてみました。

# 手順  

まずは操作されるspreadsheetを作成します。  
- [Googleドライブ](https://drive.google.com/drive/){:target="_blank"} を開く
- 左側「新規」→ 「Googleスプレッドシート」で新しいスプレッドシートが開く
- 無題のスプレッドシート」をクリックして名前を入力

次に、作成したspreadsheetにGoogle Apps Script(GAS)を追加します。  
- メニューの「ツール」→「スクリプトエディタ」をクリック

新しいウィンドウでスクリプトエディタが開きます。  
- コード.gs に以下のコードを入力  

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

/**
 * GETリクエストの処理
 *
 * @param {event object} e - 要求パラメータ
 * @return {object} HTML出力
 */
function doGet(e) {
  // 処理本体
  output = AddDataToSeet(e);
  return output;
}
```
> [!NOTE]
> doGet関数のパラメータ``e``については、[このへん]( https://developers.google.com/apps-script/guides/web){:target="_blank"}を参照してください。  

- 右上の青いボタン「デプロイ」→「新しいデプロイ」をクリック
  - 「デプロイタイプを選択してください」と言われるので、「種類の選択」横の歯車アイコンをクリック → 「ウェブアプリ」をクリック
    - 「説明」に説明文を入力(省略可)
    - 「ウェブアプリ」の「次のユーザとして実行」で「自分」を選択
    - 「アクセスできるユーザ」を適切な範囲に設定  (「全員」にすればパスワードなしでアクセスできる) 
      > [!NOTE]
      > curlなどでアクセスしたい場合は、「全員」にしておかないと、認証画面に飛んでしまい、アクセスが完了しません。  
    - 「デプロイ」をクリック
  - 「このウェブ アプリケーションを使用するには、データへのアクセスを許可する必要があります。」と言われるので「アクセスを承認」をクリック
  - 「アカウントの選択」が表示されるので、使用するアカウントを選択
  - 「このアプリは Google で確認されていません」と言われるので、左下「詳細」をクリック
     - 「無題のプロジェクト（安全ではないページ）に移動」をクリック
     - 「無題のプロジェクトがGoogle アカウントへのアクセスをリクエストしています」と言われるので、「許可」をクリック
     - 「新しいデプロイ」が表示される
     -  一番下の「ウェブアプリ」のUARLをコピーして使用


例えば以下のコマンドでアクセスする
```bash
curl -L "«上でコピーしたURL»?v0=1&v1=2&v2=3"
```

実行すると、対象のスプレッドシートの最終行に以下のデータが追加されます。  
- A列： 日付と時刻
- B列： v0で指定した値
- C列： v1で指定した値
- D列： v2で指定した値

スクリプトを修正した場合、再度「新しいデプロイ」を実行する必要がある。  

または、「デプロイ」→「デプロイをテスト」で表示されるURLを使用すると、デプロイせずに現在の最新ソースで実行できる。  
ただし、この場合、ユーザ認証が必須になってしまうので、ブラウザ等でアクセスする必要がある。  
どうしてもcurlでアクセスしたい場合は、ヘッダに``Authorization: Bearer «アクセストークン»``を追加してやれば良い。(あまりおススメはしないけど)  
やり方は[ここらへん](https://www.ka-net.org/blog/?p=12258){:target="_blank"}を参考にしてください。  


# おまけ  
時刻の文字列を取得した場合、知らないタイムゾーンになっていて困ったときはタイムゾーンを変更すれば良い。

タイムゾーンを変更するにはこちら。  
- 画面左の歯車アイコン「プロジェクトの設定」をクリック
  - 「「appsscript.json」マニフェスト ファイルをエディタで表示する」にチェックを入れる
- 画面左の＜＞アイコン「エディタ」をクリックしてエディタに戻る
  - ファイル一覧に「appsscript.json」が追加されているのでクリック
  - タイムゾーンを指定している部分を   ``"timeZone": "Asia/Tokyo",`` に変更
  - 保存して再度デプロイ

