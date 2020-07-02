---
title: githubによるセキュリティチェック
date: 2020-07-03
tags: ["github"]
excerpt: githubによるセキュリティチェックによるpullリクエストが来た場合の対処方法
layout: default
---

# 概要

githubによるセキュリティチェックによるpullリクエストが来た場合の対処方法  

例えば、tensorflow 1.15 を使用するような設定が書かれていた場合、2.1.0に変更しろと言ってくる。  
でも、変更したら動かなくなるし...  

# 対処方法

こんな場合は しかたないので、アラート無視するよう言い訳する。  
やり方：[GitHub Security Alert の Dismiss 言い訳](https://blog.tmd45.jp/entry/2019/11/26/162157)  

でもって、自動で作成されたpullリクエストをcloseすると勝手に作成されたブランチも消えるらしい。  
やり方： [プルリクエストをクローズする](https://help.github.com/ja/github/collaborating-with-issues-and-pull-requests/closing-a-pull-request)  
