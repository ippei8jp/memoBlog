---
title: openVINOのクロスコンパイル
date: 2022-03-10
tags: ["RaspberryPi", "openVINO", "Docker", "Windows", "Ubuntu"]
excerpt: Raspberry Pi OS(64bit)向けopenVINOのbuild(クロスコンパイル環境)
---

# 概要
Raspberry Pi OS(64bit)向けにopenVINOをクロスコンパイルする方法についてまとめた。  
セルフコンパイル(Docker使用)については『[openVINO(Raspberry Pi OS(64bit)向け)のbuild]({{ site.baseurl }}/2022/03/07/openVINO_build_2.html){:target="_blank"}』を参照。  
ただ、クロスコンパイルだとセルフコンパイルの10倍くらい速い(環境によるけど)ので、クロスコンパイルがおススメ。  

今回はUbuntu上のDockerコンテナを使用したが、おそらくWindowsのDocker Desktop for Windowsでも出来ると思う。

# 準備  
Dockerのインストールは[こちら]({{ site.baseurl }}/2021/10/08/Docker_install.html){:target="_blank"}を参照。  

## 作業用ディレクトリの準備

適当なディレクトリを作成して移動。
```bash
mkdir -p /work/docker_work/ov_pi64_cross && cd /work/docker_work/ov_pi64_cross
```

## ソースの取得
### openVINO の gitリポジトリを clone
openvino と openvino_contrib のリポジトリをcloneする。  
必ず同じディレクトリに(後の指定がめんどくさくなるので)。  

```bash
mkdir work
git -C ./work  clone  -b 2021.4.2 --depth 1 https://github.com/openvinotoolkit/openvino.git 
git -C ./work  clone  -b 2021.4   --depth 1 https://github.com/openvinotoolkit/openvino_contrib.git
git -C ./work/openvino         submodule update --init --recursive --depth 1
git -C ./work/openvino_contrib submodule update --init --recursive --depth 1
```

>[!NOTE]
> ``git submodule`` にも ``--depth 1``をつけると早いし、ディスクの節約にもなる。  

### patchファイルを作成＆適用
以下の1つのpatchファイルを作成する。  
サンプル(テスト?)プログラムのBuildを抑制してコンパイル時間の短縮を計っている。  

{% include filename.html filename="patch2.patch" %}
```diff
diff --git a/tests/SConscript b/tests/SConscript
index 041ed8f54..d90ffd844 100644
--- a/tests/SConscript
+++ b/tests/SConscript
@@ -28,12 +28,12 @@ Import('install_bin')
 
 # vars is imported from arm_compute:
 variables = [
-    BoolVariable("benchmark_examples", "Build benchmark examples programs", True),
-    BoolVariable("validate_examples", "Build validate examples programs", True),
-    BoolVariable("reference_openmp", "Build reference validation with openmp", True),
+    BoolVariable("benchmark_examples", "Build benchmark examples programs", False),
+    BoolVariable("validate_examples", "Build validate examples programs", False),
+    BoolVariable("reference_openmp", "Build reference validation with openmp", False),
     #FIXME Switch the following two options to False before releasing
-    BoolVariable("validation_tests", "Build validation test programs", True),
-    BoolVariable("benchmark_tests", "Build benchmark test programs", True),
+    BoolVariable("validation_tests", "Build validation test programs", False),
+    BoolVariable("benchmark_tests", "Build benchmark test programs", False),
     ("test_filter", "Pattern to specify the tests' filenames to be compiled", "*.cpp")
 ]
```

上記のpatchをあてる
```bash
(cd ./work/openvino_contrib/modules/arm_plugin/thirdparty/ComputeLibrary; patch -p1 < ../../../../../../patch2.patch)
```

>[!NOTE]
> gitコマンドでもpatchをあてられる。  
> ```bash
> git -C ./work/openvino_contrib/modules/arm_plugin/thirdparty/ComputeLibrary apply  ../../../../../../patch2.patch
> ```


### openCV の gitリポジトリを clone
opencv のリポジトリをcloneする(opencvのBuildを行わない場合は不要)。  
今回はcontribはBuildしないのでcloneしない。  

```bash
git -C ./work clone  -b 4.5.3-openvino-2021.4.2 --depth 1 https://github.com/opencv/opencv
```

## Dockerコンテナの作成＆起動

### Dockerfileを作成
以下の内容でDockerfileを作成する。  

{% include filename.html filename="Dockerfile" %}
```dockerfile
FROM amd64/debian:bullseye

USER root

RUN dpkg --add-architecture arm64 && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    crossbuild-essential-arm64 \
    git \
    wget \
    libusb-1.0-0-dev:arm64 \
    libgtk-3-dev:arm64 \
    libavcodec-dev:arm64 \
    libavformat-dev:arm64 \
    libswscale-dev:arm64 \
    libgstreamer1.0-dev:arm64 \
    libgstreamer-plugins-base1.0-dev:arm64 \
    libpython3-dev:arm64 \
    libprotobuf-dev:arm64 \
    libprotoc-dev:arm64 \
    protobuf-compiler \
    cmake \
    python3-minimal \
    python3-pip \
    python3-numpy \
    cython3 \
    scons

RUN git config --global user.name "«ユーザ名»" && \
    git config --global user.email "«メールアドレス»"

WORKDIR /work
```
>[!TIP]
> git config ～ を設定してないと、cmake中にgit cloneが失敗する  

### Dockerイメージ作成
DockerfileからDockerイメージを作成する。  
以下ではイメージ名に ``ov_pi64_cross`` を使用。  

```bash
docker image build -t ov_pi64_cross .
```

### Dockerコンテナ作成
DockerイメージからDockerコンテナを作成する。  
以下ではコンテナ名に ``ov_pi64_cross_1`` を使用。  

```bash
docker create -it -v $PWD/work:/work --name ov_pi64_cross_1 ov_pi64_cross /bin/bash
```
>[!TIP]
> Windowsでは``$PWD``の代わりに``%CD%``を使用

### Dockerコンテナ起動
Dockerコンテナを起動する。  

```bash
docker start -ia ov_pi64_cross_1
```

>[!TIP]
> Dockerコンテナに別コンソールから入るにはこれ
> 
> ```bash
> docker exec -it ov_pi64_cross_1 /bin/bash
> ```

# openVINOのBuild
ここからコンテナ内  

## buildディレクトリの作成
```bash
mkdir -p /work/openvino/build && cd /work/openvino/build
```

## cmake実行
```bash
cmake -DCMAKE_BUILD_TYPE=Release \
      -D CMAKE_INSTALL_PREFIX=/work/opt/intel/openvino \
      -D CMAKE_TOOLCHAIN_FILE="../cmake/arm64.toolchain.cmake" \
      -D CMAKE_C_FLAGS="-pthread" \
      -D CMAKE_CXX_FLAGS="-pthread" \
      -D ENABLE_PYTHON=ON \
      -D PYTHON_EXECUTABLE=/usr/bin/python3.9 \
      -D PYTHON_LIBRARY=/usr/lib/aarch64-linux-gnu/libpython3.9.so \
      -D PYTHON_INCLUDE_DIR=/usr/include/python3.9 \
      -D IE_EXTRA_MODULES=../../openvino_contrib/modules \
      -D BUILD_java_api=OFF \
      -D ENABLE_SAMPLES=OFF \
      -D ENABLE_CLANG_FORMAT=OFF \
      -D ENABLE_OPENCV=OFF \
    .. 2>&1 | tee cmake.log
```

>[!NOTE]
> - サンプルはBuildしないので、ENABLE_SAMPLES=OFF を設定  
> - ソースをいじるわけではないので、ENABLE_CLANG_FORMAT=OFF を設定  
> - openCVインストールされていないので、ENABLE_OPENCV=OFF を設定  
>   (サンプルのBuildしないのでopenCVなくても大丈夫)  

>[!NOTE]
> ログには いくつかWarningがあるが、とくに問題はなさそう  

## make

```bash
make --jobs=$(nproc --all) 2>&1 | tee build.log
```

## install
```bash
make install 2>&1 | tee install.log
```
これを実行すると。
``/work/opt/intel/openvino`` にインストールされる。
これが実際の環境の``/opt/intel/openvino`` に相当する。  
インストール先を変更したい場合は``cmake``の
オプションの``-DCMAKE_INSTALL_PREFIX=/work/opt/intel/openvino``の部分を変更すれば良いけど、
どうせアーカイブしてコピーして使うからあんまり関係ないとおもう。  


## その他細々したところ

```bash
# CPU extension のコピー
cp /work/openvino/bin/aarch64/Release/lib/libarmPlugin.so /work/opt/intel/openvino/deployment_tools/inference_engine/lib/aarch64/

# シンボリックリンクの作成
ln -s -r /work/opt/intel/openvino/deployment_tools/inference_engine /work/opt/intel/openvino/

# クロスコンパイルを反映したファイル名になっていないので修正
mv /work/opt/intel/openvino/python/python3.9/_pyngraph.cpython-39-x86_64-linux-gnu.so /work/opt/intel/openvino/python/python3.9/_pyngraph.cpython-39-aarch64-linux-gnu.so

```
>[!NOTE]
> - CPU Extentionは``make install``でコピーされないので手動でインストールする。  
> - バイナリリリースに``inference_engine``のシンボリックリンクがあるので同様に作成しておく。  
> - ngraphのライブラリファイルのファイル名がx86_64(ホスト環境の名前)になっているので、aarch64に修正。  
>   バイナリ自体はaarch64になっているので、ファイル名のリネームだけでOK。  
>   本来はファイル名決めてるところで対処するのが良いのだろうけど、とりあえず力技で。   


# openCVのBuild
openCVのBuild方法についてもメモっておく。  
pythonで使うだけなら、`` pip install opencv-python``すればopenCV使えるのでそれでも大丈夫。  
その場合は、ここはスキップしても大丈夫。  
openVINOをBuildしたDockerコンテナで引き続き作業を行う

## 準備
足りないライブラリ類をインストールしておく。  
```bash
apt install -y libgtk-3-dev:arm64
apt install -y libjpeg-dev:arm64
apt install -y libpng-dev:arm64
apt install -y libwebp-dev:arm64
apt install -y libtiff-dev:arm64
```
## buildディレクトリの作成
```bash
mkdir -p /work/opencv/build && cd /work/opencv/build
```
## cmakeの実行

とりあえず、以下のコマンドで動くものができる。  
どっか足りないとことかあるかもしれんけど、とりあえず動作確認した範囲では動いてる。  

```bash
export PKG_CONFIG_LIBDIR=/usr/lib/aarch64-linux-gnu/pkgconfig:/usr/share/pkgconfig

cmake   -D CMAKE_BUILD_TYPE=RELEASE \
        -D OPENCV_ENABLE_PKG_CONFIG=ON \
        -D CMAKE_FIND_ROOT_PATH=/ \
        -D CMAKE_INSTALL_PREFIX=/work/opt/intel/openvino/opencv \
        -D CMAKE_TOOLCHAIN_FILE=/work/opencv/platforms/linux/aarch64-gnu.toolchain.cmake \
        -D CPU_BASELINE=NEON \
        -D ENABLE_NEON=ON \
        -D PYTHON_EXECUTABLE=/usr/bin/python3.9 \
        -D PYTHON_LIBRARY=/usr/lib/aarch64-linux-gnu/libpython3.9.so \
        -D PYTHON_INCLUDE_DIR=/usr/include/python3.9 \
        -D PYTHON3_NUMPY_INCLUDE_DIRS=/usr/lib/python3/dist-packages/numpy/core/include \
        -D WITH_OPENCL=OFF \
        -D BUILD_TESTS=OFF \
        -D BUILD_opencv_python2=OFF \
        -D BUILD_opencv_python3=ON \
        -D OPENCV_PYTHON_INSTALL_PATH=../python/python3 \
        -D PYTHON3_LIMITED_API=ON \
       .. 2>&1 | tee cmake.log
```

>[!NOTE]
> あらかじめ環境変数``PKG_CONFIG_LIBDIR``を設定して``pkg-config``でaarch64のライブラリとNativeのツール類を参照するように設定しておく。  
> これをやらないと、libjpegとかをインストールしてあることを検出できない


>[!NOTE]
> cmakeのオプションに ``-D CMAKE_FIND_DEBUG_MODE=1``を追加すると
> cmake中の``find_xxx``の動作のログが出力されるので、パッケージのサーチなどの検索パスの確認などが容易になる。  


## make
```bash
make --jobs=$(nproc --all) 2>&1 | tee build.log
```

## install
```bash
make install 2>&1 | tee install.log
```
これを実行すると。
``/work/opt/intel/openvino/opencv`` にインストールされる。
これが実際の環境の``/opt/intel/openvino/opencv`` に相当する。  
インストール先を変更したい場合は``cmake``の
オプションの``-D CMAKE_INSTALL_PREFIX=/work/opt/intel/openvino/opencv``の部分を変更すれば良いけど、ここはopenVINOのインストール先と合わせておかないとうまく動かない。  


# 実機へのインストール

``opt``ディレクトリ以下を丸ごとアーカイブする。  
```bash
cd /work
tar czvf openvino.tar.gz opt
```

作成した``openvino.tar.gz``をRaspberryPiの適当なディレクトリに展開する。  
``/``に展開すれば``/opt/intel/openvino/～``となって一般的なインストールと同様となる。  
どこに展開しても環境変数設定スクリプト``opt/intel/openvino/bin/setupvars.sh``を実行すれば、  
その位置を基準にベースディレクトリを設定してくれる。  

# コンテナから出る
Dockerコンテナは作業終了したら終了しておく。  
CTRL-D でshell終了  


# 補足
コンテナにインストールされているパッケージは以下の通り。  
バージョン違いで動かなくなることもあるかもしれんので、念のため。  

こんな感じで確認できる。  
```bash
apt list --installed | grep -v automatic
```

で、こんな感じ。  
```
build-essential/stable,now 12.9 amd64 [installed]
cmake/stable,now 3.18.4-2+deb11u1 amd64 [installed]
crossbuild-essential-arm64/stable,stable,now 12.9 all [installed]
cython3/stable,now 0.29.21-3+b1 amd64 [installed]
git/stable,now 1:2.30.2-1 amd64 [installed]
libavcodec-dev/stable,stable-security,now 7:4.3.3-0+deb11u1 arm64 [installed]
libavformat-dev/stable,stable-security,now 7:4.3.3-0+deb11u1 arm64 [installed]
libgstreamer-plugins-base1.0-dev/stable,now 1.18.4-2 arm64 [installed]
libgstreamer1.0-dev/stable,now 1.18.4-2.1 arm64 [installed]
libgtk-3-dev/stable,now 3.24.24-4 arm64 [installed]
libjpeg-dev/stable,now 1:2.0.6-4 arm64 [installed]
libpng-dev/stable,now 1.6.37-3 arm64 [installed]
libprotobuf-dev/stable,now 3.12.4-1 arm64 [installed]
libprotoc-dev/stable,now 3.12.4-1 arm64 [installed]
libpython3-dev/stable,now 3.9.2-3 arm64 [installed]
libswscale-dev/stable,stable-security,now 7:4.3.3-0+deb11u1 arm64 [installed]
libtiff-dev/stable,now 4.2.0-1 arm64 [installed]
libusb-1.0-0-dev/stable,now 2:1.0.24-3 arm64 [installed]
libwebp-dev/stable,now 0.6.1-2.1 arm64 [installed]
protobuf-compiler/stable,now 3.12.4-1 amd64 [installed]
python3-minimal/stable,now 3.9.2-3 amd64 [installed]
python3-numpy/stable,now 1:1.19.5-1 amd64 [installed]
python3-pip/stable,stable,now 20.3.4-4 all [installed]
scons/stable,stable,now 4.0.1+dfsg-2 all [installed]
wget/stable,now 1.21-1+deb11u1 amd64 [installed]
```
