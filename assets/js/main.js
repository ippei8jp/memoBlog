// -------- 表示幅調整処理 --------
$(function() {
  let w1 =  $('nav').width();           // navの幅と
  let w2 =  $('div.wrapper').width();   // wrapperの幅に
  let body_width = w1 + w2 + 40;        // とりあえずのマージン分を加算して全体の幅にする
  $('body').css({
        "width": body_width,
        "margin-right": "auto",         // body 全体を中央に表示するための設定
        "margin-left": "auto"
      });
});

// -------- index関連処理 --------
$(function() {
  let outlineLabelNumber = 0;
  $("section h1, section h2, section h3").each(function(){
    // IDに日本語も使いたいので、「英数とアンダーバー(\w)、マイナス(-)以外」削除の処理を
    // 削除すべき文字コード指定に変更
    // $("nav ul").append("<li class='tag-" + this.nodeName.toLowerCase() + "'><a href='#" + $(this).text().toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g,'') + "'>" + $(this).text() + "</a></li>");
    // $(this).attr("id",$(this).text().toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g,''));
    // 見出しが同じだとIDがダブるので、正常にジャンプできなくなるため、ID付けルールを変更
    // let tmpStr = $(this).text().toLowerCase().replace(/ /g, '-').replace(/[\x20-\x2c\x2e\x2f\x3a-\x40\x5b-\x5f\x7b-\x7f]+/g,'');
    let tmpStr = 'outline_label_' + ('000' + outlineLabelNumber++).slice(-3);
    $("nav ul").append("<li class='tag-" + this.nodeName.toLowerCase() + "'><a href='#" + tmpStr + "'>" + $(this).text() + "</a></li>");
    $(this).attr("id", tmpStr);
    $("nav ul li:first-child a").parent().addClass("active");
  });

  $("nav ul li").on("click", "a", function(event) {
    let position = $($(this).attr("href")).offset().top - 190;
    $("html, body").animate({scrollTop: position}, 400);
    $("nav ul li a").parent().removeClass("active");
    $(this).parent().addClass("active");
    event.preventDefault();
  });
});


// -------- copy button関連処理 --------
$(function() {
  // すべてのhighlightクラスを持つdiv要素にdo_copy_buttonクラスを持つdiv要素を追加する
  // $("div.highlight").prepend('<div class="do_copy_button">Copy</div>');
  // すべてのhighlightクラスを持つpre要素の前にdo_copy_buttonクラスを持つdiv要素を追加する
  $("pre.highlight").before('<div class="do_copy_button">Copy</div>');

  // do_copy_buttonクラスのclickイベントを登録
  $(".do_copy_button").on("click", function(event) {
    // thisの次の兄弟エレメント(preのはず)
    let elem_pre = this.nextSibling;
    // の子の最初のcodeタグ
    let elem_code = elem_pre.getElementsByTagName('code')[0];
    // の中のテキスト
    let text = elem_code.innerText;

    // コピー用に一時的にテキストエリアを追加(一瞬見えるかもしれないが我慢して)
    // textareaにhidden属性を付けると消せるが、クリップボードへコピーできない
    $('body').append('<textarea id="copyInputArea">' + text + '</textarea>');

    // 作成したテキストエリア
    let copyInput = $('#copyInputArea')[0];

    // を選択
    copyInput.select();

    // したのをコピー
    document.execCommand('copy');

    // 要らなくなったので廃棄
    copyInput.remove();

    // コピーを通知
    // console.log("コピーしました");
    // alert("コピーしました");
  });
});


// -------- 行番号関連処理 --------
$(function() {
  let pre = document.getElementsByTagName('pre');
  let pl = pre.length;
  for (let i = 0; i < pl; i++) {
    pre[i].innerHTML = '<span class="line-number"></span>' + pre[i].innerHTML + '<span class="cl"></span>';
    let num = pre[i].innerHTML.split(/\n/).length;
    for (let j = 0; j < (num - 1); j++) {
      let line_num = pre[i].getElementsByTagName('span')[0];
      line_num.innerHTML += '<span>' + (j + 1) + '</span>';
    }
  }
});

// -------- 引用の処理 --------
$(function() {
    $('blockquote').each(function(i, element) {
        let str = $(element).text();
        if (str.match(/^\s*\[\!NOTE\]/)) {                              // ブロック指定子と一致するか？
            let tmp_str = str.replace(/^\s*\[\!NOTE\]/, '');            // ブロック指定子の削除
            $(element).text(tmp_str);
            $(element).prepend('<strong>==== NOTE ====</strong><br>');  // ブロックタイプの表示
            $(element).addClass('is-note');                             // 背景色変更のためのクラス指定
        }
        else if (str.match(/^\s*\[\!WARNING\]/)) {
            let tmp_str = str.replace(/^\s*\[\!WARNING\]/, '');
            $(element).text(tmp_str);
            $(element).prepend('<strong>==== WARNING ====</strong><br>');
            $(element).addClass('is-warning');
        }
        else if (str.match(/^\s*\[\!ERROR\]/)) {
            let tmp_str = str.replace(/^\s*\[\!ERROR\]/, '');
            $(element).text(tmp_str);
            $(element).prepend('<strong>==== ERROR ====</strong><br>');
            $(element).addClass('is-error');
        }
        else if (str.match(/^\s*\[\!TIP\]/)) {
            let tmp_str = str.replace(/^\s*\[\!TIP\]/, '');
            $(element).text(tmp_str);
            $(element).prepend('<strong>==== TIP ====</strong><br>');
            $(element).addClass('is-tip');
        }
        else if (str.match(/^\s*\[\!IMPORTANT\]/)) {
            let tmp_str = str.replace(/^\s*\[\!IMPORTANT\]/, '');
            $(element).text(tmp_str);
            $(element).prepend('<strong>==== IMPORTANT ====</strong><br>');
            $(element).addClass('is-important');
        }
    });
});

// -------- tag絞り込み関連処理 --------

$(function() {
    $('#tag_selrctor').change(function() {
        let selected_tag = $(this).val();
        search_filter(selected_tag);
    });
});

function search_filter(selected_tag) {
    // 非表示状態を解除
    $('.list_item').removeClass("list_hide");

    // 値が空の場合はすべて表示
    if(selected_tag === '') {
        return;
    }

    // リスト内の各アイテムをチェック
    for (let i = 0; i < $('.list_item').length; i++) {
        // アイテムに設定している項目を取得
        let itemData = $('.list_item').eq(i).data('tags');
        // 絞り込み対象かどうかを調べる
        if (!itemData.includes(selected_tag)){
            // itemData に selected_tag が含まれない
            $('.list_item').eq(i).addClass("list_hide");
        }
    }
}


// -------- floatingScrollBar関連処理 --------
// 引用元： https://amphiluke.github.io/floating-scroll/
$(function() {
  if (typeof $.fn.floatingScroll === 'function') {
    // floatingScrollが読み込まれていた場合の処理
    // すべてのhighlightクラスを持つpre要素でfloatingScrollを初期化
    $("pre.highlight").floatingScroll();
  }
});
