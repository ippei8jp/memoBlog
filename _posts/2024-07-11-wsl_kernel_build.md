---
title: WSLのカーネルをビルドする
date: 2024-07-11
tags: ["WSL"]
excerpt: WSLのカーネルをビルドする手順(Docker使用)
layout: default
---

# 概要
WSLでUSBストレージ(USBメモリなど)を使う方法を書こうと手順をまとめている間に、カーネル v6.6.36.3 がリリースされてしまいました。  
このバージョンは自前でビルドしなくてもUSBストレージ関連のドライバが入っています(Builtinモジュールではなくロードモジュールとして)。  
で、バイナリリリースされてしまえば何もしなくてもUSBストレージが使えるようになる(ハズ)ですが、
今日の段階はまだバイナリリリースされてないので自前でビルドしてみることにしました。  
以下はその時のメモ。  
で、手順は以下のサイトのDockerを使用して開発環境を構築する方法を ~~パクった~~  参考にしました。  
(もともとカーネル差し替えずにドライバ組み込む手順を調べてて参考にしたサイト)  

参照：[カーネルモジュールのビルドと使用](https://qiita.com/qawsed477/items/11e4248861fdf8c6a585?fbclid=IwZXh0bgNhZW0CMTAAAR1xXTBXfWFXYm0xDQBugh52dR0LuLYyxMRHjeuj4BidPo9gNW-OJfKAgjA_aem_k3Z0rVIUqWAtPxAia200VQ){:target="_blank"}  


# 準備の準備

## WSLディストリビューションでsystemdの有効化

systemdの方がDockerのサービスの操作とかやりやすい(情報が多い?)のでsystemdを有効化しておきます。  

>[!NOTE]
> インストールしたタイミングによっては既に有効化されているかも。  

　
使用するディストリビューションを起動し、``/etc/wsl.conf``に以下の設定を行います。  

```
[boot]
systemd=true
```

>[!NOTE]
> systemdを有効にするか否かはディストリビューション毎の設定

設定後、WSLをシャットダウン(コマンドプロンプト等から``wsl --shutdown``を実行)し、  
再度ディストリビューションを起動します。  

参考：[WSL2でsystemctlを使う方法](https://qiita.com/curacao/items/fb9adaf1c097b1acd6a8){:target="_blank"}  

>[!NOTE]
> systemdが動作しているか確認するには、``systemctl is-system-running`` を実行します。  
> ``running ``(起動中) ``degraded ``(起動中だが失敗したサービスなどが存在) と表示されれば動作しています。  
> ``offline `` と表示されれば起動していません。  
> その他使い方についてはぐぐってちょ。  


# Linuxカーネルのビルド環境の構築

## Dockerの準備

コンパイル環境はDockerコンテナを使用するので、Dockerをインストールします。  
Windows上で使用できるDocker Desktop for Windowsでも良いのですが、ディストリビューション上にDockerをインストールすることにします。  

>[!NOTE]
> Docker Desktop for Windows を使用する場合は「WSL統合」でDockerを統合したディストリビューションで作業することになるようです。  
> 試してないから分からんけど....


インストール方法は先人の知恵を拝借→[WSL(Ubuntu)にDocker環境を構築する](https://zenn.dev/thyt_lab/articles/fee07c278fcaa8){:target="_blank"}  
このページの通りに実行すればDockerがインストールできます。  

また、Dockerをsudoなしで実行できるように、dockerグループを追加しておきます。  
追加しなくてもsudoで実行できますが、作成されたファイルのオーナーがrootになってしまって面倒なのでおススメしません。  

以下、私が実際に行ったコマンドです。上記サイトの手順ほとんどそのままです。  

```bash
# apt keyring ファイル格納ディレクトリを作成
sudo install -m 0755 -d /etc/apt/keyrings

# 鍵ファイルの作成＆リード属性付与
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# aptリポジトリの追加
echo   "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] \
        https://download.docker.com/linux/ubuntu \
        "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" \
        | sudo tee /etc/apt/sources.list.d/docker.list

# 追加したリポジトリも含めてaptデータベースの更新
sudo apt update

# Dockerのインストール
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 自身にdockerグループを追加
sudo gpasswd -a $USER docker
```

dockerグループの追加を有効にするため、**ここで一旦ログアウトして再ログイン**  

dockerグループが追加されたことを確認します。  
```bash
groups
```

以下のようにdockerグループが追加されていればOK。  
```bash
XXXX adm cdrom sudo dip plugdev lxd docker
```

### Dockerのテスト

Dockerが正常にインストールできたか確認するため、hello-worldを実行します。  
実行後、コンテナを削除するように``--rm``オプションを指定。  

```bash
docker run --rm hello-world
```

以下のように表示されればOK。  
```
・・・・
Hello from Docker!
This message shows that your installation appears to be working correctly.
・・・・
```

使用したhello-worldイメージはもう使わないので削除しておきます。  

まずコンテナが残ってないか確認します。  
``-a``をつけるのを忘れずに!

```bash
docker ps -a
```

以下のようにヘッダ行だけ表示されればコンテナは残っていません(OKです)。  

```
CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
```

>[!NOTE]
> もしコンテナが残っていたら(rmオプション付け忘れなど)以下のように表示されます。  
> ```
> CONTAINER ID   IMAGE         COMMAND    CREATED          STATUS                      PORTS     NAMES
> ae8523f06af4   hello-world   "/hello"   13 seconds ago   Exited (0) 10 seconds ago             romantic_booth
> ```
> この場合は以下のコマンドで削除します(CONTAINER IDやNAMEは上で表示されたものを使用)。  
> ```bash
> # CONTAINER ID で指定
> docker rm ae8523f06af4
> # または NAME で指定
> docker rm romantic_booth
> ```

イメージを確認します。  

```bash
docker images
```

結果はこんな感じ。  
```
REPOSITORY    TAG       IMAGE ID       CREATED         SIZE
hello-world   latest    d2c94e258dcb   14 months ago   13.3kB
```

イメージを削除します。  
```bash
docker image rm hello-world
```

結果はこんな感じ
```bash
Untagged: hello-world:latest
Untagged: hello-world@sha256:94323f3e5e09a8b9515d74337010375a456c909543e1ff1538f5116d38ab3989
Deleted: sha256:d2c94e258dcb3c5ac2798d32e1249e42ef01cba4841c2234249495f87264ac5a
Deleted: sha256:ac28800ec8bb38d5c35b49d45a6ac4777544941199075dff8c4eb63e093aa81e
```

削除されたことを確認します。  
```bash
docker images
```

結果はこんな感じでヘッダ行だけ表示される  
```
REPOSITORY   TAG       IMAGE ID   CREATED   SIZE
```


>[!NOTE]
> カーネル入れ替えたり、なんやかんやしてるうちにDockerが起動しなくなることがありました。  
> そのときは ``systemctl status docker`` を実行して ``Active``の表示を確認します。
> ``failed``になっていたら起動に失敗しています。  
> 原因の調査方法はいろいろありますが、私が遭遇したパターンでは
> ``sudo dockerd --debug`` を実行してエラーメッセージを確認  
> ``networks have same bridge name`` と出ている場合は
> ``/var/lib/docker/network ``ディレクトリを消して(不安ならリネームして)、
> ``sudo systemctl start docker`` を実行します。  
> この後、 ``systemctl status docker`` を実行して 
> ``Active``の表示が``active (running)``になっていればOKのはず。  
> 
> 
> 
> 
> 


# カーネルのビルド

## 作業用ディレクトリの作成
たとえば、以下。 どこでも良いけど、以下の手順はこのディレクトリで行います。  

```bash
mkdir /proj/wsl_kernel && cd /proj/wsl_kernel
```

## カーネルソースの取得
作業ディレクトリ(``/proj/wsl_kernel``)にカーネルソースをダウンロードします。  
gitリポジトリをcloneするか、リリースソースをダウンロードして展開します。  

### gitでcloneする場合

```bash
git clone https://github.com/microsoft/WSL2-Linux-Kernel.git

# 目的のタグをチェックアウト
git -C WSL2-Linux-Kernel checkout -b WSL-6.6.36.3 refs/tags/linux-msft-wsl-6.6.36.3

# linuxディレクトリとしてアクセスしたいのでシンボリックリンク作成
ln -s WSL2-Linux-Kernel linux
```
>[!NOTE]
> clone済みなら念のため``git pull``して最新状態にしておく

>[!NOTE]
> ブランチ作る必要ないけど、念のため。


### リリースソース(zip)をダウンロードする場合

```bash
wget https://github.com/microsoft/WSL2-Linux-Kernel/archive/refs/tags/linux-msft-wsl-6.6.36.3.zip
unzip linux-msft-wsl-6.6.36.3.zip
# linuxディレクトリとしてアクセスしたいのでシンボリックリンク作成
ln -s linux-msft-wsl-6.6.36.3 linux
```

>[!NOTE]
> unzipはデフォルトではインストールされていないのでインストール必要。  


## スクリプト＆Dockerfileの入手
>[!NOTE]
> Gistに必要なスクリプト＆``Dockerfile``を置いておいたので以下のページの``DownloadZIP``ボタンからダウンロードして
> 作業ディレクトリ(``/proj/wsl_kernel``)に展開してください。  
> [Gist：WSLカーネルビルド環境](https://gist.github.com/ippei8jp/03c9a19e7c83281f43224786a9cc2021){:target="_blank"}  
> 
> または以下のコマンドで取得できます。  
> ```bash
> wget https://gist.github.com/ippei8jp/03c9a19e7c83281f43224786a9cc2021/archive/main.zip
> unzip -j main.zip
> ```

## Dockerイメージを作成
``Dockerfile``は上のサイトからダウンロードしてください。  
``Dockerfile``があるディレクトリで以下のコマンドを実行します。  

```bash
docker build -t wslkernelbuilder:2.0 .
```

Dockerfileの内容は以下の通り。  

<dev class="accordion_head_close"></dev>
<dev class="my-gist">
    <script src="https://gist.github.com/ippei8jp/03c9a19e7c83281f43224786a9cc2021.js?file=Dockerfile"></script>
</dev>

## Dockerコンテナの起動確認
上で作成したDockerイメージでコンテナを起動できることを確認します。  
このスクリプトは上のDockerイメージでDockerコンテナを起動し、シェルを実行します。  
```bash
bash build_wsl_interactive.sh
```
プロンプトが以下のように変わればOKです(最後のディレクトリはlinuxのリンク先の実体のディレクトリ名になります)。  
```
builder [ /usr/src/WSL2-Linux-Kernel ]$
```
適当なコマンドを入力して遊んでみてください(カレントディレクトリのファイルは消さないように)。  
最後は``exit``で終了します。  
起動時に``--rm``しているので、終了時コンテナは削除されます。  
なので、``/usr/src``ディレクトリ以外にファイルを作っても終了後はなくなります。  
もちろん``tdnf install``(marinerなのでaptではない)でインストールしたアプリケーションもきれいさっぱりなくなります。  
``/usr/src``ディレクトリはスクリプトを起動したディレクトリをマウントしていますので、
ここに作成したファイルはコンテナ終了後も残ります(逆に削除するとホストからも削除されます)。  

## カーネルのビルド

カーネルソースの取得、Dockeイメージのビルドが終わったら、以下のコマンドを実行します。  

```bash
bash build_wsl_kernel.sh
```

実行には1時間とか2時間とかのオーダーの時間がかかりますので、お茶でも飲んで気長に待ってください。  

実行完了後、``out``ディレクトリに``bzImage``と``linux-module-6.6.36.3-microsoft-standard-wsl2_6.6.36.3-3_amd64.deb``ができます。  
これらを使用するPCのWindowsから見えるフォルダ(例えば、``c:\WSL_KERNEL\``)にコピーします。  




### カーネルビルド用スクリプト

用意したスクリプトの概要は以下の通りです。  

#### build_functions.sh  
``build_functions.sh``はビルドに関わる処理を関数化したものをまとめたファイルです。  
以下のスクリプトからインクルードして使用します。  

Dockerコンテナを使用するので、あらかじめDockerイメージを作成しておく必要があります。  

<dev class="accordion_head_close"></dev>
<dev class="my-gist">
    <script src="https://gist.github.com/ippei8jp/03c9a19e7c83281f43224786a9cc2021.js?file=build_functions.sh"></script>
</dev>


#### build_wsl_kernel.sh
``build_wsl_kernel.sh``はカーネルのビルドを行います。  

<dev class="accordion_head_close"></dev>
<dev class="my-gist">
    <script src="https://gist.github.com/ippei8jp/03c9a19e7c83281f43224786a9cc2021.js?file=build_wsl_kernel.sh"></script>
</dev>


#### build_wsl_interactive.sh
``build_wsl_interactive.sh``はコンテナ内でインタラクティブにビルド操作をしたい場合に使用します。  
たとえば、新しくモジュールを有効化したいとき、``make menuconfig``して``make``するような場合です。  
実行するとコンテナ内のシェルが起動するので、実行したいコマンドを実行してください。  

<dev class="accordion_head_close"></dev>
<dev class="my-gist">
    <script src="https://gist.github.com/ippei8jp/03c9a19e7c83281f43224786a9cc2021.js?file=build_wsl_interactive.sh"></script>
</dev>


#### build_wsl_usb-storage.sh
``build_wsl_usb-storage.sh``はUSBストレージのカーネルモジュールのビルドを行います。  
バージョン6.6.*ではすでに有効になっているので、使用しません。  
バージョン5.15.*で標準カーネルのままカーネルモジュールをビルドして使用するときに使用します。  
6.6.*でも他のモジュールを有効化するときに参考になるかもと残しています。  

[参照先](https://qiita.com/qawsed477/items/11e4248861fdf8c6a585?fbclid=IwZXh0bgNhZW0CMTAAAR1xXTBXfWFXYm0xDQBugh52dR0LuLYyxMRHjeuj4BidPo9gNW-OJfKAgjA_aem_k3Z0rVIUqWAtPxAia200VQ){:target="_blank"}
の処理を少し書き換えただけです。  

outディレクトリに作成された``linux-module-usb-storage-5.15.153.1-microsoft-standard-wsl2_5.15.153.1-3_amd64``を使用するディストリビューションにコピーし、
以下のように実行しますが、インストール先の``/usr/lib/modules/5.15.153.1-microsoft-standard-WSL2/``が書き込み禁止のため
あらかじめここにoverlayfsをマウントしておく必要があります。  
マウント方法やその他使用方法は
[参照先](https://qiita.com/qawsed477/items/11e4248861fdf8c6a585?fbclid=IwZXh0bgNhZW0CMTAAAR1xXTBXfWFXYm0xDQBugh52dR0LuLYyxMRHjeuj4BidPo9gNW-OJfKAgjA_aem_k3Z0rVIUqWAtPxAia200VQ){:target="_blank"}
を参照してください。  

```bash
dpkg -i linux-module-usb-storage-5.15.153.1-microsoft-standard-wsl2_5.15.153.1-3_amd64
```
標準カーネルを使用することを前提にしているので、カーネルの差し替えは必要ありません。  



<dev class="accordion_head_close"></dev>
<dev class="my-gist">
    <script src="https://gist.github.com/ippei8jp/03c9a19e7c83281f43224786a9cc2021.js?file=build_wsl_usb-storage.sh"></script>
</dev>

>[!NOTE]
> このスクリプトは使用するWSLカーネルで実行されているディストリビューションで実行してください。  
> そうしないとBTFの確認(``check_btf``関数)が失敗します。  


# 差し替えたカーネルで実行

## WSLの停止
WSL実行中の場合はすべてのウィンドウを閉じます。  
さらにWSLを完全に終了するために以下のコマンドを実行します。  
```powershell
wsl --shutdown
```
念のため、すべて停止していることを確認を確認)

```powershell
wsl --list --verbose
```
結果はこんな感じで``STATE``がすべて``Stopped``になっていればOK。  
```
  NAME              STATE           VERSION
* Ubuntu-20.04-1    Stopped         2
  ubuntu-22.04-2    Stopped         2
  test_6_6          Stopped         2
```



## 差し替えカーネルの設定

差し替えカーネルを設定するため、``%USERPROFILE%\.wslconfig`` に以下を追記(なければ新規作成)します。  
ここで指定しているのは先にコピーしたbzImageファイルのパスです。  
ただし、フォルダ区切りの``\``は``\\``に置き換える必要があります。  

```
[wsl2]
kernel=c:\\WSL_KERNEL\\bzImage
```


## 差し替えカーネルでの起動
通常通り、ディストリビューションを起動します。  
起動後、ディストリビューション内のシェルで以下のコマンドを実行します。  

```bash
uname -r
```
結果が``6.6.36.3-microsoft-standard-WSL2``と差し替えたカーネルのバージョンになっていることを確認します。  


## カーネルモジュールのインストール

次に先ほどコピーしたカーネルモジュールをインストールします。  
>[!NOTE]
> カーネルモジュールのインストールはカーネル差し替え後に行ってください。  
> 差し替え前が標準カーネルだった場合、インストール先がリードオンリーのため、インストールに失敗します。  

```bash
dpkg -i /mnt/c/WSL_KERNEL/linux-module-6.6.36.3-microsoft-standard-wsl2_6.6.36.3-3_amd64.deb
```

インストールされると、``/usr/lib/modules/6.6.36.3-microsoft-standard-WSL2/``以下に各種ファイルが作成されます。  

インストールしたモジュールを読み込むため、ディストリビューションを再起動します。  
WSLを完全に終了するために以下のコマンドを実行します。  
```powershell
wsl --shutdown
```
念のため、すべて停止していることを確認(``STATE``が``Stopped``になっていることを確認)

```powershell
wsl --list --verbose
```
```
  NAME              STATE           VERSION
* Ubuntu-20.04-1    Stopped         2
  ubuntu-22.04-2    Stopped         2
  test_6_6          Stopped         2
```


再度カーネルモジュールをインストールしたディストリビューションを起動し、
起動したディストリビューションでモジュールが読み込まれていることを確認します。  

```bash
lsmod
```
以下のように、いくつかのモジュールが読み込まれていることを確認します。  
```
Module                  Size  Used by
intel_rapl_msr         16384  0
intel_rapl_common      36864  1 intel_rapl_msr
crc32c_intel           16384  0
configfs               61440  0
ip_tables              32768  0
autofs4                53248  0
```


# おわり
この状態でカーネルの差し替えは完了です。  
usbipd-win を使用すれば、USBシリアルやUSBストレージ、USBカメラも使えるようになります。
ただし、モジュールvhci-hcd(USB 仮想ホストコントローラインターフェース)が読み込まれていないので、
以下のコマンドで読み込んでおく必要があります。

```bash
sudo modprobe vhci-hcd
```

>[!NOTE]
> 起動時にモジュールを読み込むには、通常``/etc/modules``に設定しておけば良いのですが、
> 試してみましたがうまくいきませんでした。  
> ``/etc/wsl.conf``に以下のように記述しておくとうまくいくかもしれません。  
> ```
> [boot]
> systemd=true
> command=modprobe vhci-hcd
> ```







