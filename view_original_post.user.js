// ==UserScript==
// @name          View Original Post In CC98
// @namespace     view_original_post@cc98.org
// @author        tuantuan <dangoakachan@gmail.com>
// @description   Add view original post link in the reply.
// @include       http://www.cc98.org/reannounce.asp*reply=true*
// @exclude       http://www.cc98.org/reannounce.asp?BoardID=182*
// @version       2.2
// @updateURL     http://userscripts.org/scripts/source/89784.meta.js
// ==/UserScript==

(function() {
    // 配置选项
    var config = {
        type: '1', // type为1则是默认的引用形式，为2则是使用@id: ...的形式，去掉引用的内容
        isOpenInNewTab: false, // 链接是否在新标签页打开
        color: 'green', // 颜色
        prompt: '|查看原帖|', // 链接提示文字，如果type为2则该选项无效
    };

    // 下面是代码
    var ccViewer = {
        config: config,
        content: document.getElementById('content'),

        relative: function(url) {
            return url.replace(/http:\/\/www\.cc98\.org\/([a-z])/g, '$1');
        },

        getOrigUrl: function(url) {
            return url.replace(/reannounce/, "dispbbs").replace(/reply.*?&/g, "").replace(/&bm=/, "#");
        },

        processContent:function() {
            var content = this.content.innerHTML;

            if (this.config.type == '1') {
                var ins_pos = content.indexOf("[/b]") + 4;
                var ins_content = "[url=" + this.getOrigUrl(location.href) +
                    ",t="+(this.config.isOpenInNewTab?'blank':'self') +"][color=" +
                    this.config.color + "]"+ this.config.prompt +"[/color][/url]";

                this.content.innerHTML = content.substring(0, ins_pos) +
                    ins_content + content.substring(ins_pos).replace(
                            /(\[em\d{2}\])/g, '[noubb]$1[/noubb]'); // do not parser [em**] tag
            } else {
                this.content.innerHTML = content.replace(/\[quotex\].*?\[i\](.*?)在\d+[\s\S]*\[\/quotex\]/,
                        '@[url=' + this.getOrigUrl(location.href) + 
                        ',t=' + (this.config.isOpenInNewTab?'blank':'self') + 
                        '][color=' + this.config.color + '][b]$1[/b][/color][/url]: ');
            }

            this.content.setSelectionRange(this.content.selectionEnd-1, this.content.selectionEnd-1);
            this.content.focus();
        },

        init: function() {
            that = this;
            function newsubmit(event) {
                var target = event ? event.target : this;
                that.content.innerHTML = that.relative(that.content.value);
                this.submit();
            }

            this.processContent();
            window.addEventListener('submit', newsubmit, true);
        }
    }

    ccViewer.init();
})()
