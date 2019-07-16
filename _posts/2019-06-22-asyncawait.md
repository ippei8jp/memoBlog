---
title: python の async/await
date: 2019-06-22
tags: ["python"]
excerpt: python の async/awaitってどう動くんだっけ？
layout: default
---
## python の async/awaitってどう動くんだっけ？

と思ったので、ちょっとテストプログラムを書いて試してみた。

asyncioはnon-preemptiveなので、最近のpreemptiveに慣れ切った脳ミソにはややこしい。

preemptiveなプログラムを書きたければ、threadingを使えば良い。適材適所というやつだ。



## プログラム

```python
import asyncio
import time
import sys

argvs = sys.argv  # コマンドライン引数を格納したリストの取得
argc = len(argvs) # 引数の個数

if argc > 1 :
    testCase = int(argvs[1])
else :
    testCase = 5        # テストケース

print("testCase = ", str(testCase))

tbase = 0           # 念のため宣言だけしておく

async def sub():
    print("sub start        " + str(time.time() - tbase))
    await asyncio.sleep(2)
    print("sub wakeup       " + str(time.time() - tbase))
    return 42

async def main():
    print("befor create     " + str(time.time() - tbase))
    task = asyncio.create_task(sub())
    print("after create     " + str(time.time() - tbase))

    print("befor call       " + str(time.time() - tbase))
    if testCase == 1 :
        await task
    else :
        task
    
    print("after call       " + str(time.time() - tbase))
    await asyncio.sleep(1)
    print("main wakeup      " + str(time.time() - tbase))

async def main2():
    print("main2 start      " + str(time.time() - tbase))
    await asyncio.sleep(3)
    print("main2 wakeup     " + str(time.time() - tbase))


# =============================================================================
tbase = time.time()     # 開始時刻を記憶
if testCase == 1 or testCase == 2 :
    asyncio.run(main())
elif testCase == 3 :
    asyncio.run(main())
    asyncio.run(main2())
elif testCase == 4 :
    asyncio.run(asyncio.wait([main(), main2()]))
elif testCase == 5 :
    loop = asyncio.get_event_loop()
    loop.run_until_complete(main())
    loop.run_until_complete(main2())
    loop.close()
else :
    print("unknown test case!!")

print("done")
```


## 実行方法

以下のようにコマンドラインからテストケース番号を指定して実行する

```
python test.py <testCase>
```


## 実行結果
### testCase=1

基本的なパターン、というか、全然非同期実行になってないけど。。。

```main``` → ```sub``` → ```sleep(1)``` → ```sub起床``` → ```sub終了``` → ```sleep(2)``` → ```main起床```→ ```main終了``` となっている。

awaitが付いていると、その場でタスクに実行権を渡し、そのタスクが終了するまで待つ。

```bash
$ python test.py 1
testCase =  1
befor create     0.00026416778564453125
after create     0.00034689903259277344
befor call       0.00040340423583984375
sub start        0.00047469139099121094
sub wakeup       2.0033931732177734
after call       2.0035252571105957
main wakeup      3.004753351211548
done
```

### testCase=2

基本的なパターン、こっちが非同期実行として本命。

``sub``を実行するときに``await``を付けない。

``await``が付いていないと、その場でタスクに実行権を渡さず、自分の実行を中断する部分か終了するまでそのまま実行する。

``main`` → ``sleep(1)`` → ``sub`` → ``sleep(2)`` → ``main起床`` → ``main終了`` となっている。

``sub`` 呼び出し箇所では即時実行されず、sleep(2)で ``main`` の実行が中断されたところで ``sub`` へ切り替わる。

``sub`` で ``sleep(1)`` が実行されると実行されるタスクがなくなるので、イベントループは実行可能タスク待ちになる。

1秒後、``main`` が起床するので、そのままmainが終了される。

``asyncio.run(main())`` で イベントループは ``main`` の終了を待っているので、``sub`` が実行中でも無関係にイベントループを終了してしまい、
 ``sub`` の残りは実行されない。

```bash
$ python test.py 2
testCase =  2
befor create     0.0002646446228027344
after create     0.00034308433532714844
befor call       0.00039768218994140625
after call       0.0004489421844482422
sub start        0.0005385875701904297
main wakeup      1.0014407634735107
done
```



### testCase=3

testCase=2 でsubの残りも実行するには？と思って試したパターン。

``asyncio.run(main())`` が終了した時点で、即座に ``asyncio.run(main2())`` を実行してみた。

見事失敗。

``main`` → ``sleep(1)`` → ``sub`` → ``sleep(2)`` → ``main起床`` → ``main終了`` 
→ ``main2`` → ``sleep(3)`` → ``main2起床`` → ``main2終了`` となっている。

どうやら、 ``asyncio.run(main())`` が終了した時点で イベントループは一旦 ``close`` されてしまうらしい。

単にtestCase=2の後ろにmain2の実行を付け加えただけになってしまった。

```bash
$ python test.py 3
testCase =  3
befor create     0.00029540061950683594
after create     0.0003790855407714844
befor call       0.0004353523254394531
after call       0.00048828125
sub start        0.0005817413330078125
main wakeup      1.0015552043914795
main2 start      1.0021519660949707
main2 wakeup     4.0038042068481445
done
```

### testCase=4

testCase=3 の失敗挽回パターン。

``asyncio.wait()`` でmainとmain2をまとめてみた。

``main2`` → ``sleep(3)`` → ``main`` → ``sleep(1)`` → ``sub`` → ``sleep(2)`` → ``main起床`` → ``main終了`` 
→  ``sub起床`` → ``sub終了`` → ``main2起床`` → ``main2終了`` となっている。

``asyncio.wait()`` でまとめたタスクがすべて終了するまでイベントループは``close`` されないので、``sub``は最後まで実行される。

``mainn`` と ``main2`` のどちらが先に実行されるかは規定されていない様子。

```bash
$ python test.py 4
testCase =  4
main2 start      0.0003325939178466797
befor create     0.0004305839538574219
after create     0.0005018711090087891
befor call       0.0005679130554199219
after call       0.0006389617919921875
sub start        0.0007307529449462891
main wakeup      1.002068042755127
sub wakeup       2.002253293991089
main2 wakeup     3.003903388977051
done
```


### testCase=5

testCase=3 の失敗挽回パターン その2。

``asyncio.get_event_loop()`` でイベントループを取得し、``loop.run_until_complete()`` でそれぞれのタスクを実行してみた。

``main`` → ``sleep(1)`` → ``sub`` → ``sleep(2)`` → ``main起床`` → ``main終了`` 
→  ``main2`` → ``sleep(3)`` → ``sub起床`` → ``sub終了`` → ``main2起床`` → ``main2終了`` → イベントループ終了
となっている。

``loop.run_until_complete()`` ではタスクが終了してもイベントループはcloseされないので、同じイベントループで``main2``が実行される。
結果、``sub`` は最後まで実行される。

``mainn`` が終了するまで ``main2`` は実行(起動)されない。

```bash
$ python test.py 5
testCase =  5
befor create     0.0002574920654296875
after create     0.0003345012664794922
befor call       0.00038933753967285156
after call       0.0004410743713378906
sub start        0.0005307197570800781
main wakeup      1.0010528564453125
main2 start      1.0011804103851318
sub wakeup       2.002350330352783
main2 wakeup     4.002865314483643
done
```
