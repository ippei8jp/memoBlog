#!/bin/bash
# ==========================================================================
# バックアップしたSDカードイメージを最小サイズに縮小するスクリプト
# 
# バックアップ方法
#     sudo dd if=«入力デバイス» of=«出力ファイル名» status=progress
# 
# 実行方法
#     bash diskimage_shrink.sh «入力イメージファイル» «出力イメージファイル» 
# 
# 出力イメージファイルはZIP圧縮しておくと良い(圧縮前の半分くらいのサイズになる)
# 縮小したイメージファイルをSDカードに書き込む方法
#     sudo dd if=«入力ファイル» of=«出力デバイス» status=progress
# 
# 書き込んだSDカードをgpartedでパーティションを広げる方法
#     gpartedを起動
#         - Libparted Warning ダイアログで"Not all of the space available to ～"と出たらFixをクリック
#         - Libparted Warning ダイアログで"The backup GPT table is corrupt, but the primary appears OK, so that will be used."と出たらOKをクリック  
#         以降も何度か出るが、以下の操作がすべて終わればbackup GPTが新たに作成されるので問題なし。  
#         - Gparted→デバイスで``/devmmcblk0``を選択
#         - 図の``/dev/mmcbk0p1`` を右クリック→「リサイズ/移動」をクリック
#           - 「新しいサイズ」の欄に上にある「最大サイズ」を入力
#           - 「リサイズ」をクリック
#         - 「編集(E)」→「保留中の全ての操作を適用する(A)」をクリック
#           - 「本当に保留中の操作を適用してもよろしいですか？」と聞かれるので、「適用」をクリック
#           - 処理が完了したら「閉じる」をクリック
# ==========================================================================

# USAGE
function usage () {
    echo -e "\n==== usage ===="
    echo -e "$0 input_file output_file\n\n\n"
    exit 1
}

# 入力ファイル、出力ファイル指定は必須
if [ $# -ne 2 ]; then
    # パラメータ数 不一致
    usage
fi

INPUT_IMG_FILE=${1}                 # 入力ファイル
NEW_IMG_FILE=${2}                   # 縮小した(作成する)ファイル

# 入出力ファイルのチェック
if [ ! -e ${INPUT_IMG_FILE} ]; then
    echo "${INPUT_IMG_FILE}が存在しません"
    exit
fi

if [ -e ${NEW_IMG_FILE} ]; then
    echo "${NEW_IMG_FILE}が既に存在しています"
    echo -n "上書きしますか？ [y/N]: "
    read ANS
    case $ANS in
      [Yy]* )
        # ここに「Yes」の時の処理を書く
        echo "Yes"
        ;;
      * )
        # ここに「No」の時の処理を書く
        exit
        ;;
    esac
fi

echo "Copy image file..."
# 入力ファイルを作業ファイルにコピー
# 進捗表示したいのでrsyncで
rsync -i --progress ${INPUT_IMG_FILE} ${NEW_IMG_FILE}
if [ $? -ne 0 ]; then
  # エラー処理
  exit
fi

echo "Get partition info..."
# パーティション情報の取得
part_info=`parted -m ${NEW_IMG_FILE} unit B print 2> /dev/null`
# 1行毎に分割
line=(${part_info//;/ })

# ext4のパーティション番号を探す
part_number=0
part_start=0
target_type="ext4"
for l in ${line[@]} ; do
    # 各要素に分割
    elm=(${l//:/ })
    elm_number=${elm[0]}            # パーティション番号
    elm_start=${elm[1]//B/}         # 開始位置(ついでに最後のBを取り除いておく)
    elm_size=${elm[3]//B/}          # 現在のサイズ(ついでに最後のBを取り除いておく)
    elm_type=${elm[4]}              # ファイルシステムタイプ
    # echo $elm_number $elm_start $elm_type
    if [ -n "${elm_type}" ] ; then
        if [ ${elm_type} = ${target_type} ] ; then
            # 対象のパーティションが見つかった
            part_number=${elm_number}
            part_start=${elm_start}
            part_size=${elm_size}
            break
        fi
    fi
done

if [ ${part_number} = 0 ] ; then
    echo ${target_type} "のパーティションが見つかりませんでした"
    exit
fi

echo "対象パーティション番号 : ${part_number}"

echo "Image file mapping..."
# イメージファイルをマッピング(マッピング済みでも問題ない) 
# 前回の操作が終わるのを待つため-sを付けておく
sudo kpartx -asv ${NEW_IMG_FILE}

# loopデバイス名を取得
tmp_var=(`sudo kpartx -ls ${NEW_IMG_FILE}`)                        # 前回の操作が終わるのを待つため-sを付けておく
LOOP_DEV=/dev/mapper/${tmp_var[$((($((part_number-1))) * 6))]}      # 6個ごとにマウントポイントが入っている

echo "LOOP device : ${LOOP_DEV}"

# 要求するブロックサイズの取得
tmp_var=(`sudo resize2fs -P ${LOOP_DEV} 2> /dev/null`)
# echo ${tmp_var[@]}
req_fs_block=${tmp_var[-1]}                                         # サイズは結果の最後に入っている

# 新しいパーティション終了位置を計算
new_fs_block=$((req_fs_block + 100000))             # 少し余裕(100000block=390MB)を持たせる
new_fs_byte=$((new_fs_block * 4096))                # byteに換算
part_end=$((part_start + new_fs_byte + 2048))       # さらに少し余裕を持たせる
img_size=$((part_end + 10 * 1024 * 1024))           # しつこいくらいに余裕を持たせる 


echo "現在のパーティションサイズ   : $(((part_size) / (1024 * 1024) ))MiB"
echo "縮小後のパーティションサイズ : $(((part_end - part_start) / (1024 * 1024)))MiB"
echo -n "パーティションを縮小しますか？ [y/N]: "
read ANS
case $ANS in
  [Yy]* )
    # ここに「Yes」の時の処理を書く
    ;;
  * )
    # ここに「No」の時の処理を書く
    echo "Canceled!!"
    exit
    ;;
esac

echo "Partition shrinking..."
# set -x          #--------------------------------------

# ファイルシステムとパーティションの縮小
sudo e2fsck -f ${LOOP_DEV} 
sudo resize2fs -p ${LOOP_DEV} ${new_fs_block}
parted ${NEW_IMG_FILE} unit B resizepart ${part_number} ${part_end}
if [ $? -ne 0 ]; then
  # エラー処理
  sudo kpartx -d ${NEW_IMG_FILE}
  exit
fi

# set +x          #--------------------------------------

echo "Truncate image file size..."
# 縮小
truncate -s ${img_size} ${NEW_IMG_FILE}
# 以前のバージョンではddでコピっていたが遅いので。
# dd if=${WORK_IMG_FILE} of=${NEW_IMG_FILE} count=$((img_size / (1024 * 1024))) bs=1M  status=progress


# イメージファイルのマッピングを解除
echo "Releas image file mapping..."
sudo kpartx -d ${NEW_IMG_FILE}

echo "******** Done!! ********"

echo -e "\n\n"
echo    "対象ディスクイメージがGPTパーティションの場合は"
echo    "このあと、「gdisk ${NEW_IMG_FILE}」を実行し、"
echo    "b → 適当なファイル名 → r → d → w → y"
echo    "と入力してください。"
echo -e "\n"
echo    "「sudo parted -m ${NEW_IMG_FILE} unit GiB print」と実行すると"
echo    "縮小後のパーティションサイズを確認できます(後ろの方にext4と書かれた行)"
echo -e "\n\n"
echo    "これで期待通りのパーティションサイズになっていることが確認出来たら"
echo    "先に入力した「適当なファイル名」のファイルは削除してもかまいません"
 
