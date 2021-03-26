---
title: WSL2でX-serverへの表示
date: 2021-03-13
tags: ["WSL","VcXsrv"]
excerpt: WindowsTerminal上のWSL2コンソールからGUIプログラムを起動する場合の設定メモ
layout: default
---
# 概要
MobaXtermを使えば何もしなくてもGUIプログラムを表示できるけど、
WindowsTerminalなどから表示したい場合に対応してみた。  

# Windows側の設定
VcXsrvをインストールして起動しておく。  
参考：[WindowsでX-serve]({{ site.baseurl }}/2019/11/26/VcXsrv.html){:target="_blank"}

# Linux側の設定
``.bashrc``に以下を追加

```bash
# HOSTのIPアドレス取得
# export HOST_IP_ADDR=$(host `hostname`.mshome.net | sed -r 's/.*address (.*)$/\1/')
# HOSTのIPアドレス取得(アドレスが2つ以上返ってきたときは1個目だけ取り出す)
export HOST_IP_ADDR=$(host `hostname`.mshome.net | sed -r 's/.*address (.*)$/\1/' | sed -n 1p)

# DISPLAY変数が未定義(MobaXterm使用でない)ならDISPLAYを設定する
if [ -v $DISPLAY ]; then
    export DISPLAY=${HOST_IP_ADDR}:0.0
fi
echo DISPLAY="$DISPLAY"
```

> [!NOTE]
> 他の用途でホストのIPアドレス(名前でなく)を使いたいときのために別に変数作っておいた。  
> 以下のように名前で書いて指定しても良い。  
> マシン名は``hostname``コマンドで得られるので、別のマシンに移動しても変更の必要はない。  
> ```bash
> export DISPLAY=`hostname`.mshome.net:0.0
> ```
> ``.mshome.net``ドメインを指定するとホスト側のIPアドレスが得られるらしい。  
> ドメインなしだと``localhost``になっちゃうから注意。  
> ぐぐると``/etc/resolv.conf``を``awk``でごちょごちょやるのが流行っているが  
> 本来の設定値ではない(結果的に同じだけど)のでちゃんと設定しておくことにする。  


> [!NOTE]
> ドメイン``mshome.net``はHyper-Vのネットワークのドメインらしい。  
> 要はWSL-Windows間の仮想ネットワークのドメイン名みたい。  
> ちなみに、WSL2上から``nslookup <<ホストのIPアドレス>>``とやったら出てきた。  

# X-Windowを使用するプログラムを起動
なんか起動してちょ。
とりあえず``xeyes``とか。  
ちなみに、``xeyes`` は ``sudo apt install x11-apps``でインストールできる。

# WSLからのGUI表示が行えない場合の対処

## 原因
WSLのネットワークがパブリックネットワークになっており、  
WSLネットワークからの接続要求がファイアウォールで はじかれている。  



## ファイアウォールの設定変更による回避

VcXsrvをパブリックネットワークからの接続も受け付けるようにする 
以下手順。

- コントロール パネル  →  Windows Defender ファイアウォール
- 左側上から2番目「Windows Defender ファイアウォールを介したアプリまたは機能を許可」をクリック
- 名前の欄から「VcXsrv windows xserver」を探す
- その横のチェックボックスの「パブリック」側(右側)にもチェックを入れる(プライベート側は既にチェックが入っているはず。そっちはそのまま)。
- OKボタンをクリックして終了
- コントロールパネルは閉じてOK


## ちなみに

以下のような回避方法もある。  

### DISPLAY変数を変更して回避
一旦WSLネットワークから外に出て接続すれば接続できる。  
具体的には、DISPLAY変数をWSL側のIPアドレス(172.xxx.xxx.xxx)ではなく、  
Wi-Fiやイーサネットに割り当てられたアドレス(一般に 192.168.xxx.xxx)を指定する。  
 → WSL側から自動的にアドレスを取得できないのであまりおススメできない。  
    VcXsrvがちゃんと動いているかを確認するには有効な手段かも。  

### 根本的回避
[備忘録 - （先日の続き） 識別されていないネットワーク をプライベートネットワークにする](https://daizo3.tumblr.com/post/150523393217/%E5%82%99%E5%BF%98%E9%8C%B2-%E5%85%88%E6%97%A5%E3%81%AE%E7%B6%9A%E3%81%8D-%E8%AD%98%E5%88%A5%E3%81%95%E3%82%8C%E3%81%A6%E3%81%84%E3%81%AA%E3%81%84%E3%83%8D%E3%83%83%E3%83%88%E3%83%AF%E3%83%BC%E3%82%AF-%E3%82%92%E3%83%97%E3%83%A9%E3%82%A4%E3%83%99%E3%83%BC%E3%83%88%E3%83%8D%E3%83%83%E3%83%88%E3%83%AF%E3%83%BC%E3%82%AF%E3%81%AB%E3%81%99%E3%82%8B)  
によると、  
[Windowsで、「識別されていないネットワーク」の種類を「パブリック ネットワーク」から「プライベート ネットワーク」に変更する](https://www.atmarkit.co.jp/ait/articles/1012/24/news127.html)  
の「レジストリによる設定」に記載された方法でも出来るらしいけど(こっちの方が根本的解決な気がする)、  
レジストリ弄るのは気が引けるので、小手先対処にて。  


