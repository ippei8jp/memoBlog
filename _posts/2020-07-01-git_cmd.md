---
title: git クイックリファレンス
date: 2020-07-01
tags: ["git"]
excerpt: git クイックリファレンス
layout: default
---
# git

## checkoutしてブランチを作成する
```bash
git checkout -b «ブランチ名» refs/tags/«タグ名»
```

## ブランチを切り替える
```bash
git checkout «ブランチ名»
```

## リモートリポジトリと同期する

必要ならmasterブランチに切り替えてから実行する ``git checkout master``

```bash
git pull
```

## ブランチ間のdiff
```bash
git diff «比較元ブランチ名» «比較先ブランチ名» [ファイル名 | ディレクトリ名]
```

## 管理対象外のファイルを表示する

管理対象外のファイルをすべて表示する

```bash
git ls-files --others
```

管理対象外のファイルを.gitignoreの無視ファイルを反映して表示する

```bash
git ls-files --others --exclude-standard
```

# こんなページもあるよ
[VSCodeでのGitの基本操作まとめ](https://qiita.com/y-tsutsu/items/2ba96b16b220fb5913be){:target="_blank"}

