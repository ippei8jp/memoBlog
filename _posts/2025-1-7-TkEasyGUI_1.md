---
title: TkEasyGUIを使ってみる
date: 2025-1-7
tags: ["python", "TkEasyGUI"]
excerpt: pythonでGUIを簡単に作れる TkEasyGUI を使ってみる
layout: default
---

# 概要
pythonでGUIを作るにはtkinterを使うが、とっても分かり難い。  
そこで、簡単にGUIが作れるとウワサの TkEasyGUI を使ってみた。  
参考：  
   - [PyPI](https://pypi.org/project/TkEasyGUI/0.1.4/){:target="_blank"}  
   - [GitHub](https://github.com/kujirahand/tkeasygui-python){:target="_blank"}  
   - [TkEasyGUIライブラリの基本とサンプルコード解説](https://note.com/sirodon_256/n/na73d3fdac68d?fbclid=IwY2xjawHpgzhleHRuA2FlbQIxMQABHWBZ650bkpcT7-r0B3xAXpeUoIWsjSZJjZ4lqPUtBrxxQp3mlsCzFtM7tA_aem_lSSEVGhwq5SisJRckTFZcw){:target="_blank"}  


# 使ってみる
使ってみようと思ってはみたものの 何を作れば良いか思いつかなかったので、
以前にtkinterで作ったプログラムを TkEasyGUI を使って書き直して見ることにした。  

元にしたのは、
[ketsuatsu_GUI.py](https://gist.github.com/ippei8jp/b8af596718e357dce185b5279b3533b8){:target="_blank"}  
これの ``ketsuatsu_GUI.py``だけを書き換えてみる。  
(``ketsuatsu_csv2xls.py``はそのまま使用)  

# 作ってみた
ということで、書き直してみた。  

## 準備
TkEasyGUI のインストールは以下を実行するだけ。  
```bash
pip install TkEasyGUI
```
TkEasyGUI と pyperclip がインストールされる。  

全体を実行するには、上の元ソースのREADMEを参照。  

## ソース
ということで、作ってみたソースがこちら。  
元のソースと比べても行数で半分以下になった。  
また、イベントによる実行がイベントハンドラで登録するのから
イベントループでイベントを監視するように変更されたので、プログラムの見通しがよくなった。  

これを

{% include filename.html filename="ketsuatsu_easyGUI.py" %}
```python
import sys
sys.dont_write_bytecode = True      # pycacheを作成しない

import os

import TkEasyGUI as eg

# CSV→エクセル変換処理
from ketsuatsu_csv2xls import ketsuatsu_csv2xls

# フォント
# FONT_NAME1 = "ＭＳ ゴシック"
FONT_NAME1 = "BIZ UDゴシック"
FONT_NAME2 = "Noto Sans CJK JP"

FONT_SIZE = 12


# レイアウト
layout = [
    [
        eg.Text(        text = "CSV file  ",
                ),
        eg.Input(       "", 
                        key="-csvfilepath-", 
                        expand_x=True,
                ), 
        eg.FileBrowse(  button_text = "Browse...", 
                        title="CSV file",
                        file_types = (('CSV file', '*.csv'), ('all', '*.*')),
                     ),
    ],
    [
        eg.Text(        "Excel file",
                ),
        eg.Input(       "", 
                        key="-excelfilepath-", 
                        expand_x=True,
                ), 
        eg.FileBrowse(  button_text = "Browse...", 
                        title = "Excel file",
                        file_types = (('Excel file', '*.xlsx'), ('all', '*.*')),
                        save_as = True,
                     ),
    ],
    [
        eg.Column(
            layout=[
                      [
                        eg.Button(  "Convert",
                                    size = (10,0),
                                 ), 
                        eg.Button(  "Exit",
                                    size = (10,0),
                                 ),
                      ]
                    ],
            expand_x=True,
            expand_y=True,
            text_align="right",
            vertical_alignment="bottom",
        ),
    ],
]


# CSVファイルからexcelファイルへの変換処理をコールする
def convert_csv2xls(input_filename, output_filename):
    execute_flag = True

    # パラメータエラーチェック
    if len(input_filename) == 0 :
        # ファイルが指定されていない
        eg.popup(f"入力ファイルを指定してください", title="エラー")
        execute_flag = False
    # filedialog.askopenfilename()は存在するファイルしか選択できないが
    # エディットボックスを直接編集した場合のためにチェック
    elif not os.path.isfile(input_filename) :
        eg.popup(f"入力ファイルを指定してください",  title="エラー")
        execute_flag = False
    elif len(output_filename) == 0 :
        # ファイルが指定されていない
        eg.popup(f"出力ファイルを指定してください", title="エラー")
        execute_flag = False
    # この判定はfiledialog.asksaveasfilename()内で行うが
    # エディットボックスを直接編集した場合のためにチェック
    elif os.path.isfile(output_filename) :
        ret = eg.popup_ok_cancel(f"出力ファイルが存在します\n上書きしますか?", title="確認")
        execute_flag = True if ret == 'OK' else False
    if execute_flag :
        # 変換処理
        try:
            # CSVファイルからエクセルファイルを作成
            ketsuatsu_csv2xls(input_filename, output_filename)
            eg.popup(f"変換終了", title="終了")
        except Exception as e:
            eg.popup(f"{e}", title="エラー")


def main() :

    # 使用するフォントの設定
    fonts = eg.get_font_list()
    target_font_name = ""
    target_font_size = FONT_SIZE

    if FONT_NAME1 in fonts :
        target_font_name = FONT_NAME1
    elif FONT_NAME2 in fonts :
        target_font_name = FONT_NAME2


    # window create
    window = eg.Window('血圧 CSV->excel', 
                        size = (600, 150),
                        font = (target_font_name, target_font_size),
                        layout = layout
                    )

    # event loop
    while window.is_alive():
        event, values = window.read()
        print("#", event, values)
        if event == "Exit" :
            break
        if event == "Convert" :
            # print(values)
            input_filename  = values['-csvfilepath-']
            output_filename = values['-excelfilepath-']
            convert_csv2xls(input_filename, output_filename)
    
    # 終了
    window.close()



# ======================================================
if __name__ == '__main__':
    main()
```


# 未対応項目
## ドラッグアンドドロップ
TkEasyGUI は ドラッグアンドドロップに対応していないので、作成したプログラムも未対応。  
issueはあがっていて、作者さんも「It seems we could easily support」と言っているので、近いうちにサポートされるかも。  
  - [Drag & Drop files #7](https://github.com/kujirahand/tkeasygui-python/issues/7){:target="_blank"}  

## テーマの使用
TkEasyGUI は ttkの使用に対応しているが、使い方によってはうまく動かない。  
(今回は ``eg.Column`` の中の ``eg.Button`` で  ``use_ttk_buttons=True``を指定したらエラーになった。  
なにか条件があるのかもしれんが。)  
とりあえず「お手軽にGUI」が目的なので、テーマで見た目に凝らなくてもいいか、と対応はあきらめた。  


# まとめ
さらっと触っただけだけど、tkinterをそのまま使うよりかなり分かりやすい。  
が、ちょっと凝ったことをやろうとすると、できなかったりすることも。  
その辺は必須かどうか見極めて、あきらめるか、tkinterで泥沼にハマってでも実現するかを決めるしかないか。  
