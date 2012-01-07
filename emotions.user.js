// ==UserScript==
// @name           CC98 Emotions
// @namespace      cc98_emotions@cc98.org
// @description    add emotions for fast reply and some more enhancement
// @author         tuantuan <dangoakachan@gmail.com>
// @include        http://www.cc98.org/dispbbs.asp*
// @include        http://www.cc98.org/reannounce.asp*
// @include        http://www.cc98.org/announce.asp*
// @include        http://www.cc98.org/editannounce.asp*
// @match          http://www.cc98.org/dispbbs.asp*
// @match          http://www.cc98.org/reannounce.asp*
// @match          http://www.cc98.org/announce.asp*
// @match          http://www.cc98.org/editannounce.asp*
// @run-at         document-end
// @version        0.4
// ==/UserScript==

// 说明：
/*
 * 如果你要自定义添加表情的话 直接按代码中的格式添加吧，提供一个简便的方法：
  *首先把你要添加的表情图标上传到98，然后发帖框中是下面的样子：
 *
 * [upload=jpg,1]http://file.cc98.org/uploadfile/2011/3/24/xxx.jpg[/upload]
 * [upload=jpg,1]http://file.cc98.org/uploadfile/2011/3/24/yyy.jpg[/upload]
 * [upload=jpg,1]http://file.cc98.org/uploadfile/2011/3/24/zzz.jpg[/upload]
 *
 * 最后把下面的内容复制到地址栏回车：(不要带上前面的星号)
 * javascript:document.getElementById("content").value=document.getElementById("content").value.replace(/\[upload=.*?,\d](.+?)\[\/upload]/g, 'emot("$1");');void(0);
 *
 * 上面的就变成要添加到代码中的格式，复制到代码中相应的位置：(在代码中查找@emot)
 *
 * # default_selected: true or false
 * category_start("category_name", "category_description", default_selected)
 * emot("http://file.cc98.org/uploadfile/2011/3/24/xxx.jpg");
 * emot("http://file.cc98.org/uploadfile/2011/3/24/yyy.jpg");
 * emot("http://file.cc98.org/uploadfile/2011/3/24/zzz.jpg");
 * category_end()
 */

(function() {
    // Return a double-digit
    function XX(i) { return ("0" + i).slice(-2); }
    function $(id) { return document.getElementById(id); }

    // Add user style to current page
    if (typeof GM_addStyle === "undefined") {
        GM_addStyle = function(css) {
            var head = document.getElementsByTagName("head")[0];
            var style = document.createElement("style");

            style.type = "text/css";
            style.innerHTML = css;

            head.appendChild(style);
        }
    }

    // Insert the emot into post content.
    function insertIntoPost(evt)
    {
        var ele = evt.target;

        if (ele.nodeName != "IMG" || ele.className != "customized")
            return;

        var content = $("content");

        var src = ele.src;
        var emot_str = "";

        if (src.indexOf("simpleemot") != -1)
            emot_str = src.replace(/(.*?emot(\d+)\.gif)/, "[em$2]");
        else
            emot_str = src.replace(/(.*\.(.*))/, "[upload=$2]$1[/upload]"); 

        var start = content.selectionStart;

        content.value = [ 
            content.value.slice(0, start),
            emot_str,
            content.value.slice(start)
        ].join("");

        content.setSelectionRange(start+emot_str.length, start+emot_str.length);

        content.focus();
    }

    /* DO some initialization work */
    function init()
    {
        var emot_row = $("emot_row");
        var tables, replytable, emot_col, emot_category;

        if (emot_row) return;

        tables = document.getElementsByClassName("tableborder1");
        replytable = tables[tables.length - 1];

        if (location.href.indexOf("announce") != -1) {
            replytable.deleteRow(5);
            emot_row = replytable.insertRow(3);
        } else
            emot_row = replytable.insertRow(2);

        emot_row.innerHTML = "<td>心情图标&nbsp;&nbsp;<select id='emot_category'></select></td><td></td>";
        emot_row.id = "emot_row";

        GM_addStyle("\
            #emot_row {\
                background: #ffffff;\
                display: none;\
            }\
            #emot_row td:first-child {\
                font-weight:bold;\
            }\
            .customized {\
                cursor: pointer;\
                height: 20px;\
                margin-right: 2px;\
                margin-left: 1px;\
            }\
            div[id^='emot_category_'] {\
                display: none;\
            }\
            select#emot_category {\
                margin-left: 2px;\
            }\
        ");
    }

    // Add customized emotions
    function addCustomizedEmot()
    {
        var emot_html = [];
        var emot_row = $("emot_row");

        if (emot_row && window.getComputedStyle(emot_row)["display"] != "none")
            return;

        var emot_col = emot_row.lastElementChild;
        var emot_category = $("emot_category");

        // Make HTML code of emot image
        function emot(src, title)
        {
            var htmlStr = "";

            if (typeof src === "number")
                htmlStr = "<img class='customized' title='[em%i%]'\
                    src='emot/simpleemot/emot%i%.gif'>".replace(/%i%/g, XX(src));
            else if (typeof title !== "undefined")
                htmlStr = "<img class='customized' title='[%title%]' src='%src%'>"
                    .replace("%title%", title).replace("%src%", src);
            else 
                htmlStr = "<img class='customized' src='%src%'>".replace("%src%", src);

            emot_html.push(htmlStr);
        }

        /* Add category start tag */
        function category_start(category_name, category_desc, selected)
        {
            category_id = "emot_category_" + category_name;
            emot_html.push("<div id='" + category_id + "'>"); 

            var opt = new Option(category_desc, category_id);
            emot_category.options[emot_category.options.length] = opt;

            selected = selected || false;
            opt.selected = selected;
        }

        /* Add category end tag */
        function category_end() { emot_html.push("</div>"); }

        // CC98 emotions
        category_start("cc98_small_1", "CC98默认图标1", true);
        for (var i = 0; i <= 37; i++) emot(i);
        category_end();

        category_start("cc98_small_2", "CC98默认图标2", false);
        for (var i = 71; i <= 90; i++) emot(i);
        category_end();

        // CC98 emotions big version
        category_start("cc98_big_2", "CC98大图标2", false);
        emot("http://file.cc98.org/uploadfile/2010/1/17/22365187604.png", "big_em71");
        emot("http://file.cc98.org/uploadfile/2010/1/17/22372766025.png", "big_em72");
        emot("http://file.cc98.org/uploadfile/2010/1/17/22373173480.png", "big_em73");
        emot("http://file.cc98.org/uploadfile/2010/1/17/22371171263.png", "big_em74");
        emot("http://file.cc98.org/uploadfile/2010/1/17/22371017587.png", "big_em75");
        emot("http://file.cc98.org/uploadfile/2010/1/17/2237626431.png", "big_em76");
        emot("http://file.cc98.org/uploadfile/2010/1/17/22372285823.png", "big_em77");
        emot("http://file.cc98.org/uploadfile/2010/1/17/22373472125.png", "big_em78");
        emot("http://file.cc98.org/uploadfile/2010/1/17/2237838966.png", "big_em79");
        emot("http://file.cc98.org/uploadfile/2010/1/17/22371897916.png", "big_em80");
        emot("http://file.cc98.org/uploadfile/2010/1/17/22373556091.png", "big_em81");
        emot("http://file.cc98.org/uploadfile/2010/1/17/22372317316.png", "big_em82");
        emot("http://file.cc98.org/uploadfile/2010/1/17/22371648793.png", "big_em83");
        emot("http://file.cc98.org/uploadfile/2010/1/17/22371253497.png", "big_em84");
        emot("http://file.cc98.org/uploadfile/2010/1/17/22371277663.png", "big_em85");
        emot("http://file.cc98.org/uploadfile/2010/1/17/22372366588.png", "big_em86");
        emot("http://file.cc98.org/uploadfile/2010/1/17/22373310168.png", "big_em87");
        emot("http://file.cc98.org/uploadfile/2010/1/17/22372117466.png", "big_em88");
        emot("http://file.cc98.org/uploadfile/2010/1/17/22371130799.png", "big_em89");
        emot("http://file.cc98.org/uploadfile/2010/1/17/22373031020.png", "big_em90");
        category_end();

        // Nexushd emotions
        category_start("nexushd", "Nexushd图标", false);
        emot("http://file.cc98.org/uploadfile/2010/1/17/22365187604.png", "big_em71");
        emot("http://file.cc98.org/uploadfile/2010/4/2/11342373997.gif");
        emot("http://file.cc98.org/uploadfile/2010/4/2/11343238918.gif");
        emot("http://file.cc98.org/uploadfile/2010/4/2/11343784919.gif");
        emot("http://file.cc98.org/uploadfile/2010/4/2/11344165863.gif");
        emot("http://file.cc98.org/uploadfile/2010/4/2/11344780059.gif");
        emot("http://file.cc98.org/uploadfile/2010/4/2/129569014.gif");
        emot("http://file.cc98.org/uploadfile/2010/4/2/13354738825.gif");
        emot("http://file.cc98.org/uploadfile/2010/4/2/11345694270.gif");
        emot("http://file.cc98.org/uploadfile/2010/4/2/1135188590.gif");
        emot("http://file.cc98.org/uploadfile/2010/4/2/1135672584.gif");
        emot("http://file.cc98.org/uploadfile/2010/4/2/11351284999.gif");
        emot("http://file.cc98.org/uploadfile/2010/4/2/11354636137.gif");
        emot("http://file.cc98.org/uploadfile/2010/4/2/11355254424.gif");
        emot("http://file.cc98.org/uploadfile/2010/4/2/11355659320.gif");
        emot("http://file.cc98.org/uploadfile/2010/4/2/13391167382.gif");
        emot("http://file.cc98.org/uploadfile/2010/4/2/11345296500.gif");
        emot("http://file.cc98.org/uploadfile/2010/4/2/11361016697.gif");
        emot("http://file.cc98.org/uploadfile/2010/4/2/11361579523.gif");
        emot("http://file.cc98.org/uploadfile/2010/4/2/11362144134.gif");
        emot("http://file.cc98.org/uploadfile/2010/4/2/11362584099.gif");	
        emot("http://file.cc98.org/uploadfile/2010/4/2/11365897195.gif");
        emot("http://file.cc98.org/uploadfile/2010/4/2/1137318077.gif");
        emot("http://file.cc98.org/uploadfile/2010/4/2/1137794893.gif");
        emot("http://file.cc98.org/uploadfile/2010/1/5/15562999584.gif");
        emot("http://file.cc98.org/uploadfile/2010/1/2/12392190037.gif");
        emot("http://file.cc98.org/uploadfile/2010/1/2/12392145169.gif");
        emot("http://file.cc98.org/uploadfile/2010/4/2/11371577234.jpg");
        category_end();

        // @emot
        // 自定义表情添加

        emot_col.innerHTML = emot_html.join("");
        emot_row.style.display = "table-row";
        $(emot_category.value).style.display = "block";
    }

    /* Event listener */
    function listen()
    {
        $("content").addEventListener("focus", addCustomizedEmot, false);
        $("emot_row").addEventListener("click", insertIntoPost, false);

        (function() {
            var previous;

            $("emot_category").addEventListener("change", function(evt) {
                $(previous).style.display = "none";
                $(evt.target.value).style.display = "block";
            }, false);

            $("emot_category").addEventListener("click", function(evt) {
                previous = evt.target.value;
                console.log(previous);
            }, false);
        })();
    }

    init();
    listen();
})();
