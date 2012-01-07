// ==UserScript==
// @name          View Original Post In CC98
// @namespace     http://www.cc98.org
// @author        tuantuan <dangoakachan@foxmail.com>
// @description   Add view original post link in the reply.
// @include       http://www.cc98.org/reannounce.asp*reply=true*
// @exclude       http://www.cc98.org/reannounce.asp?BoardID=182*
// @version       2.3
// ==/UserScript==

(function() {
    var open_in_new_tab = false; // 链接是否在新标签页打开
    var color = "green"; // 颜色
    var prompt = "|查看原帖|"; // 链接提示文字，如果type为2则该选项无效

    /* 返回相对地址 */
    function get_relative_url(url)
    {
        return url.replace(/http:\/\/www\.cc98\.org\/([a-z])/g, '$1');
    }

    /* 返回原帖地址 */
    function get_orig_url(url)
    {
        return url.replace(/reannounce/, "dispbbs").replace(/reply.*?&/g, "")
            .replace(/&bm=/, "#");
    }

    /* 处理回帖内容 */
    function process_content()
    {
        var text_area = document.getElementById("content");
        var content = text_area.value;

        var ins_pos = content.indexOf("[/b]") + 4;
        var ins_content = "[url=" + get_orig_url(location.href) + ",t="+(open_in_new_tab?'blank':'self') 
            +"][color=" + color + "]"+ prompt +"[/color][/url]";

        text_area.innerHTML = content.substring(0, ins_pos) + ins_content + 
            content.substring(ins_pos).replace(/(\[em\d{2}\])/g, "[noubb]$1[/noubb]")  // 不解释 [em**] 标签
            .replace(/(\[upload=.*?)(,0)?(\])/g, "$1,1$3");  // 不自动展开图片
        
        text_area.setSelectionRange(text_area.selectionEnd-1, text_area.selectionEnd-1);
        text_area.focus();
    }

    /* Main 函数入口 */
    function main()
    {
        process_content();

        var submit_btn = document.evaluate("//td[@class='tablebody2']//input[@type='submit']",
            document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null).snapshotItem(0);

        submit_btn.addEventListener('click', function(e) {
            var text_area = document.getElementById("content");
            text_area.innerHTML = get_relative_url(text_area.value);
        }, false);
    }

    main();
})()
