---
title: git の差分比較ツールにWinMergeを使用する
date: 2020-06-29
tags: ["Windows","git","WSL"]
excerpt: git の差分比較ツールに WinMerge を使用する方法
---

# Windows上のgit の差分比較ツールに WinMerge を使用する方法

Windows限定だが、git の差分比較ツールに WinMerge を使用する方法のメモ  
参考： [git の差分比較・マージを WinMerge で行う](https://qiita.com/kobake@github/items/fb317b4fdacad718a4b2?fbclid=IwAR1eO6ENMKDeeY3PmGJWrKLf_n1rgC8NVPBF60xKMiG02yAFgCFS6ceC7IE)  
↑参考というよりパクリだが(^^ゞ

git の差分比較の ``git diff`` で見ると見難いので、WinmMergeを使えるようにしてみた。  
普段はVS Code 使ってるけど...   


手順は、 ``C:\Users\〇〇\.gitconfig`` に以下を追記するだけ。

```
[diff]
    tool = WinMerge
[difftool "WinMerge"]
    path = C:/Program Files/WinMerge/WinMergeU.exe
    cmd = \"C:/Program Files/WinMerge/WinMergeU.exe\" -f \"*.*\" -e -u -r \"$LOCAL\" \"$REMOTE\"
[merge]
    tool = WinMerge
[mergetool "WinMerge"]
    path = C:/Program Files/WinMerge/WinMergeU.exe
    cmd = \"C:/Program Files/WinMerge/WinMergeU.exe\" -e -u \"$LOCAL\" \"$REMOTE\" \"$MERGED\"
[alias]
    windiff = difftool -y -d -t WinMerge
    winmerge = mergetool -y -t WinMerge
```

差分比較したいときに ``git windiff`` と入力すれば良い。  

差分はファイル書き換えても自動的にアップデートされなので、都度``git windiff`` する必要がある。  
(あくまでスナップショットでの比較を表示してるだけ)  

比較対象の指定とか、マージとかもできるみたいだけど、使ってないので、詳しくは↑の参考先を見てね。(^^ゞ  


# WSL上のgit の差分比較ツールに WinMerge を使用する方法

Windows上の場合とほぼ同じ。``~/.gitconfig``に以下を追加しておき、差分比較したいときに ``git windiff`` と入力する。  
マージは使わないので、diffだけ設定。  
(上の方法をwslpathでLinux上のpath→Windows上のpath 変換してるだけ、かな?)

```
[diff]
    tool = WinMerge

[difftool]
    prompt = false

[difftool "WinMerge"]
    cmd = '/mnt/c/Program Files/WinMerge/WinMergeU.exe' -e -r -u -wl -dl Local -wr -dr Remote \"`wslpath -wa $LOCAL`\" \"`wslpath -wa $REMOTE`\"
    trustExitCode = false

[alias]
    windiff = difftool -y -d --no-symlinks -t WinMerge
```
参考：[WSL(Ubuntu 18.04)環境のgitでWinMergeを使う方法](https://qiita.com/forest1/items/334b5d756b5696c63331)

参考先ではUbuntu18.04となっているが、20.04でも問題なし。  
また、``/mnt/c/Users/username``以下で作業と書いてあるが、どこで作業しても大丈夫。テンポラリパスの変更も不要。  

