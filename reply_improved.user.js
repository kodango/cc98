// ==UserScript==
// @id             reply_improved
// @name           Reply Improved
// @version        0.2
// @namespace      http://www.cc98.org
// @author         tuantuan <dangoakachan@foxmail.com>
// @include        http://localhost/cc98/*
// @include        http://www.cc98.org/dispbbs.asp*
// @include        http://10.10.98.98/dispbbs.asp*
// @require        http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js
// @run-at         document-end
// ==/UserScript==

(function() {

/* 用户设置开始 */

var showTitle = false;            // 回复框是否显示标题
var transparent = 1;              // 回复框透明度
var backgroundColor = '#F4F9FB';  // 回复框背景色
var animateSpeed = 'slow';        // 动画速度
var openInNewtab = false;         // 链接是否在新标签页打开
var color = "green";              // 颜色
var prompt = "|查看原帖|";        // 链接提示文字，如果type为2则该选项无效

/* 用户设置结束 */

/* 全局变量 */

/* 文本区别的最大输入长度 */
var maxTextareaLength = 16240;

/* Base64 编码 */
var base64FastReply = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABZ0RVh0Q3JlYXRpb24gVGltZQAwNC8xMS8wOGGVBZQAAAAcdEVYdFNvZnR3YXJlAEFkb2JlIEZpcmV3b3JrcyBDUzQGstOgAAACSUlEQVQ4jdWPv08TYRjHP3e9X71eLR4ltZgAElIwRk3o4OLE4MBgnF0cTEyd+Bd0YPIvcHYxDgwurjiQwFAlRAZjQZpKoBQptNcf1/d6r4sktNakJC4+yZO8yZvv5/l8FS43+tOXdzLpaft1s9m81/GFZph64MRja3bMfFLaOywqfYEEMAWMDIAZmXn35sPcxCtVU4yJqXHiVxwaXpPdbyWA1ljq6lw/8K7v+5v9JCEER0dHvPm4hBeWuD0/A0DKuUXZ2yYMQ7Y3d7Gi5qralx1RFIWzs7OeLZfL7OzscNoukhp36QifUSvDg5kXjFoZgq4gNT6CV2ve7wcCoKpqzwZBQKvVotPpYMUUxuxZFueWAVicW2bMnkW3VIQQ2kCgoig9CxCGIbqhUat57J1ssLK1BMDK1hJ7JxvUax4RTQ20QTBV7b0TiUTQNI0rxnWOD0roVozvx+u8+/ycUvUTUkoqBx6arq4PZWiaJo7jMG09QnY19gse9apP4XCDetXnR8FDhvilr41nfxieAy9ONBollUrRbreRMkcxeM9ppUQQdFFVJQxDufllrZpbfVsuDFXZNE2SySSKomDbNtcaN+h2u9i2zcLCQg74ABxLKcVQhhctE4kEvu8jpcSyLIB9oCylFABDAwEMw8AwjB5zoAGI88xQlf82gw5fynCY+Q8N/wkwm82OAvFisZi4bOVkMpmYnJycAur5fP7nuWEHwHXdSjqdfiyEcIYB6rruua5bucgY2C2bzcZ/PyNAtO+7BXQB8vl8vT/7C2ss4WrplFZOAAAAAElFTkSuQmCC';
var base64FastQuote = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAARFJREFUeNqkU03OREAQbXwRseAYnMy3sJO4BJYsuJQlFm4h/unp10kLZiY6mUqeblX9XlWXolBKyS/2JzZZluVs8SAoRM+rgK7rhe/7/4cCnGma0rquqYzhHM4fidhLLksWVlUVRHIIqOzhOY4jdV8QhmEgruuSrus8+FTZJq7rSvq+5wIfm3jPtG3bhTzPM8eyLFeBewX7vpNpmjhJiGEPInD2v1WA4DiOh4DoNPYAqjIM44jxHmiaVjRNw4m4I8AadAF8iJumSWzbJm3bEsuyisc5KMvycQ4UUQomkZXuiesEQcDXOI55XwQBmd8m8Y4kSXi2KIrop/gZ6rfPiMxhGCpP8/FVQIYMU379nV8CDADQEaUK/jLo9wAAAABJRU5ErkJggg%3D%3D';
var base64CloseImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAEpJREFUeNpiYGBgEAXivUCsxYAAukC8CyoHlvwPxK+gErpQ9n+oHIrAKzS2LrKRMAkUSSYG3OAvNt1YrSDoSJg3ddG8CRITBQgwALGIIG7dYZgsAAAAAElFTkSuQmCC';
var base64UploadImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACUUlEQVQ4jY2Sz0tUURTHP/fe5+iY5ZvU/IWNmqVFyfQnWBtpU9CmNmEL97ayhSBY2yhauGoVbiOCNBDqQdDuQdI6yMnSnObND3+M87zv3ddinMFBiw5cOAfO93N+XcFfLP1q1CbwHYRcRTXcT97+UjguTxwrXhqzMfuOlKQAjGEFGRtL3nCOQI4A0u9v2pjAkUqmzgx1A5D5uoEJzQrSGktef1MHkXXi5XEbox0g1dqVINbUgNVg0dqVAEhhtJNeHrcPa6y68oHvICpt59MlTja3o0uafLpYzUgR4QBXj4zguu5TYAoAP0OHN8fZwRjlckRmXfPZPMT3/ep7Njk5+aAGcF23Xyn17fy5Syil2N9eI/fpLj29jfi+wctqEtc+oHVAqbTL28XX7OxsD0xPT69WdzDbdroDpRSWJVBKoMuKQkax7Sl0WRFrtIjHY1hWjL6+fkql0iyAcF3XVkrlq9XXN37R1uLzc3Gi/jq9T4g3SS4MDbC1vcXCwguKxWLCAqZaTpxCKQVAT3cXAIN3HKIoIooijDH0GoPWAfv7mlhDjM7OHrLZ7JRwXTcfhJEthUAIUdnKgcgYQxiGhCbEhAd+LQ7J5/MFS2ttX74yihACATXIsV8U2NSbaKVJxpPMP5+3rVwuB8DSu49IJVFSVmDiAHbo2hdHkjz+MQft8Hj4EZ7nYXmeB0Dmd46R4SRKSaSUSFnpiAMYwN7eHjvlXdZ2vhOakFwuVwE0x5uYuHfrv0ZYGHpZcQxorREzMzP5IAjsIAgIgqC2KGNM7Qr/sMIfkR8a8weYdtgAAAAASUVORK5CYII%3D';

/* 辅助函数 */

/* 返回相对地址 */
function getRelativeURL(url)
{
    return url.replace(/http:\/\/www\.cc98\.org\/([a-z])/g, '$1');
}

/* 返回原帖地址 */
function getOrigURL(url)
{
    return getRelativeURL(url.replace(/reannounce/, "dispbbs").replace(/reply.*?&/g, "")
        .replace(/&bm=/, "#"));
}

/* Main 函数 */
function main()
{
    /* 不在frames中再次执行该脚本 */
    if (window.top != window.self)
        return;

    /* 添加自定义的样式 */
    $('<style type="text/css"></style>').appendTo('head')
        .html([
            '.reply_button { margin-left: 10px; }',
            '.reply_button img { vertical-align: middle; width: 16px; height: 16px; }',

            '#reply_container { position: fixed; border: 5px solid transparent; width: 600px;',
            'border-radius: 5px; font-family: Verdana,Arial,Helvetica,sans-serif; font-size: 1.1em;',
            'line-height: 1.3em; box-shadow: 0 0 18px rgba(0, 0, 0, 0.4); display: none; }',

            '#reply_header_container { margin: 5px; }',
            '#reply_title_container { position: relative; margin-bottom: 5px; display: none; }',
            '#reply_title { font-weight: bold; }',
            '#reply_title_container a { position: absolute; right: 5px; top: 5px; }',
            '#reply_title_container img { border: none; opacity: 0.5; }',
            '#reply_subject_container { height: 24px; position: relative; }',
            '#reply_subject { padding: 3px; background-color: #fefefe; border: 1px solid #ccc; width: 100%; }',
            '#reply_type { padding: 3px 5px; background-color: #eee; left: 0px; top: 0px;',
            'border: 1px solid #ccc; position: absolute; }',
            '#reply_type img { vertical-align: middle; width: 16px; height: 16px; }',
            '#reply_panel { padding: 3px 2px 3px 5px; right: 0px; top: 0px; position: absolute; }',
            '#reply_panel img { margin: 1px 2px 0 0; vertical-align: middle; width: 15px; height: 15px; }',

            '#reply_panel_container .panel { margin: 0 5px; }',
            '#reply_panel_container img { vertical-align: middle; width: 15px; height: 15px;',
            'margin-right: 4px; cursor: pointer; }',

            '#reply_content_container { margin: 5px; position: relative; }',
            '#reply_content { height: 200px; border: 1px solid #ccc; background-color: #fefefe;',
            'width: 100%; padding: 0.6em; }',

            '#reply_footer_container { margin: 5px; }',
            '#reply_actions { text-align: left;}',
            '.reply_action { font-weight: bold; border-radius: 4px; border: 1px solid #c4c4c4;',
            'margin-right: 10px; padding: 2px 15px; cursor: pointer; font-size: 1em;',
            'font-family: Verdana,Arial,Helvetica,sans-serif; }',
            '.reply_action:hover { border-radius: 3px; border: 1px solid #777; }',

            '.reply_counter { border: 1px solid #ccc; padding: 2px; position: absolute; right: 3px;',
            'bottom: 3px; border-radius: 4px; display: none; }',

            '.warn_text { color: red; }',
            '.hidden { display: none; }'
        ].join(''));

    /* Add fast reply button in each floor */
    $('img[src$="message.gif"]').closest('td').append(function(index) {
        /* Get the reannounce URL */
        var quoteURL = $(this).find('a[href^="reannounce.asp"]').attr('href');

        return [
            // Fast reply buttons
            '<a title="快速回复" id="fast_reply_',
            index + 1,
            '" class="reply_button" href="javascript:void(0);">',
            '<img alt="快速回复" src="',
            base64FastReply,
            '"></img></a>',

            // Fast quote buttons
            '<a id="fast_quote_',
            index + 1,
            '" class="reply_button" href="',
            quoteURL,
            '" title="快速引用"><img alt="快速引用" src="',
            base64FastQuote,
            '"></img></a>',
        ].join('');
    });

    /* Bind click event to all reply buttons */
    $('.reply_button').live('click', function(evt) {
        /* Prevent default action */
        evt.preventDefault();
        /* Stop event bubble */
        evt.stopPropagation();

        var $replyContainer = $('#reply_container');
            $replyBtn = $(this);

        /* Get the topic title */
        var title = document.title.replace(/ » CC98论坛/, "");

        /* Append reply container to the body */
        if ($replyContainer.length == 0) {
            /* Create reply container and append to body */
            $replyContainer = $('<div id="reply_container"></div>');
            $replyContainer.appendTo('body');

            /* Fill the reply container and hide it */
            $replyContainer.html([
                '<div id="reply_header_container">',

                '<div id="reply_title_container">',
                '<span id="reply_title"></span>',
                '<a href="javascript:void(0);">',
                '<img id="reply_close" alt="关闭" src="',
                base64CloseImg,
                '"></img>',
                '</a></div>',

                '<div id="reply_subject_container">',
                '<input type="text" value="Re: ',
                title,
                '" name="reply_subject" id="reply_subject">',

                '<span id="reply_type"></span>',
                '<span id="reply_panel">',
                '<a href="javascript:void(0);" id="reply_expression">',
                '<img alt="发帖心情" src="face/face7.gif"></img></a>',
                '<a href="javascript:void(0);" id="reply_emotion">',
                '<img alt="插入表情" src="emot/simpleemot/emot88.gif"></img></a>',
                '<a href="javascript:void(0);" id="reply_upload">',
                '<img alt="上传文件" src="',
                base64UploadImg,
                '"></img></a>',
                '</span>',
                '</div>',
                '</div>',

                '<div id="reply_panel_container">',
                '<div class="panel hidden" id="expression_panel"></div>',
                '<div class="panel hidden" id="emotion_panel"></div>',
                '<div class="panel hidden" id="upload_panel"></div>',
                '</div>',

                '<div id="reply_content_container">',
                '<textarea id="reply_content" name="reply_content" placeholder="填写回复"></textarea>',
                '<span id="reply_content_counter" class="reply_counter">',
                maxTextareaLength,
                '字</span>',
                '</div>',

                '<div id="reply_footer_container">',
                '<div id="reply_actions">',
                '<button id="reply" class="reply_action">回复</button>',
                '<button id="preview" class="reply_action">预览</button>',
                '<button id="cancel" class="reply_action">退出</button>',
                '</div>',
                '</div>'
            ].join(''));
        }
        
        // If show title bar, then fill the title
        if (showTitle)
            $('#reply_title_container').show().find('#reply_title').html(
                $replyBtn.attr('title') + ' "' + title + '"'
            );

        /* Process the textarea content */
        if ($replyBtn.is('[id*="quote"]')) {
            var rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
            var replyURL = $replyBtn.attr('href');
            var $replyContent = $('#reply_content');

            $.get(replyURL, function(data) {
                var value = $('<div>').append(data.replace(rscript, ''))
                    .find('textarea#content').val();

                /* 删除多余的空行 */
                value = value.replace(/\s*\n*(\[quotex?\])\s*\n*/, "$1\n")
                    .replace(/\s*\n*(\[\/quotex?\])\s*\n*/, "\n\n$1\n");

                var insPos = value.indexOf("[/b]") + 4;
                var insContent = "[url=" + getOrigURL(location.href) + ",t="
                    + (openInNewtab?'blank':'self') + "][color=" + color + "][b]"
                    + prompt + "[/b][/color][/url]\n";

                value = value.substring(0, insPos) + insContent + value.substring(insPos)
                    .replace(/(\[em\d{2}\])/g, "[noubb]$1[/noubb]")  // 不解释 [em**] 标签
                    .replace(/(\[upload=[^,]*?)(,0)?(\])/g, "$1,1$3");  // 不自动展开图片

                $replyContent.val(value);
            });
        }

        $replyContainer
            .find('#reply_type') // Fill the reply type
                .html($replyBtn.find('img').clone(true))
            .end()
            .css({ // Set the style of reply container
                left: function() {  
                    return ($(window).width() - $(this).outerWidth()) / 2;
                },
                top: function() {
                    return ($(window).height() - $(this).outerHeight()) / 2;
                },
                opacity: transparent,
                backgroundColor: backgroundColor
            })
            .show(animateSpeed, function() {  // Show the reply container
                $('#reply_subject').css('paddingLeft', function(index, oldValue) {
                    var offset = $('#reply_type').outerWidth();
                        preOffset = parseFloat(oldValue) || 0;
                    
                    return (preOffset > offset) ? preOffset : preOffset + offset;
                });
            })
    });

    /* Display remain chars in specified form element dynamically */
    function charCount($frmObj, $cntObj, maxChars) {
        var remain = maxChars - $frmObj.val().length;

        if (remain < 0)
            $cntObj.addClass('warn_text');
        else
            $cntObj.removeClass('warn_text');

        $cntObj.text(function(index, oldValue) {
            return oldValue.replace(/-?\d+/, remain);
        });
    }

    /* Bind events to reply textarea (using event delegate) */
    $('#reply_content')
        .live('keyup keydown paste cut', function() {
            /* Dynamically count the chars in textarea */
            charCount($(this), $('#reply_content_counter'), maxTextareaLength);
        })
        .live('focus', function() {
            $('#reply_content_counter').show(animateSpeed); // Show char counter
        })
        .live('blur', function() {
            $('#reply_content_counter').hide(animateSpeed); // Hide char counter
        });

    /* Click close image or cancel button to close the reply container */
    $(document).click(function(evt) {
        var $replyContainer = $('#reply_container');

        if ($replyContainer.is(':visible') && $(evt.target).is('#cancel, #reply_close')) {
            $replyContainer.hide(animateSpeed);
        }
    });

    /* Click the button to open the panel */
    $("#reply_panel a").live("click", function() {
        /* Get the panel name */
        var panelName = (this.id.split("_")[1] || 'emotion') + '_panel';
        /* Get the panel with specified name */
        var $panel = $('#' + panelName);

        /* If the panel is empty now */
        if ($panel.is(':empty')) {
            $panel.html(function() {
                var htmlArr = [];

                switch ($panel.get(0).id) {
                    case 'emotion_panel':
                        for (var i = 0, emot = ""; i <= 90; i++) {
                            if (i >= 38 && i <= 70) 
                                continue; 

                            emot = (("0" + i).slice(-2));

                            Array.prototype.push.apply(htmlArr, [
                                '<img src="emot/simpleemot/emot',
                                emot, '.gif" alt="[em', emot, ']">'
                            ]);
                        }

                        break;
                    case 'expression_panel':
                        for (var i = 1; i <= 22; i++)
                            htmlArr.push('<img src="face/face' + i + '.gif">');

                        break;
                    case 'upload_panel':
                        var boardID = location.search.match(/boardid=(\d+)/i)[1];

                        Array.prototype.push.apply(htmlArr, [
                            '<iframe width="100%" scrolling="no" height="24" frameborder="0" ',
                            'src="saveannounce_upload.asp?boardid=',
                            boardID,
                            '" id="uploadframe" name="uploadframe"></iframe>',
                        ]);
 
                        break;
                }

                return htmlArr.join('');
            });
        }

        $panel.siblings().addClass('hidden');
        $panel.toggleClass('hidden');
    });

    /* Click the expression image to change one */
    $('#expression_panel img').live('click', function() {
        $('#reply_expression img').attr('src', this.src);
    });

    /* Click the emotion image to insert into post */
    $('#emotion_panel img').live('click', function() {
        var insertText = this.src.replace(/(.*?emot(\d+)\.gif)/, "[em$2]");
        var $replyContent = $('#reply_content');

        $replyContent.val(function(index, oldValue) {
            var start = $(this).prop('selectionStart');

            return [
                oldValue.slice(0, start),
                insertText,
                oldValue.slice(start)
            ].join('');
        }).focus();
    });
}

/* Call main function when dom is ready */
$(document).ready(main);

})();
