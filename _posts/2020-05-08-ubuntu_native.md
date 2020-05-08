---
title: UbuntuをNative環境にインストールする(18.04)
date: 2020-05-08
tags: ["Ubuntu","setup"]
excerpt: Ubunt(18.04)をNative環境にインストールしたときのメモ
---

# Ubuntu をNative環境(Virtualboxではなく)にインストールする


[Ubuntu 18.04のインストール]({{ site.baseurl }}/2019/06/26/install1804.html)ではVirtualbox環境にUbuntuをインストールする手順を書いたが、ここではNative環境にインストールする手順を説明する。  

ハードウェア構成としては、Ubuntuを外付けHDDにインストールし、内蔵ディスクのWindowsは消さずにデュアルブート環境にする。  
手順はPCはNECのLavie all-in-oneタイプ(ちょっと古い奴)で確認している。  
BIOS関連など、PC固有の機能に左右される部分は機種によって異なるので注意。  

## 前準備

### HDDをGPT化  
インストールするHDDのパーティションがMBRだとEFIブートができないので、  
対象ハードディスクのパーテイションテーブルをGPTに変更  
参考：  
- [Windows10 - MBRディスク ⇔ GPTディスクに変換（変更）](https://pc-karuma.net/windows-10-convert-mbr-gpt-disk/)  

### インストールメディアでインストーラ起動  
インストールメディアはブータブルUSBメモリを作成すると便利  
ブータブルUSBメモリの作成は以下を参照  
- [窓の杜 Rufus](https://forest.watch.impress.co.jp/library/software/rufus/?fbclid=IwAR0Ry5oRt3jOegmkkswUQmudtvuleLCkH44-Tx8brnS0VYQJLQLBmGtT5Lw)  
- [RufusでLinuxのインストールメディアを作る](https://pc-freedom.net/software/how-to-use-rufus/?fbclid=IwAR1bXsLVQviiwpcQSZapci1vgJKF4rFv1nmIh7knZkrdQDJkGh7BLTrcXi4)  
- [本家](https://rufus.ie/)  

ダウンロードしたファイルはインストーラではなく、ポータブル版の実行ファイル。  
大体直感的に使えるけど、***UEFI モードで起動できるようにするにはパーティション構成でGPTを選択しないといけない***らしい。  
GPT にしておけば、UEFI モードでブートするPCのbootデバイスの優先順位をUSBをHDDより高くしておけば対象のHDDからブートできる。  

これで逐一CD-Rを焼かなくて済む。  
また、起動もCD-Rより高速。  

## 対象ハードディスクにインストール
以下を参照。  
- [Ubuntu 18.04 LTSインストールガイド【スクリーンショットつき解説】](https://linuxfan.info/ubuntu-18-04-install-guide)  

## 再起動してBIOSセットアップメニューを起動
NEC LAVIEの場合、電源ON時にF2キーを連打し、BIOSセットアップメニューを表示  
「Boot」の「Boot Priority Order」の起動順序で「Ubuntu」を「Windows」の上に持ってくる。  
その後、 saveしてreset。  

## 基本的な初期設定
Virtualbox版の手順の[Ubuntu 18.04のインストール]({{ site.baseurl }}/2019/06/26/install1804.html)を参照。  
基本的にこれと同じで大丈夫(GuestAdditionのインストール、grub-pcのインストール先情報の変更を除く)  

### もっと簡単に設定する方法があった
以下の項目はもっと簡単に設定する方法があったのでメモ。  

- 「ウィンドウが勝手に最大化するのをやめる」
- 「ウィンドウにマウスを乗せるとフォーカスされるようにする」
- 「デスクトップからゴミ箱とホームを消す」  

これらの設定はdconf-editorでなく、gnome-tweaksを使うと簡単(dconf-editorでもOK)  

gnome-tweaksのインストール
```bash
sudo apt install gnome-tweak-tool
gnome-tweaks
```
- 「ウィンドウにマウスを乗せるとフォーカスされるようにする」  
   - 「ウィンドウ」で「ウィンドウフォーカス」を「Sloppy」にする  
- 「デスクトップからゴミ箱とホームを消す」  
   - 「デスクトップ」で選択  
- 「CTRLとCapsLockの入れ替えを行う」(Virtualboxではホスト側で入れ替えてたので不要だった)
   - 「キーボードとマウス」で「追加のレイアウトオプション」をクリック  
     - Ctrl position」の「CapsLockをCtrlとして扱う」を選択する。  
         - 「CtrlとCapsLockを入れ替える」だとうまく動かないので注意。  
         - UnityとGNOME Flashbackでは設定は別らしい。  
         - GNOME Flashbackでは「CtrlとCapsLockを入れ替える」でもOK。  
- 「ウィンドウが勝手に最大化するのをやめる」  
   -  設定項目が見当たらないので、dconf editorで設定する。  
      - dconf editor起動して以下を変更  
         - /org/gnome/metacity/edge-tiling false  
         -  /org/gnome/mutter/edge-tiling false  
         -  /org/gnome/shell/overrides/edge-tiling false  


# sshのインストール
WindowsPCにあるデータをubuntuPCにキーボードで打ち込むのは効率が悪いので、最も簡単なsshでリモートログインできるようにしてみる。  

以下のコマンドでsshサーバをインストールし、サーバを開始する。  
```bash
sudo apt install ssh
systemctl start sshd
```
クライアントからTeraTermなどでsshで対象マシンのポート22に接続する  

# vncで画面共有する

sshリモートログインよりもうちょっと使いやすくしたいので、vncで画面共有するようにしてみる。  

chrome リモートデスクトップ等とは異なり、コンソールに表示している画面を共有して操作するもの。  
使用したクライアント(VNC-Viewer)がヘボいからなのか、ちょっと反応鈍いけど、  
コンソールで作業していた実行状況を確認したり  
会社でトラブった人のリモートサポートなんかに使えるかも。  

やり方自体はとてもシンプル。  
特にインストールとかも必要ない。  
(クライアント側はVNC viewerなどを実行する必要があるけど、こっちもインストールは不要(単体実行))  

例によって手順の説明は他力本願(^^ゞ  
参照：  
- [【Ubuntu 18.04 Desktop】WinやMacパソコンからVNCでリモート接続し画面共有する ]( https://www.yokoweb.net/2019/12/09/ubuntu-18_04-desktop-vnc-remote/)

そのままトレースすればできるけど、ちょっと「ん？」と思ってしまうエラーが。  
同じページの[ココ](https://www.yokoweb.net/2019/12/09/ubuntu-18_04-desktop-vnc-remote/#toc5)に解決策がかかれているけど、ちゃんと前もって書いておいてほしいもんだ(笑)。  
解決策の要約は以下の通り。  
```bash
sudo gsettings set org.gnome.Vino require-encryption false
# 実行後再起動必要
```

>[!NOTE]
>dconf editor でも設定可能。  
>なので、dconf editorとの設定操作とバッティングしないように注意  
>dconf editorで設定する場合は以下  
>    /org/gnome/desktop/remote-access/require-encryption

あくまで共有なのでコンソール側でGUIログインしてないとつながらない。  
反応鈍いので、普段使いにはちょっとストレスかも。  
chrome リモートデスクトップ使えるならそっち使ったほうがいいかな。  


# chromeリモートデスクトップのインストール

chromeリモートデスクトップ による接続は画面の共有ではなく、新しいセッションによる接続となる(Xclientみたいなもん？)。  
windowsマシンに接続した場合は表示画面のミラーリングだったが。  

chromeのインストール＆リモートデスクトップのインストールはWindowsとほぼ同じ。  
以下参考ページ  
- [Google Chrome フェブブラウザ](https://www.google.com/chrome/)  
- [Chrome リモート デスクトップを使って他のパソコンにアクセスする](https://support.google.com/chrome/answer/1649523?co=GENIE.Platform%3DDesktop&hl=ja)  
  - パソコンでリモート アクセスを設定する
  - パソコンにリモート アクセスする

接続すると、開始するセッションの選択画面になるので、「Ubuntu」を選択。GNOME Flashbackだとつながらない...なんで？？

接続すると、「カラーマネジメントされたデバイスを作成するには認証が必要です」ダイアログが出る場合がある。このダイアログはパスワード入れてもキャンセルしても結果は同じで問題なく操作できるが、逐一やるのはめんどっちいので出なくする。  
参考：  
- [Ubuntu 18.04LTS上のXRDP](https://qastack.jp/ubuntu/1031519/xrdp-on-ubuntu-18-04lts)  

要約すると
```/etc/polkit-1/localauthority/50-local.d/45-allow.colord.pkla``` で以下を入力
```
[Allow Colord all Users]
Identity=unix-user:*
Action=org.freedesktop.color-manager.create-device;org.freedesktop.color-manager.create-profile;org.freedesktop.color-manager.delete-device;org.freedesktop.color-manager.delete-profile;org.freedesktop.color-manager.modify-device;org.freedesktop.color-manager.modify-profile
ResultAny=no
ResultInactive=no
ResultActive=yes
```

設定を有効にするのは再起動必要。  

## コンソール画面を共有したい場合

chromeリモートデスクトップでvnc同様のコンソール画面の共有をすることも可能。  
設定方法は以下を参照。  
- [Chrome リモート デスクトップを使って他のパソコンにアクセスする](https://support.google.com/chrome/answer/1649523?co=GENIE.Platform%3DDesktop&hl=ja)
  - 他のユーザとパソコンを共有する

この方法だと、アクセスコードの生成(コンソール側)/アクセスコードの入力(リモート側)/アクセス許可(コンソール側)と手続きが少々煩雑(毎回必要)。  
画面共有で操作するにはvncのほうが簡単かな？  


# BIOSセットアップメニューでのブートマネージャの表示名を変更する

ubuntu をインストールした後、BIOSセットアップメニューでブート優先順位を指定しようとすると  
ubuntuのブートマネージャが2つ表示されて、どちらを選べばよいのか見分けがつかない。  
(機種によってはpathが表示されて見分けられるものもあるらしいが、私のPCはそうなってない)  

そこで、表示名を変更して見分けがつくようにしてみる。

以下、参考ページ  
- [bcdeditでUEFIのブート・エントリの名前を変更する](https://www.atmarkit.co.jp/fwin2k/win2ktips/1383uefinvnm/uefinvnm.html)


まず、Windowsを起動し、管理者権限でコマンドプロンプト(cmd.exe)を実行する。
PowerShellではちょっとテクニックが要る(というほど大げさではないが)みたいなので、
コマンドプロンプトで実行するのが無難。  

現在の状態の確認

```
bcdedit /enum firmware
```

実行結果
```
ファームウェアのブート マネージャー
--------------------------------
identifier              {fwbootmgr}
displayorder            {bootmgr}
                        {9b7f627e-7edc-11ea-84b2-806e6f6e6963}
                        {9b7f627f-7edc-11ea-84b2-806e6f6e6963}
timeout                 1

Windows ブート マネージャー
--------------------------------
《省略》

ファームウェア アプリケーション (101fffff
--------------------------------
identifier              {9b7f627e-7edc-11ea-84b2-806e6f6e6963}
device                  partition=\Device\HarddiskVolume2
path                    \EFI\ubuntu\shimx64.efi
description             ubuntu

ファームウェア アプリケーション (101fffff
--------------------------------
identifier              {9b7f627f-7edc-11ea-84b2-806e6f6e6963}
device                  partition=\Device\HarddiskVolume2
path                    \EFI\Ubuntu\grubx64.efi
description             ubuntu
```

表示名を変更する  
指定するuuidは現状の確認で確認したuuidに置き換えること。  
descriptionが表示名なので、これを好みの名前に変更する。  

```
bcdedit /set {9b7f627e-7edc-11ea-84b2-806e6f6e6963} description  "ubuntu shimx64"
bcdedit /set {9b7f627f-7edc-11ea-84b2-806e6f6e6963} description  "ubuntu grubx64"
```

結果を確認する

```
bcdedit /enum firmware
```

実行結果  

```
ファームウェアのブート マネージャー
--------------------------------
identifier              {fwbootmgr}
displayorder            {bootmgr}
                        {9b7f627e-7edc-11ea-84b2-806e6f6e6963}
                        {9b7f627f-7edc-11ea-84b2-806e6f6e6963}
timeout                 1

Windows ブート マネージャー
--------------------------------
《省略》

ファームウェア アプリケーション (101fffff
--------------------------------
identifier              {9b7f627e-7edc-11ea-84b2-806e6f6e6963}
device                  partition=\Device\HarddiskVolume2
path                    \EFI\ubuntu\shimx64.efi
description             ubuntu shimx64

ファームウェア アプリケーション (101fffff
--------------------------------
identifier              {9b7f627f-7edc-11ea-84b2-806e6f6e6963}
device                  partition=\Device\HarddiskVolume2
path                    \EFI\Ubuntu\grubx64.efi
description             ubuntu grubx64
```

ちなみに、shimx64.efi と grubx64.efi の違いは、セキュアブートの対応/非対応の違いである。  
通常(セキュアブート有効のハズ)はshimx64.efiで良いと思われる。  
参考：  
- [UEFIのWindows 10マシンにUbuntu 18.04を追加インストールしデュアルブート化する](https://netlog.jpn.org/r271-635/2019/08/uefi_windows10_ubuntu_install.html)  
   - 「UbuntuがUEFIのブートメニューに登録されていることを確認」のあたり  

この設定はbuntuを再インストールすると上書きされてしまうので、再度変更する必要がある。  


# GRUBのboot menuの表示などの変更方法

デフォルトのubuntuインストール状態では、GRUBのブートメニューが表示されない。  
そこで、ブートメニューを表示するように変更してみる。  
ついでに、設定する箇所が同じなので、  

- タイムアウトまでの時間の変更(あっ？と思った瞬間にブートされちゃうと悲しいので)  
- スプラッシュスクリーンを表示しなくする(ちゃんとブートしてるか心配なので(笑))  

も設定しておく。

まず、ubuntuを起動してターミナル起動  

rootでないとできないことなので、rootでbashを実行しておく
```bash 
sudo bash                                     
```

設定ファイル ``` /etc/default/grub``` を以下の内容で変更する  
```diff
--- grub.org	2020-05-08 06:16:59.908079737 +0900
+++ grub	2020-05-08 06:17:13.540255464 +0900
@@ -3,11 +3,11 @@
 # For full documentation of the options in this file, see:
 #   info -f grub -n 'Simple configuration'
 
-GRUB_DEFAULT=0
-GRUB_TIMEOUT_STYLE=hidden
-GRUB_TIMEOUT=10
+GRUB_DEFAULT=saved
+GRUB_TIMEOUT_STYLE=menu
+GRUB_TIMEOUT=30
 GRUB_DISTRIBUTOR=`lsb_release -i -s 2> /dev/null || echo Debian`
-GRUB_CMDLINE_LINUX_DEFAULT="quiet splash"
+GRUB_CMDLINE_LINUX_DEFAULT=
 GRUB_CMDLINE_LINUX=""
 
 # Uncomment to enable BadRAM filtering, modify to suit your needs
```

```GRUB_DEFAULT``` がデフォルトの選択項目。 ```saved``` は前回選択項目。rebootのときだけ？？動きがイマイチわからんかった。  
```GRUB_TIMEOUT_STYLE``` がメニュー表示形式。```hidden``` は表示しない、```menu``` はメニューを表示する。  
```GRUB_TIMEOUT``` がタイムアウトまでの時間。単位は秒。  
```GRUB_CMDLINE_LINUX_DEFAULT``` がLinux起動時のコマンドラインオプション。```quiet splash``` を指定すると起動メッセージを表示せず、スプラッシュスクリーンを表示する。これを削除することで起動メッセージが表示される  


変更した設定をcfgファイルに反映する  
```bash
grub-mkconfig -o /boot/grub/grub.cfg            
```

これで、次回起動時からGRUBのブートメニューが変更される

以下、参考ページ：
- [いますぐ実践! Linux システム管理](http://www.usupi.org/sysad/202.html)  

この項目と直接関係ないけど、起動時にのfsckを実行する方法の参考ページ。
- [Linux環境設定/起動時のファイルシステムチェック間隔の確認 ](https://linux.just4fun.biz/?Linux%E7%92%B0%E5%A2%83%E8%A8%AD%E5%AE%9A/%E8%B5%B7%E5%8B%95%E6%99%82%E3%81%AE%E3%83%95%E3%82%A1%E3%82%A4%E3%83%AB%E3%82%B7%E3%82%B9%E3%83%86%E3%83%A0%E3%83%81%E3%82%A7%E3%83%83%E3%82%AF%E9%96%93%E9%9A%94%E3%81%AE%E7%A2%BA%E8%AA%8D)


# USB-HDD接続→ Ubuntuのboot、未接続→Windowsのbootにする方法

ubuntuがインストールされたUSB-UDDが接続されていたらubuntuが、接続されていなければ内蔵HDDのWindowsが自動的に起動するようにしてみる。  
(デフォルトのインストール状態だとブート優先順位を変更しないと切り替えられない)  
ちょうどFDDブートのような感じ。

BIOSセットアップにより、ブートモードはUEFIブートで、ブート優先順位はubuntuの方を高く設定しておく。

まず、ubuntuを起動する

```/boot/efi/EFI/ubuntu/grub.cfg``` を以下のように変更する。  
rootでないとアクセスできないので、```sudo bash```  して rootでshellを動かして作業するのが良い。  

- 元のファイル  
```
search.fs_uuid 60c491cd-126d-4f4a-a321-84bb2e0d9068 root hd1,gpt1 
set prefix=($root)'/boot/grub'
configfile $prefix/grub.cfg
```
- 変更後のファイル  
```
if search.fs_uuid 60c491cd-126d-4f4a-a321-84bb2e0d9068 root hd1,gpt1 ;then
   set prefix=($root)'/boot/grub'
   configfile $prefix/grub.cfg
else
   set timeout_style=menu
   set timeout=0
   menuentry 'Windows Boot Manager (on /dev/sda2)' --class windows --class os $menuentry_id_option 'osprober-efi-2A43-3D28' {
      insmod part_gpt
      insmod fat
      set root='hd0,gpt2'
      if [ x$feature_platform_search_hint = xy ]; then
         search --no-floppy --fs-uuid --set=root --hint-bios=hd0,gpt2 --hint-efi=hd0,gpt2 --hint-baremetal=ahci0,gpt2  2A43-3D28
      else
         search --no-floppy --fs-uuid --set=root 2A43-3D28
      fi
      chainloader /EFI/Microsoft/Boot/bootmgfw.efi
  }
fi
```

メモ：  
- ```60c491cd-126d-4f4a-a321-84bb2e0d9068```  は ubuntuのインストールされたパーティションのuuidなので、接続したUSB-HDDDのuuidに合わせて変更する。  
   - パーティションのuuidは以下で確認可能。
```bash
grep ' \/boot\/efi ' /etc/mtab         # デバイスファイルを確認する
sudo blkid /dev/sda2                   # 確認したデバイスファイルを指定する
```
   - あるいは、元のファイルのuuidをコピるのでもOK。

- ```2A43-3D28```はEFIシステムパーティションのuuidなので、環境に合わせて変更する。  
   - パーティションのuuidは以下で確認可能。
```bash
grep ' \/ ' /etc/mtab                  # デバイスファイルを確認する
sudo blkid /dev/sdb1                   # 確認したデバイスファイルをしてする
```
   - あるいは、```/boot/grub/grub.cfg``` の ```menuentry 'Windows Boot Manager ～```  の部分をパクってきても可。  

- このファイルはbuntuを再インストールすると上書きされてしまうので、再度編集する必要がある。  

処理の解説：  
元のgrub.cfgではUSB-HDDが接続されていなければ ```$prefix/grub.cfg```  が見つからないので、GRUBメニューが表示されない。  
そこで、```search.fs_uuid``` の実行結果により、ディスクが見つかったら従来通りの処理、  
見つからなかったらWindows Boot Managerを起動するようにしている。

### 参考情報
WindowsからEFIシステムパーティションのファイルを編集するには、このあたりを参考に。  
- [デュアルブートから Ubuntu を削除する方法](https://bi.biopapyrus.jp/os/win/dualboot-fix-bootmenu.html)  
マウントする部分だけね。  
