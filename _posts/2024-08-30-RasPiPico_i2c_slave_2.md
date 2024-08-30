---
title: Raspberry Pi Pico W(SDK) でI2C Slave その2
date: 2024-08-30
tags: ["RaspberryPiPICO"]
excerpt: Raspberry Pi Pico W の SDK を使用してI2C Slaveプログラムを作成する(その2)
---



# 概要
[Raspberry Pi Pico W(SDK) でI2C Slave]({{ site.baseurl }}/2023/10/28/RasPiPico_i2c_slave.html){:target="_blank"}
でI2Cスレーブのプログラムを載せましたが、ちょっと特殊な構成のデバイスをエミュレートしていたので
一般的なレジスタアクセスをエミュレートするプログラムを作ってみました。  

>[!NOTE]
> 公式サンプル``pico-examples/i2c/slave_mem_i2c``をちょこっと修正しただけですが。  

# 準備
## I2Cの結線

以下のように結線します。  
Pico側はソース中の割り当て端子を変更すれば別の端子でもOKです。  
今回はI2C0とI2C1を使うので、両方結線します。  
pull-up抵抗はPi3についているのでここでは付けません。  

|Pi3         |Pico             |
| ----       | ----            |
| SDA1(pin3) | I2C0_SDA/GP16(Pin21) I2C1_SDA/GP18(Pin24)|
| SCL1(pin5) | I2C0_SCL/GP17(Pin22) I2C1_SCL/GP19(Pin25)|

>[!NOTE]
> 別に2ch使わなくても良いのですが、8bitアクセスと16bitアクセスを作りたかったので。  
> それぞれ別のプログラムにすると動作確認が面倒だったのでまとめちゃいました。  


その他の準備は
[Raspberry Pi Pico W(SDK) でI2C Slave]({{ site.baseurl }}/2023/10/28/RasPiPico_i2c_slave.html){:target="_blank"}
を参照してください。  

# Picoのプログラム

## プロジェクト生成
``pico_project``でプロジェクトを生成します。  

>[!NOTE]
> ``pico_project``については、
> [Raspberry Pi Pico W(SDK) を RaspberryPi3 + Visual Studio CodeでSWDデバッグ]({{ site.baseurl }}/2023/10/23/RasPiPico_3.html){:target="_blank"}
> の「自作プロジェクトの作成」を参照してください)  

設定内容は以下の通りです

- Project Name に プロジェクト名(例：i2c_slave_2ch)
- Location に プロジェクトを作成するディレクトリ
- Board Type で「pico_w」を選択
- Library Options で「I2C interface」を選択
- Pico wireless Options で「PicoW onboard LED」を選択
- Console Options では必要な方式をチェック(両方でも可)
- IDE Options で「Create VSCode Project」にチェック、「Debugger」は「SWD」を選択


## プログラムの作成
作成したプログラムを以下に示します。  

### メインルーチン

メインルーチンはI2Cを初期化したあと無限ループします。  
ループ内ではI2Cに関する処理はなく、生存確認用のLチカと
キー入力監視して入力に応じて処理を行っています。  

{% include filename.html filename="i2c_slave_2ch.c" %}
```c
#include <stdio.h>
#include "pico/stdlib.h"
#include "hardware/i2c.h"
#include "pico/cyw43_arch.h"

// プロトタイプ宣言
extern void disp_next_data(void);
extern void setup_i2c_slave0(void);
extern void disp_data_slave0(void);
extern void setup_i2c_slave1(void);
extern void disp_data_slave1(void);


// 表示フラグ
bool DISP_flag = true;


int64_t alarm_callback(alarm_id_t id, void *user_data) {
    // Put your timeout handler code in here
    return 0;
}

int main()
{
    stdio_init_all();

    // STDIOがUSBのとき、USB認識されないことがあるのでstdio初期化の後、ちょっと待つ
    sleep_ms(3000);

    puts("\nI2C slave 2ch");

    // LEDを使うためにwifi初期化
    if (cyw43_arch_init()) {
        printf("Wi-Fi init failed");
        return -1;
    }

    // I2Cスレーブ 初期化
    setup_i2c_slave0();
    setup_i2c_slave1();
    

    while (1) {
        // ==== 生存確認用にLチカ ====
        // 現在の出力値取得
        bool led_out = cyw43_arch_gpio_get (CYW43_WL_GPIO_LED_PIN);
        // 出力反転
        cyw43_arch_gpio_put(CYW43_WL_GPIO_LED_PIN, !led_out);

        // キー入力監視
        int key_in =  getchar_timeout_us(1);
        if ((key_in == 'D') || (key_in == 'd')) {
            // 表示モード反転
            DISP_flag = !DISP_flag;
            if (DISP_flag) {
                printf("**** DISP on ****\n");
            } else {
                printf("**** DISP off ****\n");
            }
        } else if (key_in == '0') {
            // slave0データ表示
            disp_data_slave0();
        } else if (key_in == '1') {
            // slave1データ表示
            disp_data_slave1();
        }


        sleep_ms(1000);
    }

    return 0;
}
```

### I2C0処理

#### 初期化
I2C0の初期化は``setup_i2c_slave0``です。  
主に端子の初期化とI2C0の初期化、
I2Cスレーブの初期化(I2C割り込みハンドラからのコールバックの登録)を行っています。  

読み書きするデータは1アドレスあたり8bitとしています。  

#### 処理本体
I2C0処理本体は``i2c_slave0_handler()``です。  

これはI2C割り込みハンドラからのコールバック処理です。  
なので、できるだけ速やかにリターンする必要があります。
printfなどの時間のかかる処理は行わないほうが良いのですが、
デバッグ用途に送受信データを表示したいのでprintfで表示しています。  
printfをなくして高速に応答できるように、フラグを使用してprintfの有効/無効化を行っています。  
フラグはメインルーチンでコンソールからのキー入力で切り替えています。  

{% include filename.html filename="i2c_slave0.c" %}
```c
#include <hardware/i2c.h>
#include <pico/i2c_slave.h>
#include <pico/stdlib.h>
#include <pico/rand.h>      // 乱数
#include <stdio.h>
#include <string.h>

// 表示フラグ
extern bool DISP_flag;

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
    uint8_t mem[256];
    uint8_t mem_address;
    bool mem_address_written;
} context;


// 次のデータセットの表示要求フラグ
static volatile bool DISP_REQ = false;


// 次のデータセットの表示
void disp_data_slave0(void)
{
    printf("== ch0 ==  addr : %02x\n", context.mem_address);
    for (int i = 0; i < 0xff; i+=0x10) {
        printf("%02x : %02x %02x %02x %02x %02x %02x %02x %02x - %02x %02x %02x %02x %02x %02x %02x %02x\n", 
                i, context.mem[i+ 0], context.mem[i+ 1],  context.mem[i+ 2], context.mem[i+ 3],
                   context.mem[i+ 4], context.mem[i+ 5],  context.mem[i+ 6], context.mem[i+ 7],
                   context.mem[i+ 8], context.mem[i+ 9],  context.mem[i+10], context.mem[i+11],
                   context.mem[i+12], context.mem[i+13],  context.mem[i+14], context.mem[i+15]
            );
    }
    return;
} 

// 読み出しデータの初期化
static void init_data(void)
{
    // 送信データの初期値をセットしておく
    for (int i = 0; i < sizeof(context.mem); i++) {
        context.mem[i] = (uint8_t)get_rand_32();        // 乱数で初期化
    }
    // アドレス初期化
    context.mem_address = 0;
    return;
}

// I2C ISRからのコールバック
// printfなど時間のかかる処理は使うべきではないけど使っちゃお...
static void i2c_slave0_handler(i2c_inst_t *i2c, i2c_slave_event_t event) {
    switch (event) {
    case I2C_SLAVE_RECEIVE: // write event
        if (!context.mem_address_written) {
            // STOP/RESTART後の最初の書き込みはアドレス更新
            context.mem_address = i2c_read_byte_raw(i2c);
            context.mem_address_written = true;
            if (DISP_flag) {
                printf("ch0 set memory address : %02x\n", context.mem_address);
            }
        } else {
            // メモリ内容書き換え
            uint8_t addr = context.mem_address++;
            uint8_t data = i2c_read_byte_raw(i2c);
            context.mem[addr] = data;
            if (DISP_flag) {
                printf("ch0 write memory : %02x : %02x\n", addr, data);
            }
        }
        break;
    case I2C_SLAVE_REQUEST: // read event
        // メモリから1バイト送信する
        uint8_t addr = context.mem_address++;
        uint8_t data = context.mem[addr];
        i2c_write_byte_raw(i2c, data);
        if (DISP_flag) {
            printf("ch0 read memory : %02x : %02x\n", addr, data);
        }
        break;
    case I2C_SLAVE_FINISH: // ストップ/リスタートコンディション時
        // 次の書き込みはアドレス更新
        context.mem_address_written = false;
        if (DISP_flag) {
            printf("ch0 STOP/RESTART condition\n");
        }
        break;
    default:
        break;
    }
}

// I2Cスレーブ初期化
void setup_i2c_slave0(void) {
    printf("setup i2c slave ch0\n");

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
    i2c_slave_init(i2c0, I2C_SLAVE0_ADDRESS, &i2c_slave0_handler);
    printf("setup i2c slave ch0 done\n");
}
```

### I2C1処理

I2C1は読み書きするデータが1アドレスあたり16bitとしていることを除けばI2C0と同じです。  

{% include filename.html filename="i2c_slave1.c" %}
```c
#include <hardware/i2c.h>
#include <pico/i2c_slave.h>
#include <pico/stdlib.h>
#include <pico/rand.h>      // 乱数
#include <stdio.h>
#include <string.h>

// 表示フラグ
extern bool DISP_flag;

// スレーブアドレス
static const uint I2C_SLAVE1_ADDRESS = 0x32;

// ボーレート
static const uint I2C_BAUDRATE = 400000; // 400 kHz

// 使用端子
static const uint I2C_SLAVE1_SDA_PIN = 18;  //GP18(Pin24)
static const uint I2C_SLAVE1_SCL_PIN = 19;  //GP19(Pin25)

// スレーブ読み出しパラメータ
static struct
{
    uint8_t mem[512];
    uint16_t mem_address;
    bool mem_address_written;
} context;


// 次のデータセットの表示要求フラグ
static volatile bool DISP_REQ = false;


// 次のデータセットの表示
void disp_data_slave1(void)
{
    printf("== ch1 ==  addr : %02x  %s\n", context.mem_address/2, context.mem_address % 2 ? "MSB":"LSB");
    for (int i = 0; i < 0x200; i+=0x10) {
        printf("%03x : %02x %02x %02x %02x %02x %02x %02x %02x - %02x %02x %02x %02x %02x %02x %02x %02x\n", 
                i, context.mem[i+ 0], context.mem[i+ 1],  context.mem[i+ 2], context.mem[i+ 3],
                   context.mem[i+ 4], context.mem[i+ 5],  context.mem[i+ 6], context.mem[i+ 7],
                   context.mem[i+ 8], context.mem[i+ 9],  context.mem[i+10], context.mem[i+11],
                   context.mem[i+12], context.mem[i+13],  context.mem[i+14], context.mem[i+15]
            );
    }
    return;
} 

// 読み出しデータの初期化
static void init_data(void)
{
    // 送信データの初期値をセットしておく
    for (int i = 0; i < sizeof(context.mem); i++) {
        context.mem[i] = (uint8_t)get_rand_32();        // 乱数で初期化
    }
    // アドレス初期化
    context.mem_address = 0;
    return;
}

// I2C ISRからのコールバック
// printfなど時間のかかる処理は使うべきではないけど使っちゃお...
static void i2c_slave1_handler(i2c_inst_t *i2c, i2c_slave_event_t event) {
    switch (event) {
    case I2C_SLAVE_RECEIVE: // write event
        if (!context.mem_address_written) {
            // STOP/RESTART後の最初の書き込みはアドレス更新
            uint8_t addr = i2c_read_byte_raw(i2c);
            context.mem_address = (uint16_t)addr * 2;
            context.mem_address_written = true;
            if (DISP_flag) {
                printf("ch1 set memory address : %02x(%03x)\n", addr, context.mem_address);
            }
        } else {
            // メモリ内容書き換え
            uint16_t addr = context.mem_address++;
            if (context.mem_address >= sizeof(context.mem)) {
                context.mem_address = 0;
            }
            uint8_t data = i2c_read_byte_raw(i2c);
            context.mem[addr] = data;
            if (DISP_flag) {
                printf("ch1 write memory : %02x %s : %02x\n", addr/2,  addr % 2 ? "MSB":"LSB", data);
            }
        }
        break;
    case I2C_SLAVE_REQUEST: // read event
        // メモリから1バイト送信する
        uint16_t addr = context.mem_address++;
        if (context.mem_address >= sizeof(context.mem)) {
            context.mem_address = 0;
        }
        uint8_t data = context.mem[addr];
        i2c_write_byte_raw(i2c, data);
        if (DISP_flag) {
            printf("ch1 read memory : %02x %s : %02x\n", addr/2,  addr % 2 ? "MSB":"LSB", data);
        }
        break;
    case I2C_SLAVE_FINISH: // ストップ/リスタートコンディション時
        // 次の書き込みはアドレス更新
        context.mem_address_written = false;
        if (DISP_flag) {
            printf("ch1 STOP/RESTART condition\n");
        }
        break;
    default:
        break;
    }
}

// I2Cスレーブ初期化
void setup_i2c_slave1(void) {
    printf("setup i2c slave ch1\n");

    // 端子初期化
    gpio_init(I2C_SLAVE1_SDA_PIN);
    gpio_set_function(I2C_SLAVE1_SDA_PIN, GPIO_FUNC_I2C);
    gpio_pull_up(I2C_SLAVE1_SDA_PIN);

    gpio_init(I2C_SLAVE1_SCL_PIN);
    gpio_set_function(I2C_SLAVE1_SCL_PIN, GPIO_FUNC_I2C);
    gpio_pull_up(I2C_SLAVE1_SCL_PIN);

    // 送信データの初期値をセットしておく
    init_data();

    // I2C初期化
    i2c_init(i2c1, I2C_BAUDRATE);

    // I2Cスレーブとしての初期化
    i2c_slave_init(i2c1, I2C_SLAVE1_ADDRESS, &i2c_slave1_handler);
    printf("setup i2c slave ch1 done\n");
}

```




### cmake設定ファイル

``CMakeLists.txt``の
``add_executable`` に ``i2c_slave0.c``と``i2c_slave1.c``(追加したファイル名)を追加します。  
``target_link_libraries`` に ``pico_i2c_slave``(I2Cスレーブを使用)と``pico_rand``(乱数を使用)を追加します。  


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

project(i2c_slave_2ch C CXX ASM)

# Initialise the Raspberry Pi Pico SDK
pico_sdk_init()

# Add executable. Default name is the project name, version 0.1

add_executable(i2c_slave_2ch 
                i2c_slave_2ch.c
                i2c_slave0.c
                i2c_slave1.c
                )

pico_set_program_name(i2c_slave_2ch "i2c_slave_2ch")
pico_set_program_version(i2c_slave_2ch "0.1")

pico_enable_stdio_uart(i2c_slave_2ch 1)
pico_enable_stdio_usb(i2c_slave_2ch 0)

# Add the standard library to the build
target_link_libraries(i2c_slave_2ch
        pico_stdlib)

# Add the standard include files to the build
target_include_directories(i2c_slave_2ch PRIVATE
  ${CMAKE_CURRENT_LIST_DIR}
  ${CMAKE_CURRENT_LIST_DIR}/.. # for our common lwipopts or any other standard includes, if required
)

# Add any user requested libraries
target_link_libraries(i2c_slave_2ch 
        hardware_i2c
        pico_cyw43_arch_none
        pico_i2c_slave
        pico_rand
        )

pico_add_extra_outputs(i2c_slave_2ch)
```

あとはビルドしてRaspberry Pi Picoに書き込みます。  

# 動作確認

動作確認です。  
ここからはRaspberry Pi3 での作業です。  

## i2cdetect

``i2cdetect`` で I2Cバス上でデバイスが検出されるか確認します。  

```bash
i2cdetect -y 1
```

Picoのプログラムで設定したスレーブアドレス(``I2C_SLAVE0_ADDRESS``と``I2C_SLAVE1_ADDRESS``の設定値。上のプログラムだと0x17と0x32)
が表示されていればOKです。  
表示されていない場合はPicoのプログラムやボードの結線を見直してください。  


## i2cdump
``i2cdump`` で レジスタダンプしてみます。  

### I2C0
I2C0のレジスタをダンプしてみます。  
```bash
i2cdump -y 1 0x17
```
RaspberryPiPICOのコンソールで``0``を入力し、Slave0のレジスタをダンプした内容と比較して
内容が同じであることを確認します。  


### I2C1
I2C1のレジスタをダンプしてみます。  
```bash
i2cdump -y 1 0x32 w
```
RaspberryPiPICOのコンソールで``1``を入力し、Slave1のレジスタをダンプした内容と比較して
内容が同じであることを確認します。  


## その他

``i2cset``や``i2cget``で色々読み書きしてみてください。  





