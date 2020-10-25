---
title: Jetson nano のSDカードをバックアップする
date: 2020-10-25
tags: ["DeepLearning", "Jetson nano", "RaspberryPi"]
excerpt: Jetson nano のSDカードをバックアップする
---

# 概要
[Jetson nano をセットアップする]({{ site.baseurl }}/2020/10/23/Jetson_nano_install.html) 
でセットアップしたSDカードをバックアップしておけば逐一セットアップ作業を行わなくても環境を復元できます。  

ただ、そのままSDカードをイメージファイル化しただけでは復元するSDカードのサイズが微妙に小さい場合などは、復元できなくなってしまいます。  
そこで、バックアップしtイメージファイル内のパーティションサイズを縮小し、イメージファイルを小さくするスクリプトを用意しました。  

この作業はubuntu PC上で行います。  

この方法、およびスクリプトはRaspberryPi用SDカードでも使用できます。  


# SDカードのバックアップ
> [!WARNING]
> Jetson用SDカードはFATパーティションが存在しないため、  
> WindowsPCではバックアップツールがSDカードを認識できず、バックアップできません。

- ubuntu PCにバックアップしたいSDカードを挿入  
  - マウントする必要はないので、マウントのための認証でキャンセルします  
    マウントされちゃたら、以下のコマンドでアンマウント  
    ```bash
    sudo umount «SDカードデバイスのパーティション»
    ```
- SDカードイメージをファイルにコピー
```bash
sudo dd if=«SDカードデバイス» of=«出力ファイル» status=progress
```
- ubuntu PCからSDカードを抜去

# ディスクイメージファイルの縮小

バックアップしたイメージファイルはSDカード容量と同じサイズになっています。  
ディスクイメージを縮小するために [このスクリプト]({{ site.baseurl }}/misc/stock/diskimage_shrink.sh) をダウンロードして実行します。  

まず、必要なツールをインストールしておきます。
```bash
apt install kpartx
```

ダウンロードしたスクリプトを実行します。
```bash
bash diskimage_shrink.sh «入力イメージファイル» «出力イメージファイル» 
```
出力イメージファイルが既に存在する場合は、上書きするか聞かれますので、yまたはnで指定してください。  

最初に入力イメージファイルから出力イメージファイルへコピーを行います。  
コピーが終了すると、``sudo``実行するためのパスワードを聞かれますので、入力してください。  
縮小するパーティションサイズを計算した後、
現在のパーティションサイズと縮小後のパーティションサイズが表示されます。  
各サイズが正しければ、yを入力してパーティションサイズの修正を行いますが、
一般的に危険な処理なので、「警告: パーティションを縮小するとデータを失うかもしれませんが、それでも実行しますか？」と再度確認されます。  
yを入力して実行してください。  

その後、さらに ファイルサイズを切り詰めます。  

処理が終了すると、以下のメッセージが表示されますので、これにしたがって後の処理を行ってください。  
RaspberryPi用SDカードはMBRパーティションなので``gdisk``の処理は不要です。  
````
対象ディスクイメージがGPTパーティションの場合は
このあと、「gdisk XXXX.img」を実行し、
b → 適当なファイル名 → r → d → w → y
と入力してください。


「sudo parted -m XXXX.img unit GiB print」と実行すると
縮小後のパーティションサイズを確認できます(後ろの方にext4と書かれた行)

これで期待通りのパーティションサイズになっていることが確認出来たら
先に入力した「適当なファイル名」のファイルは削除してもかまいません
````

## 実行例
実行例を以下に示します。  
入力コマンドは``# =========``で囲んであります。  
```
# =========================================================================
/work2$ bash diskimage_shrink.sh jetson_sd_20201022_2.img XXXX.img
# =========================================================================
Copy image file...
>f+++++++++ jetson_sd_20201022_2.img
 30,953,963,520 100%   26.97MB/s    0:18:14 (xfr#1, to-chk=0/1)
Get partition info...
対象パーティション番号 : 1
Image file mapping...
[sudo] <<ユーザ>> のパスワード: «パスワードを入力»
add map loop18p1 (253:0): 0 60313600 linear 7:18 28672
add map loop18p2 (253:1): 0 256 linear 7:18 2048
add map loop18p3 (253:2): 0 896 linear 7:18 4096
add map loop18p4 (253:3): 0 1152 linear 7:18 6144
add map loop18p5 (253:4): 0 128 linear 7:18 8192
add map loop18p6 (253:5): 0 384 linear 7:18 10240
add map loop18p7 (253:6): 0 768 linear 7:18 12288
add map loop18p8 (253:7): 0 128 linear 7:18 14336
add map loop18p9 (253:8): 0 896 linear 7:18 16384
add map loop18p10 (253:9): 0 896 linear 7:18 18432
add map loop18p11 (253:10): 0 1536 linear 7:18 20480
add map loop18p12 (253:11): 0 128 linear 7:18 22528
add map loop18p13 (253:12): 0 160 linear 7:18 24576
add map loop18p14 (253:13): 0 256 linear 7:18 26624
LOOP device : /dev/mapper/loop18p1
現在のパーティションサイズ   : 29450MiB
縮小後のパーティションサイズ : 15637MiB
パーティションを縮小しますか？ [y/N]: y
Partition shrinking...
e2fsck 1.44.1 (24-Mar-2018)
Pass 1: Checking iノードs, blocks, and sizes
Pass 2: Checking ディレクトリ structure
Pass 3: Checking ディレクトリ connectivity
Pass 4: Checking reference counts
Pass 5: Checking グループ summary information
/dev/mapper/loop18p1: 199065/1881264 files (0.2% non-contiguous), 3701166/7539200 blocks
resize2fs 1.44.1 (24-Mar-2018)
Resizing the filesystem on /dev/mapper/loop18p1 to 4003167 (4k) blocks.
Begin pass 2 (max = 55)
Relocating blocks             XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
Begin pass 3 (max = 231)
Scanning inode table          XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
The filesystem on /dev/mapper/loop18p1 is now 4003167 (4k) blocks long.

警告: 管理者権限がありません。パーミッションに注意してください。
警告: パーティションを縮小するとデータを失うかもしれませんが、それでも実行しますか？
はい(Y)/Yes/いいえ(N)/No? y                                               
Truncate image file size...
Releas image file mapping...
loop deleted : /dev/loop18
******** Done!! ********



対象ディスクイメージがGPTパーティションの場合は
このあと、「gdisk XXXX.img」を実行し、
b → 適当なファイル名 → r → d → w → y
と入力してください。


「sudo parted -m XXXX.img unit GiB print」と実行すると
縮小後のパーティションサイズを確認できます(後ろの方にext4と書かれた行)



これで期待通りのパーティションサイズになっていることが確認出来たら
先に入力した「適当なファイル名」のファイルは削除してもかまいません



# =========================================================================
/work2$ gdisk XXXX.img 
# =========================================================================
GPT fdisk (gdisk) version 1.0.3

Warning! Disk size is smaller than the main header indicates! Loading
secondary header from the last sector of the disk! You should use 'v' to
verify disk integrity, and perhaps options on the experts' menu to repair
the disk.
Caution: invalid backup GPT header, but valid main header; regenerating
backup header from main header.

Warning! Error 25 reading partition table for CRC check!
Warning! One or more CRCs don't match. You should repair the disk!

Partition table scan:
  MBR: protective
  BSD: not present
  APM: not present
  GPT: damaged

****************************************************************************
Caution: Found protective or hybrid MBR and corrupt GPT. Using GPT, but disk
verification and recovery are STRONGLY recommended.
****************************************************************************

Command (? for help): b
Enter backup filename to save: backup.gpt
The operation has completed successfully.

Command (? for help): r

Recovery/transformation command (? for help): d

Recovery/transformation command (? for help): w
Caution! Secondary header was placed beyond the disk's limits! Moving the
header, but other problems may occur!

Final checks complete. About to write GPT data. THIS WILL OVERWRITE EXISTING
PARTITIONS!!

Do you want to proceed? (Y/N): y
OK; writing new GUID partition table (GPT) to XXXX.img.
Warning: The kernel is still using the old partition table.
The new table will be used at the next reboot or after you
run partprobe(8) or kpartx(8)
The operation has completed successfully.



# =========================================================================
/work2$ sudo parted -m XXXX.img unit GiB print
# =========================================================================
BYT;
/work2/XXXX.img:15.3GiB:file:512:512:gpt::;
2:0.00GiB:0.00GiB:0.00GiB::TBC:;
3:0.00GiB:0.00GiB:0.00GiB::RP1:;
4:0.00GiB:0.00GiB:0.00GiB::EBT:;
5:0.00GiB:0.00GiB:0.00GiB::WB0:;
6:0.00GiB:0.01GiB:0.00GiB::BPF:;
7:0.01GiB:0.01GiB:0.00GiB::BPF-DTB:;
8:0.01GiB:0.01GiB:0.00GiB::FX:;
9:0.01GiB:0.01GiB:0.00GiB::TOS:;
10:0.01GiB:0.01GiB:0.00GiB::DTB:;
11:0.01GiB:0.01GiB:0.00GiB::LNX:;
12:0.01GiB:0.01GiB:0.00GiB::EKS:;
13:0.01GiB:0.01GiB:0.00GiB::BMP:;
14:0.01GiB:0.01GiB:0.00GiB::RP4:;
1:0.01GiB:15.3GiB:15.3GiB:ext4:APP:;



# =========================================================================
/work2$ ls -la jetson_sd_20201022_2.img y.img 
# =========================================================================
-rw-r--r-- 1 user  user 30953963520 10月 22 15:42 jetson_sd_20201022_2.img
-rw-r--r-- 1 user  user 16422139904 10月 25 07:00 y.img
```

# 新しいSDカードにバックアップを復元

イメージファイルからSDカードへのコピーはWindowsマシンで行っても良いですが、ここではubuntu PCで行う方法について記載します。  

- ubuntu PCに新しいSDカードを挿入
  - マウントする必要はないので、マウントのための認証でキャンセルします  
    マウントされちゃたら、以下のコマンドでアンマウント  
    ```bash
    sudo umount «SDカードデバイスのパーティション»
    ```
- バックアップしたイメージファイルをSDカードにコピー
```bash
sudo dd if=«入力ファイル» of=«SDカードデバイス» status=progress
```

# 新しいSDカードのパーティションを拡張

バックアップした際にパーティションサイズを縮小してあるため、そのままのSDカードではディスクの残り容量がわずかしかありません。  
そこで、パーティションサイズを拡張して容量を増加させます。  

この作業はubuntu PCであらかじめ行うか、またはターゲットマシンでブートした後に行います。  

パーティション操作プログラム``gparted``を使用します。  
インストールされていない場合は、``sudo apt install gparted``でインストールしておいてください。  

- gpartedを起動
  - Libparted Warning ダイアログで"Not all of the space available to ～"と出たらFixをクリック
  - Libparted Warning ダイアログで"The backup GPT table is corrupt, but the primary appears OK, so that will be used."と出たらOKをクリック  
    以降も何度か出るが、以下の操作がすべて終わればbackup GPTが新たに作成されるので問題なし。  
    (これは、ディスクイメージを縮小したときにgdiskコマンドを実行しなかった場合に出ます)
  - Gparted→デバイスで`«SDカードデバイス»``を選択
  - 図の``«SDカードのパーティション»`` を右クリック→「リサイズ/移動」をクリック
    - 「新しいサイズ」の欄に上にある「最大サイズ」以下の値を入力
    - 「リサイズ」をクリック
  - 「編集(E)」→「保留中の全ての操作を適用する(A)」をクリック
    - 「本当に保留中の操作を適用してもよろしいですか？」と聞かれるので、「適用」をクリック
  - 処理が完了したら「閉じる」をクリック
- gpartedを終了

ターゲットマシンで実行している場合は、そのまま使用できます。  
ubuntuマシンで実行した場合は、SDカードを取り外してください。  


