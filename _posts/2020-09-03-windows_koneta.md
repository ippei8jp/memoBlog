---
title: Windows 小ネタ集
date: 2020-09-03
tags: ["Windows"]
excerpt: Windowsの小ネタ集
---

# エクスプローラーの右クリックメニューをカスタマイズ

以下のページに詳しい説明がある。  
- [エクスプローラーの右クリックメニューをカスタマイズする](https://ascii.jp/elem/000/000/953/953807/){:target="_blank"}  
  - わりと全体的な話    
- [あなただけの右クリックで、ストレスフリーな開発を](https://qiita.com/NumLocker/items/f8016f1aed7207b850fb){:target="_blank"}  
  - 詳細な設定項目など  
  - フォルダの右クリックとかデスクトップの右クリックなんかも記載アリ  

順序を指定したい場合は``position``キーで ``Top``/``Middle``/``Bottom`` を指定することでできるが、あくまで3種類だけ(下のリンクの[ここ](https://qiita.com/NumLocker/items/f8016f1aed7207b850fb#6-7-%E3%83%A1%E3%83%8B%E3%83%A5%E3%83%BC%E3%81%AE%E8%A1%A8%E7%A4%BA%E4%BD%8D%E7%BD%AE%E3%81%AE%E5%A4%89%E6%9B%B4)){:target="_blank"}。  
表示順序はshellの下のキーがASCIIコード順(?)になるらしいので、  
同一ポジション内でさらに順序を指定したい場合は、キーに``1_``、``2_``みたいな接頭辞を付けて表示順を固定できるみたい。  
でも、このままだと接頭辞がついたままの項目でメニューに表示されるので、``(既定)``キーに表示する文字列を設定しておけばOK。  


# WindowsでX-serve

- [WindowsでX-serve]({{ site.baseurl }}/2019/11/26/VcXsrv.html)

# モバイル ホットスポット

- [モバイル ホットスポットでRaspberryPiをネットに接続]({{ site.baseurl }}/2019/09/12/mobilehotspot.html)


# PC起動時にネットワークドライブの再接続に失敗する場合の自動リカバリ

PCの起動時にネットワークドライブの再接続に失敗する場合、以下の手順で自動でリカバリできる。  
手順は以下。  

- ```%SystemDrive%\Scripts\MapDrives.ps1```を以下の内容で作成    
{% include filename.html filename="c:\Scripts\MapDrives.ps1" %}
```powershell
$i=3
while($True){
    $error.clear()
    $MappedDrives = Get-SmbMapping |where -property Status -Value Unavailable -EQ | select LocalPath,RemotePath
    foreach( $MappedDrive in $MappedDrives)
    {
        try {
            New-SmbMapping -LocalPath $MappedDrive.LocalPath -RemotePath $MappedDrive.RemotePath -Persistent $True
        } catch {
            Write-Host "There was an error mapping $MappedDrive.RemotePath to $MappedDrive.LocalPath"
        }
    }
    $i = $i - 1
    if($error.Count -eq 0 -Or $i -eq 0) {break}

    Start-Sleep -Seconds 30

}
```
- ```%SystemDrive%\Scripts\MapDrives.cmd```を以下の内容で作成    
{% include filename.html filename="%SystemDrive%\Scripts\MapDrives.cmd" %}
```powershell
date /T > "%TEMP%\MapDrivers.txt"
time /T >> "%TEMP%\MapDrivers.txt"
PowerShell -Command "Set-ExecutionPolicy -Scope CurrentUser Unrestricted" >> "%TEMP%\MapDrivers.txt" 2>&1 
PowerShell -File "%SystemDrive%\Scripts\MapDrives.ps1" >> "%TEMP%\MapDrivers.txt" 2>&1
```
- スタートアップフォルダに```%SystemDrive%\Scripts\MapDrives.cmd```のショートカットを置く    
- 作成したショートカットのプロパティを開いて「ショートカット」タブの「実行時の大きさ」を「最小化」に変更しておく。    

参考： [Windows 10、バージョン 1809 において、マップされたネットワークドライブの再接続に失敗する場合がある](https://support.microsoft.com/ja-jp/help/4471218/mapped-network-drive-may-fail-to-reconnect-in-windows-10-version-1809?fbclid=IwAR3FHRrLbLXn8rp_qigZW46oeAWs22x6Uqh-0Nu7psOKDA45UlOo7a9wlg0){:target="_blank"}


# ファイルをロックしているプログラムを特定する

Windowsでファイル削除しようとしたら、「このファイルはロックされています」と言われてイラっとしたときに
これを使うとイッパツ解消(と行かないこともないことはない)。

[ファイルの削除を妨げているアプリを特定、ロックを解除できるアプリ「LockHunter」](https://forest.watch.impress.co.jp/docs/review/1222040.html?fbclid=IwAR133Iw2vfGX_e9fnBhm3soJ3iRdY65YOPh02tRa_IkG_ntVWAxesZuFORQ){:target="_blank"}  

# Windows Terminalをインストールする

Windows Terminalのインストールは Microsoft Store で「Windows Terminal」で検索してインストールするだけでOK。  

## 参考サイト  

TIPS色々    ： [Windows Terminal Tips](https://qiita.com/whim0321/items/6a6b11dea54642bd6724){:target="_blank"}  
NYAGOSを使う： [Windows Terminal で nyagos を使おう](https://zenn.dev/zetamatta/books/5ac80a9ddb35fef9a146/viewer/a3f5c9){:target="_blank"}  
色々        ： [1からマスター! Windows Terminal入門](https://news.mynavi.jp/itsearch/series/hardware/1_windows_terminal.html){:target="_blank"}  

## 設定例
設定ファイルは以下にある。  
``C:\Users\<<USER>>\AppData\Local\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\settings.json``  

設定変更例：
- フォント/フォントサイズ/ウィンドウサイズ変更
- ShellにNYAGOSを追加
- デフォルトをNYAGOSに変更

```diff
--- settings_org.json   2021-01-31 05:45:34.767869400 +0900
+++ settings.json       2021-01-31 06:46:38.275728600 +0900
@@ -8,7 +8,11 @@
 {
     "$schema": "https://aka.ms/terminal-profiles-schema",

-    "defaultProfile": "{61c54bbd-c2c6-5271-96e7-009a87ff44bf}",
+    "defaultProfile": "{19ddaf5e-e045-481a-bf88-37f7ebe66292}",
+
+    // window size
+    "initialCols": 80,
+    "initialRows": 55,

     // You can add more global application settings here.
     // To learn more about global settings, visit https://aka.ms/terminal-global-settings
@@ -28,10 +32,22 @@
         "defaults":
         {
             // Put settings here that you want to apply to all profiles.
+            // "fontFace": "源真ゴシック等幅 Regular",
+            "fontFace": "BIZ UDゴシック",
+            "fontSize": 12
         },
         "list":
         [
             {
+                  "guid": "{19ddaf5e-e045-481a-bf88-37f7ebe66292}",
+                  "hidden": false,
+                  "name": "NYAGOS 4.4.9",
+                  "commandline": "C:\\wintools\\nyagos-4.4.9_2\\nyagos.exe",
+                  "icon": "C:\\wintools\\nyagos-4.4.9_2\\nyagos.png",
+                  "cursorShape": "vintage",
+                  "startingDirectory": "c:\\"
+            },
+            {
                 // Make changes here to the powershell.exe profile.
                 "guid": "{61c54bbd-c2c6-5271-96e7-009a87ff44bf}",
                 "name": "Windows PowerShell",
```

## misc
### NYAGOSのアイコンが表示されないので、表示されるようにする
- EXEファイルからアイコンを抽出してpngファイルで保存しておく
  - アイコン抽出には[Icon Ripper](https://www.vector.co.jp/soft/winnt/amuse/se513590.html){:target="_blank"}が使える(インストール不要)
- ``settings.json`` に ``"icon" : ～ `` でアイコン設定しておく。

# NYAGOSのカスタマイズ

NYAGOSのリポジトリはこちら：<https://github.com/zetamatta/nyagos>  


## ヒストリ補完機能を追加する

[nyagosでヒストリ補完する](https://qiita.com/nocd5/items/7cfc2441868442838148) のソースを  
``nyagos.exe``のあるディレクトリの``nyagos.d``ディレクトリの下に``h_search.lua``として格納しておく。  

参照先がなくなると困るので、ここに再掲しておく。  

{% include filename.html filename="h_search.lua" %}
```lua
-- ヒストリ補完機能
nyagos.bindkey("C_N",
    function(this)
        search_history(this, false)
    end
)

nyagos.bindkey("C_P",
    function(this)
        search_history(this, true)
    end
)

function search_history(this, is_prev)
    -- カーソル位置が一番左の場合は通常のnext/prev
    if this.pos == 1 then
        if is_prev == true then
            this:call("PREVIOUS_HISTORY")
        else
            this:call("NEXT_HISTORY")
        end
        this:call("BEGINNING_OF_LINE")
        return nil
    end

    -- 検索キーワード
    local search_string = this.text:sub(1, this.pos - 1)

    -- 重複を除いたhistoryリストの取得
    local history_uniq = {}
    local is_duplicated = false
    local hist_len = nyagos.gethistory()
    for i = 1, hist_len do
        local history
        -- 新しい履歴がリスト後ろに残るよう末尾からサーチ
        history = nyagos.gethistory(hist_len - i)
        for i, e in ipairs(history_uniq) do
            if history == e or history == search_string then
                is_duplicated = true
            end
        end
        if is_duplicated == false then
            if is_prev == true then
                table.insert(history_uniq, history)
            else
                table.insert(history_uniq, 1, history)
            end
        end
        is_duplicated = false
    end

    -- 入力と完全一致する履歴を探す
    -- 完全一致する履歴を起点にすることで
    -- (見かけ上)インクリメンタルな検索にする
    local hist_pos = 0
    for i, e in ipairs(history_uniq) do
        if e == this.text then
            hist_pos = i
            break
        end
    end

    -- 前方一致する履歴を探す
    local matched_string = nil
    for i = hist_pos + 1, #history_uniq do
        if history_uniq[i]:match('^' .. search_string .. '.*') then
            matched_string = history_uniq[i]
            break
        end
    end

    -- 見つかった履歴を出力
    -- 見つからなければ、検索キーワードを出力
    this:call("KILL_WHOLE_LINE")
    if (matched_string ~= nil) then
        this:insert(matched_string)
    else
        this:insert(search_string)
    end
    this:call("BEGINNING_OF_LINE")
    for i = 1, this.pos - 1 do
        this:call("FORWARD_CHAR")
    end
end
```
