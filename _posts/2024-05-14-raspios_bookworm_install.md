---
title: Raspberry Pi OS(Bookworm)のインストール(Raspberry Pi Imager)
date: 2024-05-14
tags: ["RaspberryPi","setup"]
excerpt: Raspberry Pi OS(bookworm)のRaspberry Pi Imagerを使用したインストールと初期設定。
layout: default
---

# 概要
RaspberrypiOSがBookwormになったので、インストール方法のメモ。  
基本的にBullseyeのときと変わらないけど、ちょっと変わったところもあるので。  
[Bullseyeのときの手順メモ]({{ site.baseurl }}/2022/06/28/raspios_64_Imager.html){:target="_blank"}も参照してください。    

# SDカードへの書き込み
Raspberry Pi Imager で書き込み。  
使い方はあちこちに書いてあるけど、例えばこちら。  
- [Raspberry Pi Imager のインストールと使い方](https://qiita.com/mmake/items/576a2f60dffcd9291da3/){:target="_blank"}   

バージョン変わると微妙に手順が変わったりするので、最新情報はぐぐってちょ。  

# ブート前の設定

ブートの前にSDカードのFATパーティションのファイルをいじっておく。
> [!NOTE]
> 下記の変更をイッパツで行うスクリプトは以下。  
> Windowsのコマンドプロンプトで実行すると想定。  Windows版python必要。  
> それぞれの``F=``の部分を対象のドライブレターに変更する。  
>
> - UARTにUARTコネクタを使用する場合はこちら  
> ```bash
> python -c "import re;F=r'G:\config.txt';a=open(F).read();a=re.sub(r'\[all\](?!.*\[all\])', '[pi5]\ndtparam=uart0\n\n[all]\nenable_uart=1\n', a, flags=re.DOTALL);open(F, 'w').write(a)"
> python -c "F=r'G:\cmdline.txt';a=open(F).read();a=a.replace(' quiet', '').replace(' splash', '').replace(' plymouth.ignore-serial-consoles', '')+' ipv6.disable=1';open(F, 'w').write(a)"
> ```
> - UARTに40pinヘッダのpin8/10(GPIOs 14 & 15)を使用する場合はこちら  
> ```bash
> python -c "import re;F=r'G:\config.txt';a=open(F).read();a=re.sub(r'\[all\](?!.*\[all\])', '[pi5]\ndtparam=uart0_console\n\n[all]\nenable_uart=1\n', a, flags=re.DOTALL);open(F, 'w').write(a)"
> python -c "F=r'G:\cmdline.txt';a=open(F).read();a=a.replace(' quiet', '').replace(' splash', '').replace(' plymouth.ignore-serial-consoles', '')+' ipv6.disable=1';open(F, 'w').write(a)"
> ```



## UARTコンソールの有効化

UARTをコンソールとして使用するために``config.txt`` の 最後の ``[all]`` の行を以下に変更

- UARTにUARTコネクタを使用する場合はこちら  

```
[pi5]
dtparam=uart0

[all]
enable_uart=1
```

- UARTに40pinヘッダのpin8/10(GPIOs 14 & 15)を使用する場合はこちら   

```
[pi5]
dtparam=uart0_console

[all]
enable_uart=1
```

## IPv6の無効化
IPv6を無効化しておきたいときは、
``cmdline.txt`` に ``ipv6.disable=1``を追加する。  
このファイルは1行で書かないといけないので、改行してはいけない。  

## ブートログの表示

ブートログが見えないと不安な人は、  
``cmdline.txt`` から ``quiet`` ``splash`` ``plymouth.ignore-serial-consoles``
を削除しておくとよい。  
>[!NOTE]
> LITE版では``quiet``を削除(それ以外は指定されていないので)  


# 最初の起動
書き込んだSDカードをRaspberry Piに挿入して電源ON。  
ごちょごちょと設定したあと、起動する(途中2回ほどrebootしてるらしい)  

# お約束

ソフト類を最新版にする。  
```bash
sudo apt update
sudo apt upgrade 
sudo reboot 
```

> [!NOTE]
> #### ウィンドウマネージャをOpenboxに変更したい場合 ####
> VNCに不具合がるなどの理由で以前のバージョンと同じX11ベースのOpenboxに変更したい場合は以下の手順で変更する。  
> ちなみにOpenboxに変更したい場合は以下のコマンドで変更できる。  
> VNCを有効化した後にウィンドウマネージャを変更すると動作が不安定になることがあるので、VNCを有効化する前に変更するのがベター。  
>
> 
> ```bash
> sudo raspi-config nonint do_wayland W1
> sudo reboot 
> ```
> 
> VNC有効化後、以下のコマンドでデフォルトのウィンドウマネージャ(wayfire)が無効になっていることを確認する。  
> なにも表示されなければOK  
> ```bash
> pgrep wayfire
> ```



# お好みで

その他お好み設定は
[Raspberry Pi OS(64bit)のインストール(Raspberry Pi Imager)]({{ site.baseurl }}/2022/06/28/raspios_64_Imager.html){:target="_blank"}
と同じ。  
めんどくさいのでスクリプトを実行。  

```bash
wget https://gist.githubusercontent.com/ippei8jp/8053f0804a694c34cb18cd4035e0993c/raw/pi_setup1.sh
bash pi_setup1.sh 
# 途中sambaのパスワード設定がある  
sudo reboot 
```
> [!NOTE]
> IpV6無効の環境でwayfireでVNCを有効にする場合、VNCを有効化する前に
> 以下のコマンドでwayfireでIPv4を使用するように設定する必要がある。  
> この処理は上の``pi_setup1.sh``の処理に含まれている。  
> 
> ```bash
> sudo cp /etc/wayvnc/config /etc/wayvnc/config.org
> sudo sed -i "s/\:\:/0\.0\.0\.0/g" /etc/wayvnc/config
> ```
> ``/etc/wayvnc/config``の2行目の``address=::``を``address=0.0.0.0``に変更している。  



# pyenvのインストール
```bash
sudo apt install -y make build-essential libssl-dev zlib1g-dev libbz2-dev \
libreadline-dev libsqlite3-dev wget curl llvm libncurses5-dev libncursesw5-dev \
xz-utils tk-dev libffi-dev liblzma-dev python3-openssl git

export PYENV_ROOT=/proj/.pyenv    #環境に合わせて修正してね
git clone https://github.com/yyuu/pyenv.git ${PYENV_ROOT}
git clone https://github.com/yyuu/pyenv-virtualenv.git ${PYENV_ROOT}/plugins/pyenv-virtualenv
git clone https://github.com/pyenv/pyenv-update.git ${PYENV_ROOT}/plugins/pyenv-update
```

ここで一旦ログアウト＆再ログイン

# pythonのインストール
```bash
pyenv install 3.11.9
pyenv shell 3.11.9 
pip install --upgrade pip setuptools wheel
pyenv shell --unset 
```


