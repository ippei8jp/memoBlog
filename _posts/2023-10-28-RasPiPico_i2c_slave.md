---
title: Raspberry Pi Pico W(SDK) でI2C Slave
date: 2023-10-28
tags: ["RaspberryPiPICO"]
excerpt: Raspberry Pi Pico W の SDK を使用してI2C Slaveプログラムを作成する
---



# 概要
Raspberry Pi Pico のI2C マスタを使用してI2Cデバイスにアクセスするプログラムプログラムは
ネット上のあちこちに落ちているのですが、
I2Cスレーブとしてホストデバイスからアクセスされるサンプルはあまりありません。  
そこで、あちこち探してプログラム作ったのでメモを残しておきます。  

>[!NOTE]
> 【ホントのところ】  
> 「I2Cデバイスをポチったけど、納期が長くてプログラム開発に取り掛かれない～」となって
> なんちゃってI2Cデバイスを作って先行デバッグしようとしました。  

通信プログラムなので通信相手が必要ですが、今回はRaspberry Pi3上でpython3で動く
簡単な動作確認プログラムを載せておきます。  


>[!NOTE]
> 公式サンプルは``pico-examples/i2c/slave_mem_i2c``にあります。  

>[!NOTE]
> micropython版の例は[ここ](https://python-academia.com/raspberry-pi-pico-slave/){:target="_blank"}
> とかにあるけど、ちぃーっと無理くり感が...



# 準備
## I2Cの結線

以下のように結線します。  
Pico側はソース中の割り当て端子を変更すれば別の端子でもOKです。  

|Pi3         |Pico             |
| ----       | ----            |
| SDA1(pin3) | I2C0_SDA/GP16(Pin21) |
| SCL1(pin5) | I2C0_SCL/GP17(Pin22) |

## Pi3でのI2C有効化

Pi3で以下のコマンドを実行し、I2Cを有効化します。  

```bash
sudo raspi-config nonint do_i2c 0
```

>[!NOTE]
> または以下のように手動で設定 
> ```bash
> sudo raspi-config
> ```
> 
> 以下のように設定
> - 3 Interface Options
>     - I4 I2C
>         - 「Would you like the ARM I2C interface to be enabled?」  
>            に対して「はい」を選択
>         - 「The ARM I2C interface is enabled」
>           と表示されるので「了解」
>     - 「Finish」で終了
> 

実行後、``/dev/i2c-1``ファイルが存在することを確認してください。  
リブートは不要です。  

## I2Cツールのインストール

Pi3に``i2cdetect``などのツールをインストールしておきます。  

```bash
sudo apt install i2c-tools
```

# Picoのプログラム

作成したプログラムを以下に示します。  

>[!NOTE]
> 今回元にしたI2Cデバイスは先頭アドレスからのバーストリードのみサポートしていたので  
> ちょっと一般的なアドレス/データ指定の方法と違うけど、なんとなく想像はつくでしょう...

## メインルーチン

メインルーチンはI2Cを初期化したあと無限ループします。  
ループ内ではI2Cに関する処理はなく、生存確認用のLチカと
デバッグ用に送信データが更新されたときにデータを表示しているだけです。  

{% include filename.html filename="i2c_slave_test.c" %}
```c
#include <stdio.h>
#include "pico/stdlib.h"
#include "pico/cyw43_arch.h"

// プロトタイプ宣言
extern void disp_next_data(void);
extern void setup_i2c_slave(void);

int main()
{
    stdio_init_all();

    // STDIOがUSBのとき、USB認識されないことがあるのでstdio初期化の後、ちょっと待つ
    sleep_ms(3000);

    puts("\nI2C slave test");

    // LEDを使うためにwifi初期化
    if (cyw43_arch_init()) {
        printf("Wi-Fi init failed");
        return -1;
    }

    // I2Cスレーブ 初期化
    setup_i2c_slave();
    
    while (1) {
        disp_next_data();
        sleep_ms(1000);

        // ==== 生存確認用にLチカ ====
        // 現在の出力値取得
        bool led_out = cyw43_arch_gpio_get (CYW43_WL_GPIO_LED_PIN);
        // 出力反転
        cyw43_arch_gpio_put(CYW43_WL_GPIO_LED_PIN, !led_out);
    }

    return 0;
}
```

## I2C処理

### 初期化
I2Cの初期化は``setup_i2c_slave``です。  
主に端子の初期化とI2Cの初期化、
I2Cスレーブの初期化(I2C割り込みハンドラからのコールバックの登録)を行っています。  

### 処理本体
I2C処理本体は``i2c_slave_handler()``です。  

これはI2C割り込みハンドラからのコールバック処理です。  
なので、できるだけ速やかにリターンする必要があります
(printfなどの時間のかかる処理は行わないほうが良い)。  

なお、今回はマスタの通信プログラムをデバッグするためのダミーデバイスという位置づけで作ったので
通信を行うたびに異なるデータを送信するようにしてあります。
このデータの更新処理をストップ/リスタートコンディション時に行うようにしてあります。  



{% include filename.html filename="i2c_slave_test.c" %}
```c
#include <hardware/i2c.h>
#include <pico/i2c_slave.h>
#include <pico/stdlib.h>
#include <stdio.h>
#include <string.h>


// スレーブアドレス
static const uint I2C_SLAVE0_ADDRESS = 0x17;

// ボーレート
static const uint I2C_BAUDRATE = 400000; // 400 kHz

// 使用端子
static const uint I2C_SLAVE0_SDA_PIN = 16;  //GP16(Pin21)
static const uint I2C_SLAVE0_SCL_PIN = 17;  //GP17(Pin22)

// スレーブ読み出しパラメータ
static struct
{
    uint8_t mem[16];            // 読み出しデータ
    uint8_t mem_address;        // 読み出しインデックス
} context;


// 次のデータセットの表示要求フラグ
static volatile bool DISP_REQ = false;


// 次のデータセットの表示
void disp_next_data(void)
{
    if (DISP_REQ) {
        // 表示要求あり
        DISP_REQ = false;
        printf("NEXT: %02x %02x %02x %02x : %02x %02x %02x %02x : %02x %02x %02x %02x : %02x %02x %02x %02x\n", 
                context.mem[ 0], context.mem[ 1],  context.mem[ 2], context.mem[ 3],
                context.mem[ 4], context.mem[ 5],  context.mem[ 6], context.mem[ 7],
                context.mem[ 8], context.mem[ 9],  context.mem[10], context.mem[11],
                context.mem[12], context.mem[13],  context.mem[14],  context.mem[15]
            );
    }
    return;
} 

// 読み出しデータの初期化
static void init_data(void)
{
    // 送信データの初期値をセットしておく
    for (int i = 0; i < sizeof(context.mem); i++) {
        context.mem[i] = (uint8_t)i;
    }
    
    // 次に送信するデータの表示を要求
    DISP_REQ = true;
    return;
}


// 読み出しデータの更新
static void update_data(void)
{
    for (int i = 0; i < sizeof(context.mem); i++) {
        context.mem[i]++;
    }
    
    // 次に送信するデータの表示を要求
    DISP_REQ = true;
    return;
}

// I2C ISRからのコールバック
// printfなど時間のかかる処理は使うべきではない
// 例えば、表示要求フラグを立ててメインルーチン側で表示してもらうようにするなど
static void i2c_slave_handler(i2c_inst_t *i2c, i2c_slave_event_t event) {
    switch (event) {
    case I2C_SLAVE_RECEIVE: // write event
        {
            // ライト動作はサポートしないのでとりあえず読み捨てておく
            volatile uint8_t dummy = i2c_read_byte_raw(i2c);
            (void)dummy;    // ワーニング対策
        }
        break;
    case I2C_SLAVE_REQUEST: // read event
        // 1バイト送信する
        i2c_write_byte_raw(i2c, context.mem[context.mem_address]);
        // 次の転送に備えてインデックスを更新
        context.mem_address++;
        if (context.mem_address >= sizeof(context.mem)) {
            // オーバフローしたら0にもどしておく
            context.mem_address = 0;
        }
        break;
    case I2C_SLAVE_FINISH: // ストップ/リスタートコンディション時
        // リードポインタを初期化しておく
        context.mem_address = 0;
        
        // テスト用ダミーデータなので、次の読み出しに備えて値を更新しておく
        update_data();
        
        break;
    default:
        break;
    }
}

// I2Cスレーブ初期化
void setup_i2c_slave(void) {
    printf("setup i2c slave\n");

    // 端子初期化
    gpio_init(I2C_SLAVE0_SDA_PIN);
    gpio_set_function(I2C_SLAVE0_SDA_PIN, GPIO_FUNC_I2C);
    gpio_pull_up(I2C_SLAVE0_SDA_PIN);

    gpio_init(I2C_SLAVE0_SCL_PIN);
    gpio_set_function(I2C_SLAVE0_SCL_PIN, GPIO_FUNC_I2C);
    gpio_pull_up(I2C_SLAVE0_SCL_PIN);

    // 送信データの初期値をセットしておく
    init_data();

    // I2C初期化
    i2c_init(i2c0, I2C_BAUDRATE);

    // I2Cスレーブとしての初期化
    i2c_slave_init(i2c0, I2C_SLAVE0_ADDRESS, &i2c_slave_handler);
    printf("setup i2c slave  done\n");
}
```

### cmake設定ファイル

プロジェクト生成ツールで作成したプロジェクト(一般的な設定に「I2C interface」のチェックを追加)に
``target_link_libraries`` に ``pico_i2c_slave``を追加します。  
また、今回はメインルーチンとI2C処理を別ファイルに分けたので、
``add_executable`` に ``i2c_slave0.c``(追加したファイル名)を追加します。  


{% include filename.html filename="CMakeLists.txt" %}
```cmake
# Generated Cmake Pico project file

cmake_minimum_required(VERSION 3.13)

set(CMAKE_C_STANDARD 11)
set(CMAKE_CXX_STANDARD 17)

# Initialise pico_sdk from installed location
# (note this can come from environment, CMake cache etc)
set(PICO_SDK_PATH "/work/pico/pico-sdk")

set(PICO_BOARD pico_w CACHE STRING "Board type")

# Pull in Raspberry Pi Pico SDK (must be before project)
include(pico_sdk_import.cmake)

if (PICO_SDK_VERSION_STRING VERSION_LESS "1.4.0")
  message(FATAL_ERROR "Raspberry Pi Pico SDK version 1.4.0 (or later) required. Your version is ${PICO_SDK_VERSION_STRING}")
endif()

project(i2c_slave_test C CXX ASM)

# Initialise the Raspberry Pi Pico SDK
pico_sdk_init()

# Add executable. Default name is the project name, version 0.1

add_executable(i2c_slave_test i2c_slave_test.c i2c_slave0.c)

pico_set_program_name(i2c_slave_test "i2c_slave_test")
pico_set_program_version(i2c_slave_test "0.1")

pico_enable_stdio_uart(i2c_slave_test 1)
pico_enable_stdio_usb(i2c_slave_test 0)

# Add the standard library to the build
target_link_libraries(i2c_slave_test
        pico_stdlib)

# Add the standard include files to the build
target_include_directories(i2c_slave_test PRIVATE
  ${CMAKE_CURRENT_LIST_DIR}
  ${CMAKE_CURRENT_LIST_DIR}/.. # for our common lwipopts or any other standard includes, if required
)

# Add any user requested libraries
target_link_libraries(i2c_slave_test 
        pico_i2c_slave
        hardware_i2c
        pico_cyw43_arch_none
        )

pico_add_extra_outputs(i2c_slave_test)
```

あとはビルドしてRaspberry Pi Picoに書き込みます。  

# 動作確認

動作確認です。  
ここからはRaspberry Pi3 での作業です。  

## i2cdetect

``i2cdetect`` で I2Cバス上でデバイスが検出されるか確認します。

```bash
sudo i2cdetect -y 1
```

Picoのプログラムで設定したスレーブアドレス(``I2C_SLAVE0_ADDRESS``の設定値。上のプログラムだと0x17)
が表示されていればOKです。  
表示されていない場合はPicoのプログラムやボードの結線を見直してください。  


## レジスタリードプログラム
Raspberry Pi3で以下のプログラムを実行します。  
``i2c_address``の設定値は上のプログラムの``I2C_SLAVE0_ADDRESS``の設定値に合わせます。  

```python
from smbus2 import SMBus, i2c_msg

i2c_bus = 1                 # バス番号
i2c_address = 0x17          # スレーブアドレス
data_size = 16              # リードデータサイズ

# バスオープン
bus = SMBus(i2c_bus)

# データ読み出し
read = i2c_msg.read(i2c_address, data_size)
bus.i2c_rdwr(read)
data = list(read)

# データ表示
print(data)
```

正常に読み出せれば、以下のように結果が表示されます(10進数)。  
(以下は何回か実行したあとの結果です)  

```
[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
```

同時にPicoのシリアルポートからは以下のように次に読み出せるデータが表示されます(16進数)。  
```
NEXT: 06 07 08 09 : 0a 0b 0c 0d : 0e 0f 10 11 : 12 13 14 15
```





