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


