---
title: openVINO でtinyYOLO(C++版)
date: 2019-10-31
tags: ["DeepLearning", "openVINO", "ubuntu", "RaspberryPi"]
excerpt: tinyYOLOのC++版デモプログラムのbuildと実行
---

[openVINO でtinyYOLO]({{ site.baseurl }}/2019/10/30/openVINO_YOLO.html) 
のpythonで実行したデモプログラムのC++版をbuild＆実行してみる。

# ubuntu環境での実行

以下は 
[openVINO フルパッケージをubuntuにインストール]({{ site.baseurl }}/2019/10/17/openVINO_ubuntu.html) 
にしたがって、openVINO フルパッケージ(2019 R3.1) をインストールしたubuntuでの作業。

## デモのソースプログラム

ドライバのインストール先 ``/opt/intel/openvino/deployment_tools/open_model_zoo/demos`` にあるので、そのまま参照しても良いが、
ソース修正に備えて、ソースをコピっておく(オーナーも変更)と何かと便利。  

```bash
mkdir -p /work/NCS2/c++/openvino_demo && cd /work/NCS2/c++/openvino_demo
cp -r /opt/intel/openvino/deployment_tools/open_model_zoo/demos .
sudo chown -R `whoami`:`whoami` demos/
```

## ソース修正

コピったソースそのままでも大丈夫だが、ちょっと修正しておく。

- 出力文字列のサイズと位置を調整
- -saveオプションの追加と認識結果画像ファイルの保存処理の追加

```diff
--- object_detection_demo_yolov3_async.hpp.org	2019-10-31 14:39:14.757039048 +0900
+++ object_detection_demo_yolov3_async.hpp	2019-10-31 06:16:49.178945707 +0900
@@ -93,6 +93,7 @@
 /// \brief Define a flag to disable showing processed video<br>
 /// It is an optional parameter
 DEFINE_bool(no_show, false, no_show_processed_video);
+DEFINE_bool(save, false, "Optional. save image file.");
 
 /**
 * \brief This function shows a help message
@@ -115,4 +116,5 @@
     std::cout << "    -iou_t                    " << iou_thresh_output_message << std::endl;
     std::cout << "    -auto_resize              " << input_resizable_message << std::endl;
     std::cout << "    -no_show                  " << no_show_processed_video << std::endl;
+    std::cout << "    -save                     " << "Optional. save image file." << std::endl;
 }
```

```diff
--- main.cpp.org	2019-10-31 05:46:38.515000000 +0900
+++ main.cpp	2019-10-31 14:23:11.411692408 +0900
@@ -197,6 +197,21 @@
         }
         // -----------------------------------------------------------------------------------------------------
 
+        // =====================================================================================
+        // 動画ファイルを書き出すためのオブジェクトを宣言する
+        cv::VideoWriter writer;
+        // =====================================================================================
+        // =====================================================================================
+        if (FLAGS_save) {
+            double fps    = cap.get(cv::CAP_PROP_FPS);				// フレームレートを取得
+            int fourcc = cv::VideoWriter::fourcc('m', 'p', '4', 'v');		// MP4形式を指定
+            // * エンコード形式 "XVID" = AVI, "MP4V" = MPEG4, "WMV1" = WMV
+
+            // 動画ファイルを書き出すためのファイルをオープンする
+            writer.open("result.mp4", fourcc, fps, cv::Size(width, height));
+        }
+        // =====================================================================================
+
         // --------------------------- 1. Load inference engine -------------------------------------
         slog::info << "Loading Inference Engine" << slog::endl;
         Core ie;
@@ -356,17 +371,17 @@
                 std::ostringstream out;
                 out << "OpenCV cap/render time: " << std::fixed << std::setprecision(2)
                     << (ocv_decode_time + ocv_render_time) << " ms";
-                cv::putText(frame, out.str(), cv::Point2f(0, 25), cv::FONT_HERSHEY_TRIPLEX, 0.6, cv::Scalar(0, 255, 0));
+                cv::putText(frame, out.str(), cv::Point2f(0, 15), cv::FONT_HERSHEY_TRIPLEX, 0.4, cv::Scalar(0, 255, 0));
                 out.str("");
                 out << "Wallclock time " << (isAsyncMode ? "(TRUE ASYNC):      " : "(SYNC, press Tab): ");
                 out << std::fixed << std::setprecision(2) << wall.count() << " ms (" << 1000.f / wall.count() << " fps)";
-                cv::putText(frame, out.str(), cv::Point2f(0, 50), cv::FONT_HERSHEY_TRIPLEX, 0.6, cv::Scalar(0, 0, 255));
+                cv::putText(frame, out.str(), cv::Point2f(0, 30), cv::FONT_HERSHEY_TRIPLEX, 0.4, cv::Scalar(0, 0, 255));
                 if (!isAsyncMode) {  // In the true async mode, there is no way to measure detection time directly
                     out.str("");
                     out << "Detection time  : " << std::fixed << std::setprecision(2) << detection.count()
                         << " ms ("
                         << 1000.f / detection.count() << " fps)";
-                    cv::putText(frame, out.str(), cv::Point2f(0, 75), cv::FONT_HERSHEY_TRIPLEX, 0.6,
+                    cv::putText(frame, out.str(), cv::Point2f(0, 45), cv::FONT_HERSHEY_TRIPLEX, 0.4,
                                 cv::Scalar(255, 0, 0));
                 }
 
@@ -410,7 +425,7 @@
                         cv::putText(frame,
                                 (label < static_cast<int>(labels.size()) ?
                                         labels[label] : std::string("label #") + std::to_string(label)) + conf.str(),
-                                    cv::Point2f(static_cast<float>(object.xmin), static_cast<float>(object.ymin - 5)), cv::FONT_HERSHEY_COMPLEX_SMALL, 1,
+                                    cv::Point2f(static_cast<float>(object.xmin), static_cast<float>(object.ymin - 5)), cv::FONT_HERSHEY_COMPLEX_SMALL, 0.4,
                                     cv::Scalar(0, 0, 255));
                         cv::rectangle(frame, cv::Point2f(static_cast<float>(object.xmin), static_cast<float>(object.ymin)),
                                       cv::Point2f(static_cast<float>(object.xmax), static_cast<float>(object.ymax)), cv::Scalar(0, 0, 255));
@@ -420,6 +435,11 @@
             if (!FLAGS_no_show) {
                 cv::imshow("Detection results", frame);
             }
+            // =====================================================================================
+            if (FLAGS_save) {
+                writer << frame;
+            }
+            // =====================================================================================
 
             t1 = std::chrono::high_resolution_clock::now();
             ocv_render_time = std::chrono::duration_cast<ms>(t1 - t0).count();
@@ -457,6 +477,11 @@
         if (FLAGS_pc) {
             printPerformanceCounts(*async_infer_request_curr, std::cout, getFullDeviceName(ie, FLAGS_d));
         }
+        // =====================================================================================
+        if (FLAGS_save) {
+            writer.release();
+        }
+        // =====================================================================================
     }
     catch (const std::exception& error) {
         std::cerr << "[ ERROR ] " << error.what() << std::endl;

```

## buildディレクトリの作成とbuild

cmakeの実行とbuild  

```bash
mkdir build && cd build/
cmake -DCMAKE_BUILD_TYPE=Release ../demos/
make object_detection_demo_yolov3_async
```

ちょっと時間がかかる。   

## モデルデータ

[openVINO でtinyYOLO]({{ site.baseurl }}/2019/10/30/openVINO_YOLO.html) 
で作成したモデルデータをそのまま使用する。  
ラベルデータファイルのファイル名はモデルデータのxmlファイルの拡張子を``.labels``に変更したものに固定だが、モデルデータ作成時にコピー済み。  

## 実行

実行ファイルは``./intel64/Release/``に作成される。  

```bash
models_dir=/work/NCS2/openvino_models/FP16
./intel64/Release/object_detection_demo_yolov3_async \
-m ${models_dir}/yolo_v3_tiny.xml \
-l /opt/intel/openvino/deployment_tools/inference_engine/lib/intel64/libcpu_extension_avx2.so \
-i ../../../data/testvideo3.mp4
```

-save オプションを指定すると、認識結果の動画をresult.mp4(ファイル名は固定)に保存する。  


# RaspberryPi3B+  ＋ NCStickでデモを動かす

デモプログラムはRasspberryPiでも動作させることができる。  
ソースはRaspberryPi側にはないので、ubuntuからコピーする。  

以下は 
[Intel NCStick2用動作環境の構築]({{ site.baseurl }}/2019/09/01/NCS_1.html) 
にしたがって環境構築したRaspberryPiを使用。  

ubuntuで作成した /work/NCS2/c++/openvino_demo/demos ディレクトリと/work/NCS2/openvino_models ディレクトリをまるごとRaspberryPiにコピーする。  

## buildディレクトリの作成とbuild

```bash
cd /work/NCS2/c++/openvino_demo
mkdir build && cd build/
cmake -DCMAKE_BUILD_TYPE=Release -DCMAKE_CXX_FLAGS="-march=armv7-a -Wno-psabi" ../demos/
make object_detection_demo_yolov3_async
```

## 実行

実行ファイルは``./armv7l/Release/``に作成される。  
入力ファイル(-i オプション)はフルパスで指定すること。相対パスだとファイルが見つからないと怒られる。  
※ 下のパッチを当てると相対パスでも大丈夫になる。  

```bash
models_dir=/work/NCS2/openvino_models/FP16
./armv7l/Release/object_detection_demo_yolov3_async \
-m ${models_dir}/yolo_v3_tiny.xml \
-d MYRIAD \
-i /work/NCS2/data/testvideo3.mp4 
```

なぜか-saveオプションが効かない。。。  


## 入力ファイル名に相対パスを使用できるようにするためのパッチ

入力ファイル名をrealpath()で絶対パスに変換して使用することで対応。  

```diff
--- main.cpp.1	2019-10-31 14:23:11.411692408 +0900
+++ main.cpp	2019-11-01 11:25:29.720856218 +0900
@@ -30,6 +30,9 @@
 #include <ext_list.hpp>
 #endif
 
+#include <limits.h>
+#include <unistd.h>
+
 using namespace InferenceEngine;
 
 bool ParseAndCheckCommandLine(int argc, char *argv[]) {
@@ -180,7 +183,23 @@
 
         slog::info << "Reading input" << slog::endl;
         cv::VideoCapture cap;
-        if (!((FLAGS_i == "cam") ? cap.open(0) : cap.open(FLAGS_i.c_str()))) {
+
+        bool open_status;
+        if (FLAGS_i == "cam") {
+            open_status = cap.open(0);
+        }
+        else {
+            std::string input_filename;
+            char input_filename_char[PATH_MAX+1];
+            if (!realpath(FLAGS_i.c_str(), input_filename_char)) {
+                throw std::logic_error("Cannot get realpath");
+            }
+            input_filename = input_filename_char;
+            slog::info << "input filename :" + input_filename << slog::endl;
+            open_status = cap.open(input_filename.c_str());
+
+        }
+        if (!open_status) {
             throw std::logic_error("Cannot open input file or camera: " + FLAGS_i);
         }
```

