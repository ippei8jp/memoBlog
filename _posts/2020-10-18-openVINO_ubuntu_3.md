---
title: openVINO フルパッケージ(2021.1)をインストール(追加)
date: 2020-10-18
tags: ["DeepLearning", "openVINO", "NCStick2", "Ubuntu"]
excerpt: openVINO フルパッケージをubuntuにインストールする(Ver.2021.1対応)
---



以前、[openVINO フルパッケージをubuntuにインストール(改訂版)]({{ site.baseurl }}/2020/06/16/openVINO_ubuntu_2.html)で
ubuntuへopenVINO 2020.3のインストールしたが、今回は 2021.1 を追加インストールしたのでメモ。  

使用したubuntuのバージョンは18.04。  

# ソフトウェアのダウンロード
## Intelへの登録
前に登録したときに通知されたURLから「Choose Version」でバージョン選んでダウンロードできる。  
新しく登録しなても大丈夫(登録方法は[前回のメモ]({{ site.baseurl }}/2020/06/16/openVINO_ubuntu_2.html)参照)。   

## ダウンロード
登録したメールアドレス宛にメールが届くので、その中の<span style="border: 1px solid;">Download&gt;</span>をクリック  
開いたページでダウンロードするバージョンを選択して、<span style="border: 1px solid;">Full Package</span>をクリックしてダウンロードファイルを保存  
※ 登録しないとダウンロードさせてくれないみたいなので、ダウンロードファイルへの直リンクは記載をやめとく。  

# python 環境の準備
これは前回と同じ。  

# インストール
## 必要なパッケージのインストール
[前回のメモ]({{ site.baseurl }}/2020/06/16/openVINO_ubuntu_2.html)と同じで大丈夫だが、  
cmakeは``apt``でインストールしたバージョンだと古くてNGといわれてしまうので、  
別途本家からダウンロードしてインストールする。  

- 既に``apt``でインストール済みの場合は、アンインストールする  
```bash
sudo apt purge --auto-remove cmake
```

- 本家からダウンロードして展開   
```bash
wget https://github.com/Kitware/CMake/releases/download/v3.18.4/cmake-3.18.4-Linux-x86_64.tar.gz  
tar xzvf cmake-3.18.4-Linux-x86_64.tar.gz 
```
- /opt ディレクトリに移動
```bash
sudo mv cmake-3.18.4-Linux-x86_64 /opt/
```
- /usr/bin ディレクトリにシンボリックリンク作成  
```bash
sudo ln -s /opt/cmake-3.18.4-Linux-x86_64/bin/* /usr/bin/
```
- バージョン確認  
```bash
cmake --version 
```


## openVINOのインストール
インストール手順も[前回のメモ]({{ site.baseurl }}/2020/06/16/openVINO_ubuntu_2.html)と同じで大丈夫。  

完了したらこれが表示されるページのURLは以下に変更されている。  
<https://docs.openvinotoolkit.org/2021.1/openvino_docs_install_guides_installing_openvino_linux.html#install-external-dependencies>

## インストールスクリプト実行後の設定  

2020.3インストール済みだと端折っても大丈夫かと思ったけど、微妙にパッケージ増えてたりするので、再度やった方が良い。  
環境変数の設定のために、``~/.bashrc``に記述する処理は以下に変更(``openvino``→``openvino_2021``)。  
```bash
source /opt/intel/openvino_2021/bin/setupvars.sh
```
> [!WARNING]
> ``install_openvino_dependencies.sh``を実行すると、再度``apt``で``cmake``がインストールされてしまいます。  
> openVINOのインストール完了後であれば``cmake``のバージョンが古くても大丈夫ですが、  
> 気になるなら、再度アンインストールとシンボリックリンクの作成を行います。  
> (実行前に``install_openvino_dependencies.sh``を編集してcmake消しておいても良いけど)

### Steps for Intel® Movidius™ Neural Compute Stick and Intel® Neural Compute Stick 2

これは2020.3インストール済みだと端折ってもOK。  
初めてインストールなら[前回のメモ]({{ site.baseurl }}/2020/06/16/openVINO_ubuntu_2.html)を参照。  




