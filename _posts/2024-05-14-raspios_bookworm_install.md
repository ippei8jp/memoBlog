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

# ウィンドウマネージャをOpenboxに変更はしない
VNCが色々不具合まみれなので以前のバージョンと同じX11ベースのOpenboxに変更した方が良かったんだけど
改善されているみたいなので変更しないでおく。  

IpV6無効の環境でwayfireでVNCを有効にする場合、以下のコマンドでwayfireでIPv4を使用するように設定する必要がある。  
```bash
sudo cp /etc/wayvnc/config /etc/wayvnc/config.org
sudo sed -i "s/\:\:/0\.0\.0\.0/g" /etc/wayvnc/config
```
``/etc/wayvnc/config``の2行目の``address=::``を``address=0.0.0.0``に変更している。  


> [!NOTE]
> ちなみにOpenboxに変更したい場合は以下のコマンドで変更できる。  
> 
> 変更後、リブート必須。  
> ```bash
> sudo raspi-config nonint do_wayland W1
> sudo reboot 
> ```
> 
> 以下のコマンドでデフォルトのウィンドウマネージャ(wayfire)が無効になっていることを確認する。  
> なにも表示されなければOK  
> ```bash
> pgrep wayfire
> ```

# お約束

ソフト類を最新版にする。  
```bash
sudo apt update
sudo apt upgrade 
sudo reboot 
```

# お好みで
その他お好み設定は以下のページと同じ。  
[Raspberry Pi OS(64bit)のインストール(Raspberry Pi Imager)]({{ site.baseurl }}/2022/06/28/raspios_64_Imager.html){:target="_blank"}
めんどくさいのでスクリプトを実行。  
```bash
wget https://gist.githubusercontent.com/ippei8jp/8053f0804a694c34cb18cd4035e0993c/raw/pi_setup1.sh
bash pi_setup1.sh 
sudo reboot 
```


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


