---
title: openVINO(Raspberry Pi OS(64bit)向け)のbuild
date: 2022-03-07
tags: ["RaspberryPi", "openVINO", "Docker", "Windows", "Ubuntu"]
excerpt: Raspberry Pi OS(64bit)向けopenVINOのbuild
---

# 概要
aspberry Pi OS(64bit)がリリースされたが、openVINOのBuild済みモジュールはまだこれに対応していない。  
そのうち対応されると思うけど、とりあえず自前でBuildする方法を調べてみた。  
ついでにCPU Extensionも作成しておく。  
なお、Raspberry Pi OS(32bit Buster)向けのBuild手順については、
『[openVINO(Raspberry Pi向け)のbuild]({{ site.baseurl }}/2021/10/28/openVINO_build.html){:target="_blank"}』を参照。  

今回はUbuntu上のDockerコンテナを使用したが、おそらくWindowsのDocker Desktop for Windowsでも出来ると思う。

今回もARM版Dockerコンテナを使用してセルフコンパイルする方法で行う。  
手順そのものは特殊なことはないので、Raspberry Pi上のNative環境でもBuildできそうだけど、
ディスク容量とかスワップ領域とか気にしないといけないかもしれないので試してない。  
(今回はクロスコンパイル環境はなし。cythonの出力モジュールも使いたかったので)  


# 準備  
Dockerのインストールは[こちら]({{ site.baseurl }}/2021/10/08/Docker_install.html){:target="_blank"}を参照。  

## qemuのインストール  
ARMのバイナリを実行するため、QEMUをインストールしておく。  

```bash
sudo apt update
sudo apt install qemu-user-static 
```

>[!NOTE]
> QEMUの情報： <https://github.com/multiarch/qemu-user-static>{:target="_blank"}   

## 作業用ディレクトリの準備

適当なディレクトリを作成して移動。
```bash
mkdir -p /work/docker_work/ov_pi64_emu && cd /work/docker_work/ov_pi64_emu
```

# openVINOのBuild

## openVINO の gitリポジトリを clone
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
> Dockerコンテナ内から実行してもいいけど、ホストで実行した方が早いので。

>[!NOTE]
> ``git submodule`` にも ``--depth 1``をつけると早いし、ディスクの節約にもなる。  

## patchファイルを作成＆適用

以下の1つのpatchファイルを作成する。  

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


## Dockerコンテナの作成＆起動

### Dockerfileを作成
以下の内容でDockerfileを作成する。  

{% include filename.html filename="Dockerfile" %}
```dockerfile
FROM arm64v8/debian:bullseye

USER root

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    git \
    wget \
    libusb-1.0-0-dev \
    libgtk-3-dev \
    libavcodec-dev \
    libavformat-dev \
    libswscale-dev \
    libgstreamer1.0-dev \
    libgstreamer-plugins-base1.0-dev \
    libpython3-dev \
    libprotobuf-dev libprotoc-dev protobuf-compiler \
    cmake \
    python3-pip \
    python3-minimal \
    python3-numpy cython3 scons

RUN git config --global user.name "«ユーザ名»" && \
    git config --global user.email "«メールアドレス»"

WORKDIR /work
```

>[!TIP]
> numpyをpip3でインストールするとハンパない時間がかかるので、aptで入れる。  
> その他もパッケージが存在して、特に問題がなければaptで入れるのが良いと思う。  

>[!TIP]
> git config ～ を設定してないと、cmake中にgit cloneが失敗する  

>[!NOTE]
> 32bit版との差分はこんな感じ。  
> あれ？32bit版の``python-minimal``って間違ってる?  
> ``python3-numpy``で依存モジュールとしてインストールされて事なきを得たのか?  
> 実質、ベースイメージを変更してるだけだな。  
> 
> ```patch
> --- Dockerfile.old	2022-03-01 07:26:28.774187231 +0900
> +++ Dockerfile	2022-03-01 07:19:45.668393598 +0900
> @@ -1,4 +1,4 @@
> -FROM arm32v7/debian:buster
> +FROM arm64v8/debian:bullseye
>  
>  USER root
>  
> @@ -18,7 +18,7 @@
>      libprotobuf-dev libprotoc-dev protobuf-compiler \
>      cmake \
>      python3-pip \
> -    python-minimal \
> +    python3-minimal \
>      python3-numpy cython3 scons
>  
> ```



### Dockerイメージ作成
DockerfileからDockerイメージを作成する。  
以下ではイメージ名に ``ov_pi64_emu`` を使用。  

```bash
docker image build -t ov_pi64_emu .
```

### Dockerコンテナ作成
DockerイメージからDockerコンテナを作成する。  
以下ではコンテナ名に ``ov_pi64_emu_1`` を使用。  

```bash
docker create -it -v $PWD/work:/work --name ov_pi64_emu_1 ov_pi64_emu /bin/bash
```
>[!TIP]
> Windowsでは``$PWD``の代わりに``%CD%``を使用


>[!NOTE]
> ``WARNING: The requested image's platform (linux/arm/v7) does not match the detected host platform (linux/amd64) and no specific platform was requested``  
> と言われるけど大丈夫  

### Dockerコンテナ起動
Dockerコンテナを起動する。  

```bash
docker start -ia ov_pi64_emu_1
```

>[!TIP]
> Dockerコンテナに別コンソールから入るにはこれ
> 
> ```bash
> docker exec -it ov_pi64_emu_1 /bin/bash
> ```

## 本番
ここからコンテナ内

### buildディレクトリの作成
```bash
cd /work/openvino/
mkdir build && cd build
```

### cmake実行
```bash
cmake -DCMAKE_BUILD_TYPE=Release \
      -DCMAKE_INSTALL_PREFIX=/work/opt/intel/openvino \
      -DCMAKE_C_FLAGS="-pthread" \
      -DCMAKE_CXX_FLAGS="-pthread" \
      -DENABLE_PYTHON=ON \
      -DPYTHON_EXECUTABLE=/usr/bin/python3.9 \
      -DPYTHON_LIBRARY=/usr/lib/aarch64-linux-gnu/libpython3.9.so \
      -DPYTHON_INCLUDE_DIR=/usr/include/python3.9 \
      -DIE_EXTRA_MODULES=../../openvino_contrib/modules \
      -DBUILD_java_api=OFF \
      .. 2>&1 | tee cmake.log
```

### make
数時間レベルでかかるので、のんびり待ちましょう。  

```bash
make --jobs=$(nproc --all) 2>&1 | tee build.log
```

### install
```bash
make install 2>&1 | tee install.log
```
これを実行すると。
``/work/opt/intel/openvino`` にインストールされる。
これが実際の環境の``/opt/intel/openvino`` に相当する。  
インストール先を変更したい場合は``cmake``の
オプションの``-DCMAKE_INSTALL_PREFIX=/work/opt/intel/openvino``の部分を変更すれば良いけど、
どうせアーカイブしてコピーして使うからあんまり関係ないとおもう。  


### その他細々したところ

```bash
# CPU extension のコピー
cp /work/openvino/bin/aarch64/Release/lib/libarmPlugin.so /work/opt/intel/openvino/deployment_tools/inference_engine/lib/aarch64/

# シンボリックリンクの作成
ln -s -r /work/opt/intel/openvino/deployment_tools/inference_engine /work/opt/intel/openvino/

cd /work
tar czvf openvino.tar.gz opt
```

### コメント
インテルリリース物との差は以下の通り。  
- ``./documentation`` がない
    - ドキュメントだけなので問題なし
- ``./opencv`` がない
    - 下のopenCVのBuild方法を参照。  
    - pythonで使うだけなら、`` pip install opencv-python``すればopenCV使えるのでそれでも大丈夫。  
- ``./licensing`` がない
    - ライセンス情報なので影響なし
- ``./python/python3`` がない
    - 下のopenCVのBuild方法を参照。  
    - pythonで使うだけなら、`` pip install opencv-python``すればopenCV使えるのでそれでも大丈夫。  

### コンテナから出る
CTRL-D でshell終了


## 実機へのインストール

最終的に作成した``openvino.tar.gz``を適当なディレクトリに展開する。  
``/``に展開すれば``/opt/intel/openvino/～``となって一般的なインストールと同様となる。  
どこに展開しても環境変数設定スクリプト``opt/intel/openvino/bin/setupvars.sh``を実行すれば、  
その位置を基準にベースディレクトリを設定してくれる。  


# openCVのBuild
## 概要
ついでにopenCVのBuild方法についてもメモっておく。  

## 準備
openCVのリポジトリをcloneしておく。  
指定するタグは適宜変更してください。  
今回はcontribはBuildしないのでcloneしない。  

```bash
git -C ./work clone  -b 4.5.3-openvino-2021.4.2 --depth 1 https://github.com/opencv/opencv
```

## Dockerコンテナの作成＆起動
新しいDockerコンテナ作っても良いけど、別にその必要もないので上記のコンテナをそのまま使用する。  


### Dockerコンテナ起動
Dockerコンテナを起動する。  

```bash
docker start -ia ov_pi64_emu_1
```

>[!TIP]
> Dockerコンテナに別コンソールから入るにはこれ
> 
> ```bash
> docker exec -it ov_pi64_emu_1 /bin/bash
> ```
## 本番

### 準備
足りないライブラリ類をインストールしておく。  
```bash
apt install -y libgtk2.0-dev  libjpeg-dev libpng-dev
apt install -y libwebp-dev
apt install -y libtiff-dev
```

### Build

とりあえず、以下のコマンドで動くものができる。  
どっか足りないとことかあるかもしれんけど、とりあえず動作確認した範囲では動いてる。  

```bash
mkdir -p /work/opencv/build && cd /work/opencv/build

cmake   -D CMAKE_BUILD_TYPE=RELEASE \
        -D CMAKE_INSTALL_PREFIX=/work/opt/intel/openvino/opencv \
        -D CPU_BASELINE=NEON \
        -D ENABLE_NEON=ON \
        -D WITH_OPENCL=OFF \
        -D BUILD_TESTS=OFF \
        -D BUILD_opencv_python2=OFF \
        -D BUILD_opencv_python3=ON \
        -D OPENCV_PYTHON_INSTALL_PATH=../python/python3 \
        -D PYTHON3_LIMITED_API=ON \
      .. 2>&1 | tee cmake.log

make --jobs=$(nproc --all) 2>&1 | tee build.log

# インストール
make install 2>&1 | tee install.log

cd /work
tar czvf opencv.tar.gz opt
```


### コンテナから出る
CTRL-D でshell終了


## 実機へのインストール
openVINOをBuildしたコンテナで続けてBuildした場合は`` opencv.tar.gz``にopenVINO、openCVがインストールされている。  
これを適当なディレクトリに展開して環境変数設定スクリプト``opt/intel/openvino/bin/setupvars.sh``を実行すれば良い。  

別のコンテナを使用したり、openVINOのBuild結果を削除していた場合は、  
最終的に作成した``opencv.tar.gz``をopenVINOをインストールしたディレクトリに展開する。  


