---
title: openVINO(Raspberry Pi向け)のbuild
date: 2021-10-28
tags: ["RaspberryPi", "openVINO", "Docker", "Windows", "Ubuntu"]
excerpt: Raspberry Pi向けopenVINOのbuild(特にCPU extension)
---

# 概要
Raspberry Pi用 openVINO は デフォルト状態ではCPUで実行できない(NCS2必須)。  
そこで、オープンソース版openVINOを使用してCPU extensionを作成してみる。  
とはいえ、CPU extension だけサクっと作成できなくて、openVINO全体を作成するハメに...  

Raspberry Pi 実機でbuildすると、ディスク容量がバカにならないし、  
あまり実環境を弄りたくなかったので、  
Ubuntuマシン上のDockerコンテナで実行する方法を試してみる(Docker Desktop for Windowsでもできると思う)  

# ARM版Dockerコンテナを使用したセルフコンパイル

Dockerコンテナ全体をQEMU上でARMエミュレーションしてくれるので、特に難しいことを考えずに  
ネイティブ環境と変わりなくあつかえる。  
でも、かなり遅い(実機よりちょっと速い？同じくらい？)。  
試した環境では、x86_64な環境でクロスコンパイルした場合の15倍くらいかかった。    
(M1 Mac上でACVMを使うとかなり早いという噂も...M1 Mac持ってない😢  [参考](https://qiita.com/kose3/items/af9edc9c40c9ae8fc5c3){:target="_blank"}  )



## 準備  
Dockerのインストールは[こちら]({{ site.baseurl }}/2021/10/08/Docker_install.html){:target="_blank"}を参照。  

### qemuのインストール  
ARMのバイナリを実行するため、QEMUをインストールしておく。  

```bash
sudo apt update
sudo apt install qemu-user-static 
```

>[!NOTE]
> QEMUの情報： <https://github.com/multiarch/qemu-user-static>{:target="_blank"}   

### 作業用ディレクトリの準備

適当なディレクトリを作成して移動。
```bash
mkdir -p /work/docker_work/ov_pi_emu && cd /work/docker_work/ov_pi_emu
```

### openVINO の gitリポジトリを clone
openvino と openvino_contrib のリポジトリをcloneする。  
必ず同じディレクトリに(後の指定がめんどくさくなるので)。  

```bash
mkdir work
git -C ./work                  clone  -b 2021.4.1 --depth 1 https://github.com/openvinotoolkit/openvino.git 
git -C ./work/openvino         submodule update --init --recursive
git -C ./work                  clone  -b 2021.4 --depth 1 https://github.com/openvinotoolkit/openvino_contrib.git
git -C ./work/openvino_contrib submodule update --init --recursive
```

>[!NOTE]
> Dockerコンテナ内から実行してもいいけど、ホストで実行した方が早いので。


### Dockerfileを作成
以下の内容でDockerfileを作成する。  

{% include filename.html filename="Dockerfile" %}
```dockerfile
FROM arm32v7/debian:buster

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
    python-minimal \
    python3-numpy cython3 scons

RUN git config --global user.name "«名前»" && \
    git config --global user.email "«メールアドレス»"

WORKDIR /work
```

>[!TIP]
> numpyをpip3でインストールするとハンパない時間がかかるので、aptで入れる。  
> その他もパッケージが存在して、特に問題がなければaptで入れるのが良いと思う。  

>[!TIP]
> git config ～ を設定してないと、cmake中にgit cloneが失敗する  

### patchファイルを作成

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

### 上記のpatchをあてる
```bash
(cd ./work/openvino_contrib/modules/arm_plugin/thirdparty/ComputeLibrary; patch -p1 < ../../../../../../patch2.patch)
```

>[!NOTE]
> gitコマンドでもpatchをあてられる。  
> ```bash
> git -C ./work/openvino_contrib/modules/arm_plugin/thirdparty/ComputeLibrary apply  ../../../../../../patch2.patch
> ```



## Dockerイメージ作成
DockerfileからDockerイメージを作成する。  
以下ではイメージ名に ``ov_pi_emu`` を使用。  

```bash
docker image build -t ov_pi_emu .
```

## Dockerコンテナ作成
DockerイメージからDockerコンテナを作成する。  
以下ではコンテナ名に ``ov_pi_emu_1`` を使用。  

```bash
docker create -it -v $PWD/work:/work --name ov_pi_emu_1 ov_pi_emu /bin/bash
```
>[!TIP]
> Windowsでは``$PWD``の代わりに``%CD%``を使用


>[!NOTE]
> ``WARNING: The requested image's platform (linux/arm/v7) does not match the detected host platform (linux/amd64) and no specific platform was requested``  
> と言われるけど大丈夫  

## Dockerコンテナ起動
Dockerコンテナを起動する。  

```bash
docker start -ia ov_pi_emu_1
```

>[!TIP]
> Dockerコンテナに別コンソールから入るにはこれ
> 
> ```bash
> docker exec -it ov_pi_emu_1 /bin/bash
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
      -DPYTHON_EXECUTABLE=/usr/bin/python3.7 \
      -DPYTHON_LIBRARY=/usr/lib/arm-linux-gnueabihf/libpython3.7m.so \
      -DPYTHON_INCLUDE_DIR=/usr/include/python3.7 \
      -DIE_EXTRA_MODULES=../../openvino_contrib/modules \
      -DBUILD_java_api=OFF \
      .. 2>&1 | tee cmake.log
```
>[!NOTE]
> 以下のオプションを追加すると少しは速くなるかと思ったが、あまり変わらない。  
> - ``-DENABLE_OPENCV=OFF``
> - ``-DENABLE_SAMPLES=OFF``



### make
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

インテルリリース物との差は以下の通り。  
- ``./documentation`` がない
    - ドキュメントだけなので問題なし
- ``./inference_engine`` がない
    - 実体は ``deployment_tools/inference_engine`` なので、シンボリックリンクを作れば良い
- ``./opencv`` がない
    - ``/work/openvino/inference-engine/temp/opencv_4.5.2_debian9arm/opencv/``からコピーすれば良い
- ``./licensing`` がない
    - ライセンス情報なので影響なし
- ``./python/python3`` がない
    - opencvのpythonモジュールがない  
        - どこから持ってくれば良いんだろう？

### コンテナから出る
CTRL-D でshell終了


### 実機へのインストール
CPU extensionだけなら  
`` work/openvino/bin/armv7l/Release/lib/libarmPlugin.so``  
を Raspberry Pi の   
``/opt/intel/openvino_2021/inference_engine/lib/armv7l/``  
へコピーするだけで良い。  

>[!NOTE]
> これはmake install してもこれはコピーされないらしい。    

openVINO全体のインストールなら``work/opt/intel/openvino``  
を Raspberry Pi の   
``/opt/intel/``にコピーすれば良いのだけど、opencvのpythonインタフェースがないので注意。  
ということで、実際に試していない...  


>[!NOTE]
> ※※※※ メモ ※※※※   
> openCVはここでbuildするのではなく、  
> <https://download.01.org/opencv/master/openvinotoolkit/thirdparty/linux/opencv/>{:target="_blank"} 
> からbuild済みモジュールをダウンロードして  
> ``/work/openvino/inference-engine/temp/opencv_4.5.2_debian9arm/``  
> に展開している。  


# i386版(32bit x86)Dockerコンテナを使用したクロスコンパイル
## 概要
セルフコンパイルは時間がかかりすぎるので、クロスコンパイルで試してみた。  
かなり早くなったが、一部使えないモジュールが...  
当初の目的のCPU extensionは使えるので、掲載しとく。  


>[!NOTE]
> 当初、64bit版debianをベースに作業しようとしたが、
> pybind11のbuildで以下のように怒られる。
> ```
> Make Error at build/_deps/pybind11-src/tools/FindPythonLibsNew.cmake:127 (message):
>   Python config failure: Python is 64-bit, chosen compiler is 32-bit
> Call Stack (most recent call first):
>   build/_deps/pybind11-src/tools/pybind11Tools.cmake:16 (find_package)
>   build/_deps/pybind11-src/CMakeLists.txt:33 (include)
> ```
> 以下のような対策が考えられる。
> - FindPythonLibsNew.cmakeにbit数チェックをしないようにパッチを当てる
>     - やり方がよう分からん...
> - amd64なdebianに32bitのpythonをインストールする
>     - イマイチうまくインストールできなかった
> 
> しかたないので、32bit版debianで作ることにした

## 準備  

### 作業用ディレクトリの準備

適当なディレクトリを作成して移動。  
```bash
mkdir -p /work/docker_work/ov_pi_buster_32 && cd /work/docker_work/ov_pi_buster_32
```
### openVINO の gitリポジトリを clone
openvino と openvino_contrib のリポジトリをcloneする。  
必ず同じディレクトリに(後の指定がめんどくさくなるので)。  

```bash
mkdir work
git -C ./work                  clone  -b 2021.4.1 --depth 1 https://github.com/openvinotoolkit/openvino.git 
git -C ./work/openvino         submodule update --init --recursive
git -C ./work                  clone  -b 2021.4 --depth 1 https://github.com/openvinotoolkit/openvino_contrib.git
git -C ./work/openvino_contrib submodule update --init --recursive
```

### Dockerfileを作成

{% include filename.html filename="Dockerfile" %}
```dockerfile
FROM i386/debian:buster

USER root

RUN dpkg --add-architecture armhf && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    crossbuild-essential-armhf \
    git \
    wget \
    libusb-1.0-0-dev:armhf \
    libgtk-3-dev:armhf \
    libavcodec-dev:armhf \
    libavformat-dev:armhf \
    libswscale-dev:armhf \
    libgstreamer1.0-dev:armhf \
    libgstreamer-plugins-base1.0-dev:armhf \
    libpython3-dev:armhf \
    libprotobuf-dev libprotoc-dev protobuf-compiler \
    cmake \
    python3-pip \
    python-minimal \
    python-argparse \
    python3-numpy cython3 scons

# aptでインストールするので削除
# RUN wget https://github.com/Kitware/CMake/releases/download/v3.21.3/cmake-3.21.3.tar.gz && \
#     tar xzvf cmake-3.21.3.tar.gz && \
#     (cd cmake-3.21.3 && ./bootstrap --parallel=$(nproc --all) -- -DCMAKE_USE_OPENSSL=OFF && make --jobs=$(nproc --all) && make install) && \
#     rm -rf cmake-3.21.3 cmake-3.21.3.tar.gz

RUN git config --global user.name "«名前»" && \
    git config --global user.email "«メールアドレス»"

WORKDIR /work
```

### patchファイルを作成

以下の2つのpatchファイルを作成する。  

{% include filename.html filename="patch1.patch" %}
```diff
diff --git a/cmake/dependencies.cmake b/cmake/dependencies.cmake
index 6cb15a0..66a1ef6 100644
--- a/cmake/dependencies.cmake
+++ b/cmake/dependencies.cmake
@@ -19,8 +19,9 @@ if(CMAKE_CROSSCOMPILING AND CMAKE_HOST_SYSTEM_NAME MATCHES Linux AND CMAKE_HOST_
     find_program(
         SYSTEM_PROTOC
         NAMES protoc
-        PATHS "${SYSTEM_PROTOC_ROOT}/bin"
-        NO_DEFAULT_PATH)
+        # PATHS "${SYSTEM_PROTOC_ROOT}/bin"
+        # NO_DEFAULT_PATH)
+        )
     if(NOT SYSTEM_PROTOC)
         message(FATAL_ERROR "[ONNX IMPORTER] Missing host protoc binary")
     endif()
```

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



### 上記のpatchをあてる
```bash
(cd ./work/openvino; patch -p1 < ../../patch1.patch)
(cd ./work/openvino_contrib/modules/arm_plugin/thirdparty/ComputeLibrary; patch -p1 < ../../../../../../patch2.patch)
```

>[!NOTE]
> gitコマンドでもpatchをあてられる。  
> ```bash
> git -C ./work/openvino apply ../../patch1.patch
> git -C ./work/openvino_contrib/modules/arm_plugin/thirdparty/ComputeLibrary apply  ../../../../../../patch2.patch
> ```


## Dockerイメージ作成
DockerfileからDockerイメージを作成する。  
以下ではイメージ名に ``ov_pi_buster_32`` を使用。  

```bash
docker image build -t ov_pi_buster_32 .
```

## Dockerコンテナ作成
DockerイメージからDockerコンテナを作成する。  
以下ではコンテナ名に ``ov_pi_buster_32_1`` を使用。  
```bash
docker create -it -v $PWD/work:/work --name ov_pi_buster_32_1 ov_pi_buster_32 /bin/bash
```
>[!NOTE]
> ``WARNING: The requested image's platform (linux/386) does not match the detected host platform (linux/amd64) and no specific platform was requested``  
> と言われるけど大丈夫  

>[!TIP]
> Windowsでは``$PWD``の代わりに``%CD%``を使用

## Dockerコンテナ起動
Dockerコンテナを起動する。  
```bash
docker start -ia ov_pi_buster_32_1
```

>[!TIP]
> Dockerコンテナに別コンソールから入るにはこれ
> ```bash
> docker exec -it ov_pi_buster_32_1 /bin/bash
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
      -DCMAKE_TOOLCHAIN_FILE="../cmake/arm.toolchain.cmake" \
      -DCMAKE_C_FLAGS="-pthread" \
      -DCMAKE_CXX_FLAGS="-pthread" \
      -DENABLE_PYTHON=ON \
      -DPYTHON_EXECUTABLE=/usr/bin/python3.7 \
      -DPYTHON_LIBRARY=/usr/lib/arm-linux-gnueabihf/libpython3.7m.so \
      -DPYTHON_INCLUDE_DIR=/usr/include/python3.7 \
      -DIE_EXTRA_MODULES=../../openvino_contrib/modules \
      -DBUILD_java_api=OFF \
      .. 2>&1 | tee cmake.log
```

### make
```bash
make --jobs=$(nproc --all) 2>&1 | tee build.log
```

### install
```bash
make install 2>&1 | tee install.log
```

コンテナから出て、  
``work/openvino/bin/armv7l/Release/lib/libarmPlugin.so``  
を Raspberry Pi の 
``/opt/intel/openvino_2021/inference_engine/lib/armv7l``/  
へコピーする  

> [!WARNING]
> cythonの出力がx86のコードを吐くので、pythonモジュールの一部に正常に動作しないものがある。  
> pythonモジュールを使いたいときはセルフコンパイルするしかないかな？  

