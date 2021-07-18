# ターゲットのデバイス
target_device=/dev/mmcblk0

# パーティション情報の取得
part_info=`sudo parted -m ${target_device} unit s print free`

# 1行毎に分割
line=(${part_info//;/ })

# 最終行
# declare -i last_index=${#line[@]}-1
# last_line=${line[$last_index]}
last_line=${line[$((${#line[@]}-1))]}

# :で区切られた各要素に分割
elm=(${last_line//:/ })

# 変数名付け替え
# last_number=${elm[0]}
# last_start=${elm[1]}
last_end=${elm[2]}
# last_size=${elm[3]}
last_type=${elm[4]}

# 確認
# echo last_number=  $last_number
# echo last_start=   $last_start
# echo last_end=     $last_end
# echo last_size=    $last_size
# echo last_type=    $last_type

# 最後のパーティションがfreeか確認
if [ ${last_type} = free ] ; then
    # ext4のパーティション番号を探す
    part_number=0
    target_type="ext4"
    for l in ${line[@]} ; do
        # 各要素に分割
        elm=(${l//:/ })
        elm_number=${elm[0]}
        elm_type=${elm[4]}
        if [ -n "${elm_type}" ] ; then
            # echo $elm_number $elm_type
            if [ ${elm_type} = ${target_type} ] ; then
                part_number=${elm_number}
                break
            fi
        fi
    done
    if [ ${part_number} = 0 ] ; then
        echo "ext4のパーティションが見つかりませんでした"
    else
        # リサイズの実行
        set -x
        sudo parted ${target_device} resizepart ${part_number} ${last_end}
        sudo resize2fs ${target_device}p2
        set +x
        echo "リブートしてください"
    fi
else
        echo "最終パーティションがfreeではありません"
fi
 
