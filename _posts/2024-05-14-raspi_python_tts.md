---
title: Raspberry Pi で Text To Speech(音声合成)
date: 2024-05-14
tags: ["RaspberryPi", "python" ]
excerpt: Raspberry Pi でpythonを使用してText To Speech(音声合成)を試す
---
# 概要
Raspberry Pi でText To Speech(音声合成)をofflineで実行することを試してみます。  
(初回実行時は辞書データをダウンロードするのでインターネットにつながっている必要があります)

> [!NOTE]
> 環境変数 DISPLAY が設定されている場合、変数が示すマシンでXサーバが実行されている必要があります。  
> 実行されていない場合は、オーディオ再生の際、コマンドがハングアップします、  
> その際は対象マシンでXサーバを実行するか、``unset DISPLAY``で環境変数を削除してください。  




# スピーカの準備
Raspberry Pi5ではオーディオジャックがなくなったので、
将来のことを考えてUSBスピーカ(USBヘッドセット)を使用することにします。  

## スピーカの接続

まず、USBスピーカをUSBポートに接続し、スピーカが認識されたことを確認します。  
```bash
$ lsusb
Bus 002 Device 001: ID 1d6b:0003 Linux Foundation 3.0 root hub
Bus 001 Device 003: ID 0c76:161f JMTek, LLC. USB PnP Audio Device   ← これ
Bus 001 Device 002: ID 2109:3431 VIA Labs, Inc. Hub
Bus 001 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub
```


## カード番号とデバイス番号の確認
使用するカード番号/デバイス番号を確認します。  
```bash
$ aplay -l
**** ハードウェアデバイス PLAYBACK のリスト ****
カード 0: vc4hdmi0 [vc4-hdmi-0], デバイス 0: MAI PCM i2s-hifi-0 [MAI PCM i2s-hifi-0]
  サブデバイス: 1/1
  サブデバイス #0: subdevice #0
カード 1: vc4hdmi1 [vc4-hdmi-1], デバイス 0: MAI PCM i2s-hifi-0 [MAI PCM i2s-hifi-0]
  サブデバイス: 1/1
  サブデバイス #0: subdevice #0
カード 2: Headphones [bcm2835 Headphones], デバイス 0: bcm2835 Headphones [bcm2835 Headphones]
  サブデバイス: 8/8
  サブデバイス #0: subdevice #0
  サブデバイス #1: subdevice #1
  サブデバイス #2: subdevice #2
  サブデバイス #3: subdevice #3
  サブデバイス #4: subdevice #4
  サブデバイス #5: subdevice #5
  サブデバイス #6: subdevice #6
  サブデバイス #7: subdevice #7
カード 3: Device [USB PnP Audio Device], デバイス 0: USB Audio [USB Audio]         ← これ
  サブデバイス: 1/1
  サブデバイス #0: subdevice #0
```

カード番号が 3 または 'Device'、デバイス番号が0であることが分かります  

## テスト再生
テスト再生してみます。  
-D オプションのパラメータは、``plughw:``に続けて上で調べたカード番号、``,``を挟んでデバイス番号を指定します。  
wavファイルは何でもかまいません。下記はデフォルトでインストール済みのファイルなのでそれを使いました。  
```bash
$ aplay -D plughw:Device,0 /usr/share/sounds/alsa/Front_Center.wav
再生中 WAVE '/usr/share/sounds/alsa/Front_Center.wav' : Signed 16 bit Little Endian, レート 48000 Hz, モノラル
```

## デフォルトのオーディオデバイスの設定
``sudo raspi-config`` を実行し、以下の順で選択します。  
  - ``1 System Options``  
    - ``S2 Audio`` 
      - 使用するオーディオデバイス( ``71 USB PnP Audio Device``など )
  - ``Finish``で終了

デフォルト設定が変更されたことを確認するため、上記テスト再生のコマンドから-Dオプションを削除して再生されることを確認します。  
```bash
$ aplay /usr/share/sounds/alsa/Front_Center.wav
再生中 WAVE '/usr/share/sounds/alsa/Front_Center.wav' : Signed 16 bit Little Endian, レート 48000 Hz, モノラル
```

# python仮想環境の作成とモジュールのインストール
```bash
mkdir -p /work/openjtalk
cd /work/openjtalk

pyenv virtualenv 3.11.9 openjtalk
pyenv local openjtalk 
pip install --upgrade pip setuptools wheel

# pyopenjtalkのインストールに必要なのでcmakeをインストール
sudo apt install cmake

# pyopenjtalkのインストールbuildが実行されるので時間がかかる
pip install pyopenjtalk

# wavファイルの保存に使用するのでscipyもインストール
pip install scipy

# marineを使う場合は以下も実行
pip install pyopenjtalk[marine]
```

# pyopenjtalk を実行してみる

以下のプログラムを作成します。  
{% include filename.html filename="talk_test1.py" %}
```python
import pyopenjtalk
from scipy.io import wavfile
import numpy as np

# marineを使用する場合はrun_marineをTrueにする
x, sr = pyopenjtalk.tts("おめでとうございます", run_marine=False)
wavfile.write("test1.wav", sr, x.astype(np.int16))
```

実行します。  
```bash
python talk_test1.py
```

再生します。  
```
aplay test1.wav
```

スピーカーから「おめでとうございます」と聞こえたら成功です。おめでとうございます。  



# pythonからオーディオ再生する

オーディオ再生のためのモジュールは色々ありますが、
下の直接再生に使用するにはnumpyデータを入力できることが必須となるので
simpleaudioを使用してみます。  


モジュールをインストールします。  
```bash
# simpleaudioのインストールに必要なパッケージのインストール
sudo apt install libasound2-dev

# インストール
pip install simpleaudio
```

以下のプログラムを作成します。  
{% include filename.html filename="play_test1.py" %}
```python
import simpleaudio

wav_obj = simpleaudio.WaveObject.from_wave_file("test1.wav")
play_obj = wav_obj.play()
play_obj.wait_done()
```


実行します。  
```bash
python play_test1.py
```
# pyopenjtalkで作成した音声を直接再生する

逐一wavファイルを作成するのは面倒なので、合成したらすぐ再生するようにしてみます。  



以下のプログラムを作成します。  
{% include filename.html filename="talk_test2.py" %}
```python
import pyopenjtalk
import numpy as np

import simpleaudio

# marineを使用する場合はrun_marineをTrueにする
x, sr = pyopenjtalk.tts("直接再生します", run_marine=False)
# x : waveform
# sr: sampling rate

wav_obj = simpleaudio.WaveObject(x.astype(np.int16), num_channels=1, bytes_per_sample=2, sample_rate=sr)
play_obj = wav_obj.play()
play_obj.wait_done()
```


実行します。  
```bash
python talk_test2.py
```



