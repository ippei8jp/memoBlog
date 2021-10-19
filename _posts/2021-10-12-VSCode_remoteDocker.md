---
title: ローカルのVSCodeからリモートホスト上のDockerコンテナ内のプログラムをデバッグする
date: 2021-10-12
tags: ["VSCode", "Docker", "Windows", "Ubuntu"]
excerpt: ローカル(Windows)のVSCodeからリモートホスト(ubuntu)上のDockerコンテナ内のプログラムをデバッグする
---

# 概要
Windows上のVSCodeからUbuntu上のDockerコンテナに接続してデバッグする方法。

UbuntuへのDockerインストール方法は[こちら]({{ site.baseurl }}/2021/10/08/Docker_install.html){:target="_blank"}
sudo なしで Docker動かせるようにしとく必要あり  

# リモートホストへの接続
UbuntuへのSSH接続の準備については[こちら]({{ site.baseurl }}/2021/10/11/SSH_setup.html){:target="_blank"}  

## 手順
- WindowsマシンでVScode 起動する  
- 拡張機能「Remote Development」をインストールしておく。  
- 左下にある「><」ボタンをクリック  
- 上にメニューが出るので、「Connect to host...」 または「Connect Current Window to Host...」を選択  
- 続いて「Select configured SSH host～」で接続するホストを選択。  
    - 新規接続の場合は「Add New SSH Host...」を選択  
    - 「ssh «user»@«IPアドレス or マシン名»」  
    - 設定を保存するファイルを選択。特に理由がなければ c:\Users\«ユーザ»\.config でいいかな。  
    - 右下に「Host added!」ウィンドウが出るので「Connect」をクリック  
    - 初めて接続するホストの場合、上にSelect the platform of remote host "～" と聞かれるのでOS種別を選択  
    - 「あんた«OS»を選らんだでー。～に保存したから変えたかったら ここ変更しぃや～」みたいなことを言ってるウィンドウが出るので「Don't Show Again」をクリック  

- 接続された。右下の「><」ボタンが「>< SSH:«マシン名»」に変わっている。  

>[!NOTE]
> 一度接続すればリモートエクスプローラ(SSH TARGETS)に表示されるのでそこから接続しても良い。  

リモートホスト上のプログラムをデバッグしたい場合はここでフォルダを開いてごちょごちょやればよい。  

# Dockerコンテナへの接続
## 準備
WindowsマシンにDocker desktop for windows が必要になるので、インストールしておく。  
WindowsへのDockerインストール方法は[こちら]({{ site.baseurl }}/2021/10/08/Docker_install.html)  
CLIだけでよさそうなんだけど、CLIだけってのがどこかにあるのか分からんかったのでとりあえず全部入れた。  
Docker Desktopは動いてなくて良いので、Exitして可。  
普段から使わないならDocker Dashboardの設定のGeneralから「Start Docker Desktop when you log in」のチェックを はずしておけばOK。  

## docker.exeで疎通確認
コマンドプロンプト等で以下を実行  
```bash
set DOCKER_HOST=ssh://«ユーザ名»@«ホスト»
docker ps -a
```
リモートホスト上のコンテナの状態が返ってくるか確認。  

## DOCKER HOSTの設定
VScodeの``settings.json`` に以下の一文を追加する。もちろん上で確認した内容で。
```json
    "docker.host": "ssh://«ユーザ名»@«ホスト»",
```
>[!NOTE]
> ローカルにつなぎたいときはこの行をコメントアウト(``//``をつける)すればOK。  
> ``setting.json``はJSONファイルだけど、 ``//``でコメントアウトできる。  

>[!NOTE]
> VScode settings.json の開き方  
> - メニュー ファイル→ユーザ設定→ 設定 
> - 設定画面の右上のボタン「設定(JSON)を開く」をクリック  
> 
> または
> - メニュー表示→コマンドパレット
> - Preference:  Open Settings(JSON) を選択

## VScodeでリモート エクスプローラからリモートホストに接続（その1）
リモートホストに拡張機能 Docker と Docker Explorer をインストールしておき、
Dockerペインを開くとリモートホスト上のコンテナとかが見える

ここでは既にリモートホスト上でコンテナ作成済みとする。  
(イメージからコンテナ作ったりDockerfileからBuildしたりできると思うけど、今はおいとく)  

- 接続するコンテナが起動していない場合はDockerペインで使用するコンテナを右クリック→Start でコンテナを起動    
- 起動したら対象コンテナのアイコンが三角マークになる  
- 同じくDockerペインで使用するコンテナを右クリック→Attach Visual Studio Code を選択  
- select the container to attach VS Code と聞かれるのでアタッチするコンテナを選択(コンテナ選択してAttachしたはずだけど、なぜかここで再度選択が必要)  
- 初めて接続した場合は「Attaching to a container may execute arbitrary code」  
と言われるので、変なコードが実行されないことが分かっていれば Got it をクリック
- 接続された。右下の「><」ボタンが「>< Conteiner «コンテナ名»」に変わっている。  

あとはリモート SSH や ローカルのDockerでのデバッグと同じ。

## 接続の終了
接続を終了する場合は
- メニュー表示→コマンドパレット
- Remote:  Close Remote Connection を選択

このとき、コンテナからだけでなく、リモートホストからも切断される。  


## VScodeでリモート エクスプローラからリモートホストに接続（その2）
リモートエクスプローラ(Containers)で接続するコンテナを右クリックし、「Attach to Container」または「Attach in New Window」を選択  
(コンテナが起動されていなければ起動して)コンテナに接続される。  

あんまりごちょごちょしなくて済むのでこっちの方がおススメかな。


# ネットワークポート
通常Cockerコンテナ内のネットワークポートをホストや外部コンピュータからアクセスするには、  
コンテナ作成時に-p (--publish) オプションで接続を受け入れるポート番号を指定する必要があるが、  
VScodeから接続している場合は、Docker内のネットワークポートにVScodeが実行されているマシンからlocalhost:«ポート番号»で接続できる。  
(アクセス遅いけど、ちょっと別のポート開けて試したい なんて時には便利)  

ただし、これはDockerが動作しているホストコンピュータや他のコンピュータからはアクセスできない。  
これらからアクセスするには-pオプションを指定する必要がある。  

# その他
<https://qiita.com/Yuki_Oshima/items/d3b52c553387685460b0>  
↑ここにある、「Remote-Containers: Open Folder in Container...」での手順はリモートホストに接続した状態では実行できないらしい。  
どうしてもこのコンテナでデバッグしたい場合は、  
一旦リモートホスト上でVSCodeを起動してコンテナを作成しておき、  
その後ローカルPCからこのコンテナにアタッチするような手順をふめばデバッグできる。  

