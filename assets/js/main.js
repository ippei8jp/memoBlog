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


// -------- コードブロック内のcodeタグにcode_bodyクラスを追加しておく --------
$(function() {
  // すべてのhighlightクラスを持つpre要素内のcode要素にcode_bodyクラスを付加
  $("pre.highlight").find('code').addClass('code_body');
});


// -------- copy button関連処理 --------
$(function() {
  // code_bodyクラスを持つ要素の前にコピーボタンを追加
  $(".code_body").before('<div class="do_copy_button">Copy</div>');

  // do_copy_buttonクラスのclickイベントを登録
  $(".do_copy_button").on("click", function(event) {
    // thisの兄弟エレメントからcode_bodyクラス内のテキストを取得
    let text  = $(this).parent().find('.code_body').text();
    // ckipboard APIでテキストをクリップボードへコピー
    navigator.clipboard.writeText(text);
  });
});


// -------- 行番号関連処理 --------
$(function() {
  // highlightクラスを持つpre要素それぞれについて処理
  $("pre.highlight").each(function(index, element){
    // 行数を取得
    let num = $(element).find('.code_body').html().split(/\n/).length - 1;  
    // 行番号表示用文字列の作成
    lines_str = (function(num) {
      var a = [];
      for (let i = 1; i <= num; i++) {
        a.push(i);
      }
      return a.join('\n');
    })(num);
    // 行番号要素とコード表示終了要素の追加
    $(element).prepend('<code class="line-number">'+ lines_str +'</code>');
    $(element).append('<code class="code_end"></code>');
  });
});


// -------- floatingScrollBar関連処理 --------
// 引用元： https://amphiluke.github.io/floating-scroll/
// jquery.floatingscroll.js/.css を読み込んでおくこと
$(function() {
  if (typeof $.fn.floatingScroll === 'function') {
    // floatingScrollが読み込まれていた場合の処理
    // すべてのhighlightクラスを持つpre要素でfloatingScrollを初期化
    $("pre.highlight").floatingScroll();
  }
});


// -------- 引用の処理 --------
$(function() {
    $('blockquote').each(function(i, element) {
        let str = $(element).text();
        if (str.match(/^\s*\[\!NOTE\]/)) {                                  // ブロック指定子と一致するか？先頭の改行とスペースを無視するため^\s*をつける
            let tmp_html = $(element).html().replace(/\s*\[\!NOTE\]/, '');  // pタグを無視するため^は付けない
            $(element).html(tmp_html);
            $(element).addClass('is-note');                                 // 背景色変更のためのクラス指定
        }
        else if (str.match(/^\s*\[\!WARNING\]/)) {
            let tmp_html = $(element).html().replace(/\s*\[\!WARNING\]/, '');
            $(element).html(tmp_html);
            $(element).addClass('is-warning');
        }
        else if (str.match(/^\s*\[\!ERROR\]/)) {
            let tmp_html = $(element).html().replace(/\s*\[\!ERROR\]/, '');
            $(element).html(tmp_html);
            $(element).addClass('is-error');
        }
        else if (str.match(/^\s*\[\!TIP\]/)) {
            let tmp_html = $(element).html().replace(/\s*\[\!TIP\]/, '');
            $(element).html(tmp_html);
            $(element).addClass('is-tip');
        }
        else if (str.match(/^\s*\[\!IMPORTANT\]/)) {
            let tmp_html = $(element).html().replace(/\s*\[\!IMPORTANT\]/, '');
            $(element).html(tmp_html);
            $(element).addClass('is-important');
        }
    });
});

// -------- tag絞り込み関連処理 --------
$(function() {
    $('#tag_selrctor').change(function() {
        let selected_tag = $(this).val();
        // search_filter(selected_tag);
        // tagパラメータを指定して現在のページへジャンプ
        window.location = window.location.pathname + '?tag=' + selected_tag;
    });
});

$(function() {
    $('.tag_label').click(function() {          // tag_label クラスがクリックされた
        let selected_tag = $(this).text().trim();
        // search_filter(selected_tag);
        // tagパラメータを指定して現在のページへジャンプ
        window.location = window.location.pathname + '?tag=' + selected_tag;
    });
});


function search_filter(selected_tag) {
    // 非表示状態を解除
    $('.list_item').removeClass("list_hide");

    // 値が空の場合はすべて表示
    if(!selected_tag) {
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


// tagパラメータで指定されたタグを表示
$(function() {
    // DOMの読み込みが完了したときの処理
    $(document).ready(function(){
        // URL内のtagパラメータを取得する
        let selected_tag = getParam('tag');
        let found = false;                                  // 見つかったフラグ初期化
        // tag_selrctor の下のoption全てについて処理
        $('#tag_selrctor option').each(function(index, element){
            // この関数はoption1つごとに実行される
            // indexに順番が、elementあるいはthisでDOMオブジェクトが取れる
            if (element.value == selected_tag) {
                // option に selected_tag があった
                $('#tag_selrctor').val(selected_tag);       // 対象のタグを選択状態にする
                search_filter(selected_tag);                // 目次のフィルタ処理
                found = true;                               // 見つかったフラグ
                // これ以上処理しない    eachメソッドはbreakでなくreturn falseで抜ける
                return false;
            }
        });
        if (!found) {
            // 見つからなかった
            $('#tag_selrctor').val('');
        }
    });
});


// URL内の指定されたパラメータの値を取得する
function getParam(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}


// -------- gist表示関連処理 --------
// 折り畳み表示のイベントハンドラ登録
// class="accordion_head"を指定したブロックの次のブロックを折りたたむ
$(document).on("click", ".accordion_head", function(){
  $(this).toggleClass("closed");
  $(this).next().slideToggle(1000);
});

$(document).ready(function(){
  $(".accordion_head_close").next().slideToggle();
});


$(document).on("click", ".accordion_head_close", function(){
  $(this).toggleClass("opened");
  $(this).next().slideToggle(1000);
});

