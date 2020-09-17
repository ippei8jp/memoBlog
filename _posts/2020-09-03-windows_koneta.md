---
title: Windows 小ネタ集
date: 2020-09-03
tags: ["Ubuntu"]
excerpt: Windowsの小ネタ集
---

# エクスプローラーの右クリックメニューをカスタマイズ

以下のページに詳しい説明がある。  
- [エクスプローラーの右クリックメニューをカスタマイズする](https://ascii.jp/elem/000/000/953/953807/)  
  - わりと全体的な話    
- [あなただけの右クリックで、ストレスフリーな開発を](https://qiita.com/NumLocker/items/f8016f1aed7207b850fb)  
  - 詳細な設定項目など  
  - フォルダの右クリックとかデスクトップの右クリックなんかも記載アリ  

順序を指定したい場合は``position``キーで ``Top``/``Middle``/``Bottom`` を指定することでできるが、あくまで3種類だけ(下のリンクの[ここ](https://qiita.com/NumLocker/items/f8016f1aed7207b850fb#6-7-%E3%83%A1%E3%83%8B%E3%83%A5%E3%83%BC%E3%81%AE%E8%A1%A8%E7%A4%BA%E4%BD%8D%E7%BD%AE%E3%81%AE%E5%A4%89%E6%9B%B4))。  
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

参考： [Windows 10、バージョン 1809 において、マップされたネットワークドライブの再接続に失敗する場合がある](https://support.microsoft.com/ja-jp/help/4471218/mapped-network-drive-may-fail-to-reconnect-in-windows-10-version-1809?fbclid=IwAR3FHRrLbLXn8rp_qigZW46oeAWs22x6Uqh-0Nu7psOKDA45UlOo7a9wlg0)
