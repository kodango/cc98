// ==UserScript==
// @id             reply_improved
// @name           Reply Improved
// @version        0.7
// @namespace      http://www.cc98.org
// @author         tuantuan <dangoakachan@foxmail.com>
// @include        http://localhost/cc98/*
// @include        http://www.cc98.org/dispbbs.asp*
// @include        http://10.10.98.98/dispbbs.asp*
// @require        http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js
// @run-at         document-end
// ==/UserScript==

(function () {

/* 用户设置开始 */

var ReplyPopupTransp = 1;         // 回复框透明度
var ReplyPopupBgColor = '#F4F9FB';// 回复框背景色
var ReplyPopupWidth = '56%';      // 回复框宽度
var TextInputHeight = '270px';    // 文本框高度
var AnimateSpeed = 500;           // 动画速度
var OpenInNewtab = false;         // 链接是否在新标签页打开
var PromptColor = "green";        // 查看原帖提示颜色
var PromptString = "|查看原帖|";  // 查看提示文字
var RemoveMultiQuote = true;      // 删除多重引用的内容(仅保留最后一重)
var AutoSaveInterval = 30000;     // 自动保存数据间隔(毫秒)
var KeepTime = 3000;              // 状态显示保持时间
var ErrorStatusColor = 'red';     // 错误状态颜色
var NormStatusColor = 'black';    // 正常状态颜色

var UserStatusBoxStyle = {        // 状态框自定义样式
    opacity: 0.8,                 // 状态框透明度
    padding: '2px 5px',           // 状态框内边距
    lineHeight: '2.0em',          // 状态框行距
    borderRadius: '2px',          // 状态框圆角
    backgroundColor: '#fffef9',   // 状态框背景色
    border: '1px solid #cccccc'   // 状态框边框
};

var UserCountBoxStyle = {         // 字数统计框样式
    opacity: 0.6,                 // 字数统计框透明度
    fontWeight: 'bold',           // 字体加粗
    padding: '2px 4px',           // 字数统计框内边距
    borderRadius: '5px',          // 字数统计框圆角
    backgroundColor: '#d3d7d4',   // 状态框背景色
    border: '1px solid #33a3dc'   // 字数统计框边框
};

/* 用户设置结束 */

/* 文本区别的最大输入长度 */
var MaxTextareaLength = 16240;

/* 全局定时器 */
var StatusKeepTimer = -1;
var AutoSaveTimer = -1;

/* 图片按钮地址 (普通地址或者Base64编码)*/
var ImageURLs = {
    /* 快速回复按钮Base64编码 */
    reply: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABZ0RVh0Q3JlYXRpb24gVGltZQAwNC8xMS8wOGGVBZQAAAAcdEVYdFNvZnR3YXJlAEFkb2JlIEZpcmV3b3JrcyBDUzQGstOgAAACSUlEQVQ4jdWPv08TYRjHP3e9X71eLR4ltZgAElIwRk3o4OLE4MBgnF0cTEyd+Bd0YPIvcHYxDgwurjiQwFAlRAZjQZpKoBQptNcf1/d6r4sktNakJC4+yZO8yZvv5/l8FS43+tOXdzLpaft1s9m81/GFZph64MRja3bMfFLaOywqfYEEMAWMDIAZmXn35sPcxCtVU4yJqXHiVxwaXpPdbyWA1ljq6lw/8K7v+5v9JCEER0dHvPm4hBeWuD0/A0DKuUXZ2yYMQ7Y3d7Gi5qralx1RFIWzs7OeLZfL7OzscNoukhp36QifUSvDg5kXjFoZgq4gNT6CV2ve7wcCoKpqzwZBQKvVotPpYMUUxuxZFueWAVicW2bMnkW3VIQQ2kCgoig9CxCGIbqhUat57J1ssLK1BMDK1hJ7JxvUax4RTQ20QTBV7b0TiUTQNI0rxnWOD0roVozvx+u8+/ycUvUTUkoqBx6arq4PZWiaJo7jMG09QnY19gse9apP4XCDetXnR8FDhvilr41nfxieAy9ONBollUrRbreRMkcxeM9ppUQQdFFVJQxDufllrZpbfVsuDFXZNE2SySSKomDbNtcaN+h2u9i2zcLCQg74ABxLKcVQhhctE4kEvu8jpcSyLIB9oCylFABDAwEMw8AwjB5zoAGI88xQlf82gw5fynCY+Q8N/wkwm82OAvFisZi4bOVkMpmYnJycAur5fP7nuWEHwHXdSjqdfiyEcIYB6rruua5bucgY2C2bzcZ/PyNAtO+7BXQB8vl8vT/7C2ss4WrplFZOAAAAAElFTkSuQmCC',
    /* 快速引用按钮Base64编码 */
    quote: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAARFJREFUeNqkU03OREAQbXwRseAYnMy3sJO4BJYsuJQlFm4h/unp10kLZiY6mUqeblX9XlWXolBKyS/2JzZZluVs8SAoRM+rgK7rhe/7/4cCnGma0rquqYzhHM4fidhLLksWVlUVRHIIqOzhOY4jdV8QhmEgruuSrus8+FTZJq7rSvq+5wIfm3jPtG3bhTzPM8eyLFeBewX7vpNpmjhJiGEPInD2v1WA4DiOh4DoNPYAqjIM44jxHmiaVjRNw4m4I8AadAF8iJumSWzbJm3bEsuyisc5KMvycQ4UUQomkZXuiesEQcDXOI55XwQBmd8m8Y4kSXi2KIrop/gZ6rfPiMxhGCpP8/FVQIYMU379nV8CDADQEaUK/jLo9wAAAABJRU5ErkJggg%3D%3D',
    /* 群发信息 */
    send: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAQwAAAEMBuP1yoAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAAIdEVYdFRpdGxlAGF02E9UTwAAABN0RVh0QXV0aG9yAEJlYXRlIEthc3Bhcg7DR0QAAAB1dEVYdERlc2NyaXB0aW9uAGRlcml2ZWQgZnJvbSA8aHR0cDovL3dlYmN2cy5mcmVlZGVza3RvcC5vcmcvdGFuZ28vdGFuZ28taWNvbi10aGVtZS9zY2FsYWJsZS9hY3Rpb25zL2FkZHJlc3MtYm9vay1uZXcuc3ZnPvXu/YcAAAAbdEVYdENyZWF0aW9uIFRpbWUATm92ZW1iZXIgMjAwOF2vEzAAAABSdEVYdENvcHlyaWdodABDQyBBdHRyaWJ1dGlvbi1TaGFyZUFsaWtlIGh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL2xpY2Vuc2VzL2J5LXNhLzMuMC9eg1q8AAADLUlEQVQ4jXWTbUxTZxTH/8/tvbeltVxaBtcyKxaBouILY+qWDDU6lxkhGogvbDIxWYwuc4tplizEYPZlyZJtMW6CugG+hU0TzSL74Iz7shiMYiFCGFqWQUlRbMXactvbe+/TPvsymunkSc635/zyyzn/QxhjmOtVNrZLHM9XgrG+wQv79Zf9IS8Cluz8vtBb4vraLIqr9TRbKPDELPCmqK7TAMeR3y9+Udc6J2D7ZxcPuOY7j6gafRiJKpceReK30ul0SC7I27SgUKrJtYo7Eqp+bWA0vPvuj00UAPjZ5rc/Pr+1vLTom3g8eflCa90HL5h2AujcdbSnp8ztbK/muEsA6rMG3oZj+fXvVPVPTSu3u1q27lze2GYrL3d/KeXaXucInkYi8Z/c83M/9I9MHfEU5a3wLnR8+9ud8eretsYRDgDeWOnxGZTNu3nnfhMArKkqO1exuKhJ5E1BsyCgotR13OmU1nEcMd0fj5wyaGbG63Y2AAAHAHZbzmsGpf7RX3zaqj3tskt2bBgLTrWe/HT9eycO1dRpBr2h6mmTYdDx/s69TFGNWKEjx5UFWC1CaSql3waA6uWeZkJABobGOmYHkExoARNHkoZBw28e7PbITlvxg4moPwtQknrSYhYkAJiYnB7OsYiSJNkrZwFWq2W1blBl4Mw+bVWZ7JtJGtHJJ8rl/2yBTTPG3AAQDIWvx2KJx2urSr7bcfTqlcICx7KCPFtNXFFnDrf9cW2BLL0VCEZ8faffj2UNUrreZ7dZN67Z98PSwJXD+tCDUGtCNWyv5Ds+0XTqHhmd/JUAKUoznH9ksvZsy5ZTzwWppPYrbtvm6nuqnlZ6B/7eNth9MAwAy3a3keGfP2Ir9pwWCMcxnhfm+Tv3PntpEmt93esXvVrQkTIy/KNw7ETo8bPrlNJhs8VcXiTn1cn59mZkMg87Pn9305xR9jYcy61aWtwuiMIGEJOcUPWoKPIO3kSeUIP2BCaetvR3NUf+ByCE5AAoA7AEgAcgxSbRWiGIZpeuJRMZQwsBLAQgCGAMwJ8A/mKMac8ZEEJEAPZ/ywbACoABUAEoAGYAKIyx7Gn/A9zvY9t9CpUgAAAAAElFTkSuQmCC',
    /* 关闭按钮Base64编码 */
    close: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgBAMAAACBVGfHAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABJQTFRFAAAA////AAAAAAAAAAAAAAAA/h6U3wAAAAV0Uk5TAAAQn88jT+w1AAAAiUlEQVQoz32RwQ3AIAwDIyaAzsAAXYIJEPuv0sQxn1gqn1rXCwRioyzr1uwuTwHme4EnB23tK3hyMM+hEmnYs87ZFDwlSMWFAB1fClHSG5X8gWORyNEYIisDpMJCACjcGgAKD0+QCtpLkMr7A6SkbirH1sak9Xo5uX59IHlCeWQZgw6qjlKmX8EHWERHvlmYfrYAAAAASUVORK5CYII%3D',
    /* 文件上传按钮Base64编码 */
    upload: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACUUlEQVQ4jY2Sz0tUURTHP/fe5+iY5ZvU/IWNmqVFyfQnWBtpU9CmNmEL97ayhSBY2yhauGoVbiOCNBDqQdDuQdI6yMnSnObND3+M87zv3ddinMFBiw5cOAfO93N+XcFfLP1q1CbwHYRcRTXcT97+UjguTxwrXhqzMfuOlKQAjGEFGRtL3nCOQI4A0u9v2pjAkUqmzgx1A5D5uoEJzQrSGktef1MHkXXi5XEbox0g1dqVINbUgNVg0dqVAEhhtJNeHrcPa6y68oHvICpt59MlTja3o0uafLpYzUgR4QBXj4zguu5TYAoAP0OHN8fZwRjlckRmXfPZPMT3/ep7Njk5+aAGcF23Xyn17fy5Syil2N9eI/fpLj29jfi+wctqEtc+oHVAqbTL28XX7OxsD0xPT69WdzDbdroDpRSWJVBKoMuKQkax7Sl0WRFrtIjHY1hWjL6+fkql0iyAcF3XVkrlq9XXN37R1uLzc3Gi/jq9T4g3SS4MDbC1vcXCwguKxWLCAqZaTpxCKQVAT3cXAIN3HKIoIooijDH0GoPWAfv7mlhDjM7OHrLZ7JRwXTcfhJEthUAIUdnKgcgYQxiGhCbEhAd+LQ7J5/MFS2ttX74yihACATXIsV8U2NSbaKVJxpPMP5+3rVwuB8DSu49IJVFSVmDiAHbo2hdHkjz+MQft8Hj4EZ7nYXmeB0Dmd46R4SRKSaSUSFnpiAMYwN7eHjvlXdZ2vhOakFwuVwE0x5uYuHfrv0ZYGHpZcQxorREzMzP5IAjsIAgIgqC2KGNM7Qr/sMIfkR8a8weYdtgAAAAASUVORK5CYII%3D',
    /* 心情按钮 */
    expression: 'face/face7.gif',
    /* 表情按钮 */
    emotion: 'emot/simpleemot/emot88.gif',
    /* 不存在 */
    nonexist: ''
};

/* 返回相对地址 */
function getRelativeURL(url) {
    return url.replace(/http:\/\/www\.cc98\.org\/([a-z])/g, '$1');
}

/* 返回原帖地址 */
function getOrigURL(url) {
    url = url || location.href;
    return getRelativeURL(url).replace(/reannounce/, 'dispbbs')
        .replace(/reply.*?&/g, '').replace(/&bm=/, '#');
}

/* 返回版块ID */
function getBoardID() {
    var boardID = location.search.match(/boardid=(\d+)/i);
    return boardID ? boardID[1] : '39';
}

/* 返回帖子ID */
function getTopicID() {
    var topicID = location.search.match(/&id=(\d+)/i);
    return topicID ? topicID[1] : '0';
}

/* 函数类扩展：周期执行某个函数 (参考 Moontools)*/
Function.prototype.periodical = function (periodical, bind, args) {
    var self = this;
    var callback = function () {
        self.apply(bind, args || []);
    };

    return setInterval(callback, periodical);
};

/* Storage操作函数 */
function setValue(key, val) { window.sessionStorage.setItem(key, val); }
function getValue(key, def) { return window.sessionStorage.getItem(key, def); }
function delValue(key) { window.sessionStorage.removeItem(key); }

/* 添加自定义的样式 */
function addCustomizedCSS() {
    /* 添加到Head节点 */
    $('<style type="text/css"></style>').appendTo('head').html('\
        .reply_button img, .panel img {\
            width: 15px;\
            height: 15px;\
            border: none;\
            cursor: pointer;\
            vertical-align: middle;\
        }\
        .btn_reply { margin-left: 5px; }\
        .btn_quote { margin-left: 8px; }\
        .btn_close img { opacity: 0.3; }\
        #reply_container {\
            display: none;\
            position: fixed;\
            font-size: 1em;\
            border-radius: 5px;\
            border: 5px solid transparent;\
            box-shadow: 0 0 18px rgba(0, 0, 0, 0.4);\
            font-family: Verdana, Arial, Helvetica, sans-serif;\
        }\
        #reply_header_container { margin: 0 5px; }\
        #reply_subjectbar {\
            height: 27px;\
            margin: 5px 0 10px;\
            position: relative;\
        }\
        .reply_input {\
            width: 100%;\
            height: 27px;\
            padding: 4px;\
            background-color: #fefefe;\
            border: 1px solid #ccc;\
        }\
        .btn_send {\
            left: 0px;\
            top: 0px;\
            padding: 5px;\
            position: absolute;\
            background-color: #eee;\
            border: 1px solid #ccc;\
        }\
        #reply_panel_button {\
            top: 0px;\
            right: 0px;\
            padding: 4px;\
            position: absolute;\
            background-color: #eee;\
            border: 1px solid #ccc;\
        }\
        #reply_panel_button .reply_button { margin: 0 3px; }\
        #reply_panel_container { margin: 0 5px; }\
        .panel img { margin-right: 5px; }\
        .panel .label { margin-right: 5px; float: left; }\
        #reply_content_container {\
            position: relative;\
            margin: 10px 5px 5px;\
        }\
        #reply_content {\
            width: 100%;\
            padding: 0.4em;\
            line-height: 1.2em;\
            border: 1px solid #ccc;\
            background-color: #fefefe;\
        }\
        #reply_footer_container { \
            margin: 5px 5px 0px;\
            text-align: right;\
            display: none;\
            height: 25px;\
        }\
        .reply_action {\
            cursor: pointer;\
            font-size: 1em;\
            font-weight: bold;\
            border-radius: 5px;\
            margin-left: 10px;\
            padding: 2px 12px;\
            border: 1px solid #c4c4c4;\
            font-family: Verdana,Arial,Helvetica,sans-serif;\
        }\
        .reply_action:hover {\
            border-radius: 3px;\
            border: 1px solid #c8c8c8;\
            box-shadow: 0 0 3px rgba(120, 80, 100, 0.4);\
        }\
        .asv_action {\
            float: left;\
            cursor: pointer;\
            font-size: 0.9em;\
            padding: 2px 8px;\
        }\
        #btn_save {\
            border-right: 1px solid #999;\
            padding-left: 0px;\
        }\
        #reply_status_box,\
        #reply_cnt_box {\
            display: none;\
            position: absolute;\
        }\
        #reply_status_box font {\
            display: block;\
        }\
        .hidden { display: none; }\
    ');
}

/* 返回指定按钮的名称 */
function getButtonName(ele) {
    /* 获取按钮对象 */
    var $btn = (ele.tagName.toLowerCase() == 'a') ? $(ele) : $(ele).parent('a');
    var name = $btn.attr('id') || $btn.attr('class');

    /* 获取按钮名称 */
    if (name.indexOf('btn_') != -1)
        return name.match(/btn_(.*?)(?:\s|$)/)[1];
    else
        return 'nonexist';
}
 
/* 返回指定按钮的图片地址 */
function getButtonURL(ele) {
    return ImageURLs[getButtonName(ele)];
}

/* 创建快速回复以及快速引用按钮 */
function createReplyButtons() {
    $('img[src$="message.gif"]').closest('td')  // 查找插入位置
        .append(function (index) {
            return [
                '<a class="reply_button btn_reply" title="快速回复">',  // 快速回复按钮
                '<img alt="快速回复" src=""/>',
                '</a>',

                '<a class="reply_button btn_quote" title="快速引用">',  // 快速引用按钮
                '<img alt="快速引用" src=""/>',
                '</a>'
            ].join('');
        })
        .find('.reply_button img').attr('src', function () {  // 设定按钮的地址
            return getButtonURL(this); 
        });
}

/* 创建快速回复弹出窗口 */
function createReplyPopup() {
    /* 尝试查找回复框容器 */
    var $replyContainer = $('#reply_container');

    /* 若已经添加到文档中 */
    if ($replyContainer.length != 0)
        return $replyContainer;

    /* 创建回复框容器DIV */
    $replyContainer = $('<div id="reply_container"/>').appendTo('body');

    /* 填充回复框界面骨架 */
    $replyContainer.html([
        '<div id="reply_header_container">',   // 回复框头部
        '<div id="reply_subjectbar">',  // 回复框主题栏
        '<input type="text" id="reply_subject" class="reply_input"/>',  // 回复框主题
        '<input type="text" id="reply_send" class="reply_input hidden"/>',  // 群发信息输入框
        '<a class="reply_button btn_send">',  // 群发信息
        '<img alt="点击群发信息"/>',
        '</a>',
        '<span id="reply_panel_button">',  // 回复面板按钮
        '<a class="reply_button btn_expression" title="发帖心情">',  // 发帖心情按钮
        '<img alt="发帖心情"/>',
        '</a>',
        '<a class="reply_button btn_emotion" title="插入表情">',  // 插入表情按钮
        '<img alt="插入表情"/>',
        '</a>',
        '<a class="reply_button btn_upload" title="插入表情">',  // 上传文件按钮
        '<img alt="上传文件"/>',
        '</a>',
        '<a class="reply_button btn_close" title="关闭">',  // 回复框关闭按钮
        '<img alt="关闭"/>',
        '</a>',
        '</span>',
        '</div>',
        '</div>',

        '<div id="reply_panel_container">',  // 回复框面板
        '<div class="panel hidden" id="expression_panel"/>',  // 心情面板
        '<div class="panel hidden" id="emotion_panel"/>',  // 表情面板
        '<div class="panel hidden" id="upload_panel"/>',  // 上传面板
        '</div>',

        '<div id="reply_content_container">',  // 回复框内容
        '<textarea id="reply_content" name="reply_content"/>',  // 回复输入框
        '<div id="reply_cnt_box"/>',  // 字数统计
        '<div id="reply_status_box"/>',  // 字数统计
        '</div>',

        '<div id="reply_footer_container">',  // 回复框尾部
        '<div id="asv_actions">',
        '<span id="btn_save" class="asv_action">保存数据</span>',     // 保存数据
        '<span id="btn_recover" class="asv_action">恢复数据</span>',  // 恢复数据
        '</div>',
        '<div id="reply_actions">',
        '<button id="btn_reply" class="reply_action">回复</button>',  // 回复
        '<button id="btn_preview" class="reply_action">预览</button>',  // 预览
        '<button id="btn_cancel" class="reply_action">退出</button>',   // 退出
        '</div>',
        '</div>'
    ].join(''));

    return $replyContainer;
}

/* 处理引用的内容 */
function processQuoteContent(value, quoteURL) {
    /* 正则表达式定义 */
    var rmultiquote = 
        /(\[quotex?\][\s\S]*?)\[quotex?\][\s\S]*\[\/quotex?\]([\s\S]*?\[\/quotex?\])/gi;

    var rbegdupblank = /\s*\n*(\[quotex?\])\s*\n*/i;
    var renddupblank = /\s*\n*(\[\/quotex?\])\s*\n*/i;

    var remotubb = /(\[em\d{2}\])/gi;
    var rupldubb = /(\[upload=[^,]*?)(,0)?(\])/gi;

    /* 删除多余的空行 */
    value = value.replace(rbegdupblank, '$1\n').replace(renddupblank, '\n\n$1\n');

    /* 删除多重引用内容 */
    if (RemoveMultiQuote) value = value.replace(rmultiquote, '$1$2');

    /* 查找插入位置 */
    var insPos = value.indexOf('[/b]') + 4;

    /* 构造插入内容 */
    var insContent = [ '[url=', getOrigURL(quoteURL), ',t=', (OpenInNewtab?'blank':'self'), 
        '][color=', PromptColor, '][b]', PromptString, '/b][/color][/url]\n'
    ].join('');

    /* 拼接内容 */
    return value.substring(0, insPos) + insContent + value.substring(insPos)
        .replace(remotubb, "[noubb]$1[/noubb]")  // 不解释 [em**] 标签
        .replace(rupldubb, "$1,1$3");  // 不自动展开图片
}

/* 动态显示回复文本框 */
function showReplyPopup(ele, name) {
    /* 获取帖子标题 */
    var title = document.title.replace(/ » CC98论坛/, "");

    /* 尝试查找回复框容器 */
    var $replyContainer = createReplyPopup();

    /* 获取点击的按钮 */
    var $btn = $(ele);

    /* 找到引用的地址 */
    var quoteURL = $btn.siblings().filter('a[href*="reannounce.asp"]')
        .attr('href');

    /* 调整回复框高度 */
    var $replyContent = $replyContainer.find('#reply_content')
        .css('height', TextInputHeight)
        .attr('placeholder', '请输入回复');

    /* 设定回复框样式 */
    $replyContainer.css({
        opacity: ReplyPopupTransp,
        backgroundColor: ReplyPopupBgColor,
        width: function () {
            var theWidth = parseFloat(ReplyPopupWidth);
            var winWidth = $(window).width();

            if (ReplyPopupWidth.slice(-1) == '%')  // 百分数据表示
                return Math.min(theWidth / 100, 0.8) * winWidth;
            else
                return Math.min(theWidth, 0.8 * winWidth);
        },
        left: function () { 
            var theWidth = $(this).outerWidth();
            var winWidth = $(window).width();

            if (theWidth < winWidth / 2)
                return winWidth / 2;
            else
                return 3.0 / 4 * (winWidth - theWidth);
        },
        top: function () {
            return ($(window).height() - $(this).outerHeight()) / 2;
        }
    });

    /* 填充页面元素 */
    $replyContainer
        .find('.reply_button img')
            .attr('src', function () { return getButtonURL(this); })  // 设定按钮地址
        .end()
        .find('#reply_subject').val('Re: ' + title).end()  // 设定主题
        .find('#reply_send')
            .attr('placeholder', '用户名以逗号或者空格相隔, 按回车发送。例如: u1, u2 u3')
            .prop({quote: (quoteURL || location.href), topic: title})   // 增加自定义的属性
        .end();

    /* 显示回复框 */
    $replyContainer.slideDown(AnimateSpeed, function () {
        $replyContainer.find('.reply_input').css({    // 微调回复主题框
            paddingLeft: function (index, oldValue) {
                var offset = $replyContainer.find('.btn_send').outerWidth();
                var preOffset = parseFloat(oldValue) || 0;
                
                return (preOffset > offset) ? preOffset : preOffset + offset;
            },
            width: function (index, oldValue) {
                var offset = $replyContainer.find('#reply_panel_button').width();
                return $(this).parent('div').width() - offset - 20;
            }
        });
    });

    /* 如果是快速引用类型 */
    if (quoteURL && name == 'quote') {
        var rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;

        /* 获取引用的内容 */
        $.get(quoteURL, function (data) {
            var value = $('<div>').append(data.replace(rscript, ''))
                .find('textarea#content').val();

            $replyContent.val(function () { 
                return processQuoteContent(value, quoteURL); 
            });
        });
    }

    return $replyContainer;
}

/* 隐藏快速回复框 */
function hideReplyPopup() {
    var $replyContainer = $('#reply_container');

    /* 清除旧的定时器 */
    clearIntervalTimer();
    /* 退出前备份数据 */
    saveData($replyContainer.find('#reply_content'), true);

    if ($replyContainer.is(':visible')) {
        $replyContainer
            .find('#reply_footer_container')
                .slideUp(AnimateSpeed)
            .end()
        .slideUp(AnimateSpeed);
    }
}

/* 创建表情面板 */
function createEmotPanel() {
    var arr = new Array();
    var html = '<img src="emot/simpleemot/emot%n%.gif" alt="[em%n%]">';

    arr.push('<span class="label">插入表情:</span>');

    for (var i = 0; i <= 90; i++) {
        if (i >= 38 && i <= 70)   // 过滤不常用表情
            continue; 

        arr.push(html.replace(/%n%/g,  (('0' + i).slice(-2))));
    }

    return arr.join('');
} 

/* 创建心情面板 */
function createExprPanel() {
    var arr = new Array();
    var html = '<img src="face/face%n%.gif" alt="face%n%">';

    arr.push('<span class="label">选择心情:</span>');

    for (var i = 1; i <= 22; i++)
        arr.push(html.replace(/%n%/g, i));

    return arr.join('');
}

/* 创建上传文件面板 */
function createUpldPanel() {
    return [
        '<iframe width="100%" scrolling="no" height="24" frameborder="0" ',
        'id="uploadframe" src="saveannounce_upload.asp?boardid=',
        getBoardID(),
        '" name="uploadframe"></iframe>'
    ].join('');
}

/* 创建快速回复框面板 */
function createReplyPanel(panelName) {
    var htmlFrag;

    switch (panelName) {
        case 'emotion_panel':
            htmlFrag = createEmotPanel();
            break;
        case 'expression_panel':
            htmlFrag = createExprPanel();
            break;
        case 'upload_panel':
            htmlFrag = createUpldPanel();
            break;
        default:
            htmlFrag = '面板创建失败';
    }

    return htmlFrag;
}

/* 切换显示快速回复框面板 */
function toggleReplyPanel(name) {
    /* 获取待显示的面板对象 */
    var panelName = name + '_panel';
    var $panel = $('#' + panelName);

    /* 若面板未创建则填充面板元素 */
    if ($panel.is(':empty'))
        $panel.html(createReplyPanel(panelName));

    /* 控制面板的显示与隐藏 */
    $panel.siblings().addClass('hidden');
    $panel.toggleClass('hidden');
}

/* 显示通知信息 */
function showNotify(content, box, style, append) {
    if (!(box instanceof jQuery))
        box = $(box);

    if (append) // 追加内容
        box.append(content);
    else  // 填充内容
        box.html(content);

    /* 设定样式并显示内容 */
    box.css(style).fadeTo(AnimateSpeed, style.opacity || 1);
}

/* 延迟隐藏通知 */
function delayHideNotify(box, keepTime, oldTimer) {
    if (!(box instanceof jQuery))
        box = $(box);

    /* 如果存在定时器，则先清除并重置 */
    if (oldTimer && oldTimer != -1)
        clearTimeout(oldTimer);

    /* 清空状态并隐藏 */
    return setTimeout(function () {
        box.fadeOut(AnimateSpeed);
        box.empty();
    }, (keepTime||0) + AnimateSpeed);
}

/* 显示状态信息 */
function showStatus(statusText, statusBox, style, keepTime, append) {
    /* 扩展用户定义样式 */
    style = $.extend({}, style, UserStatusBoxStyle);

    showNotify(statusText, statusBox, style, append);

    /* 延迟隐藏信息 */
    StatusKeepTimer = delayHideNotify(statusBox, keepTime, StatusKeepTimer);
}

/* 动态显示文本框的剩余字数 */
function showCharCount(ta, cntBox) {
    /* 获取实际的jQuery对象 */
    if (!(ta instanceof jQuery))
        ta = $(ta);

    /* 统计剩余字数 */
    var remain = MaxTextareaLength - ta.val().length;
    var status;

    /* 显示在右下方 */
    var style = setAbsPosition(cntBox, ta, 'right', 'bottom');
    style = $.extend({}, style, UserCountBoxStyle);

    if (remain >= 0)
        status = '<font color="' + NormStatusColor + '">' +
            remain + '字' + '</font>';
    else
        status = '<font color="' + ErrorStatusColor + '">' +
            remain + '字' + '</font>';

    showNotify(status, cntBox, style);

    return remain;
}

/* 设置一个页面元素相对其它元素的绝对位置 */
function setAbsPosition(target, refer, x, y) {
    /* 位置样式 */
    var style = {
        left: 'auto',
        right: 'auto',
        top: 'auto',
        bottom: 'auto',
        position: 'absolute'
    };

    if (!(target instanceof jQuery))
        target = $(target);

    if (!(refer instanceof jQuery))
        refer = $(refer);

    /* 默认为居中 */
    x = x || 'middle';
    y = y || 'middle';

    /* 设置水平位置 */
    if (x == 'middle') {
        style['left'] = function () {
            return (refer.innerWidth() - target.outerWidth()) / 2;
        };
    } else
        style[x] = refer.css('padding-' + x);

    /* 设置垂直位置 */
    if (y == 'middle') {
        style['bottom'] = function () {
            return (refer.innerHeight() - target.outerHeight()) / 2;
        };
    } else
        style[y] = refer.css('padding-' + y);

    return style;
}

/* 发送站短 */
function sendMessages(user, title, message, ta, statusBox) {
    /* 构建post数据 */
    var formData = "touser=" + encodeURIComponent(user) + "&title=" 
        + encodeURIComponent(title) + "&message=" + encodeURIComponent(message);

    $.post('messanger.asp?action=send', formData, function (data) {
        var status, style;

        if (data.indexOf('操作成功') != -1) // 发送成功
            status = '<font color="' + NormStatusColor +
                '">✔ 消息成功发送给"' + user + '"</font>';
        else
            status = '<font color="' + ErrorStatusColor +
                '">✘ 消息未能发送给"' + user + '"</font>';

        /* 显示在正中间 */
        style = setAbsPosition(statusBox, ta, 'middle', 'middle');
        showStatus(status, statusBox, style, KeepTime, true);
    }).error(function () { // 如果发生错误
        /* 显示在正中间 */
        var style = setAbsPosition(statusBox, ta, 'middle', 'middle');
        var status = '<font color="' + ErrorStatusColor +
                '">✘ 消息发送给"' + user + '"过程中发生错误</font>';

        showStatus(status, statusBox, style, KeepTime, true);
    });
}

/* 获取存储Key值 */
function getKey() { return 'cc98bbscontent_tid' + getTopicID(); }

/* 备份文本框数据 */
function saveData(ta, auto, statusBox) {
    if (!(ta instanceof jQuery))
        ta = $(ta);

    var data = ta.val();
    var status = auto ? '自动: ' : '手动: ';

    if (data) { // 保存数据
        setValue(getKey(), data);
        status += '帖子内容保存于' + (new Date()).toLocaleTimeString();
    } else { // 放弃
        status += '帖子内容为空, 放弃备份';
        clearIntervalTimer(AutoSaveTimer);
    }

    if (statusBox === undefined)
        return;

    status = '<font color="' + NormStatusColor + '">' 
        + status + '</font>';

    /* 显示在左下方 */
    var style = setAbsPosition(statusBox, ta, 'left', 'bottom');
    showStatus(status, statusBox, style, KeepTime);
}

/* 恢复文本框数据 */
function recoverData(ta, statusBox) {
    /* 获取上次保存的数据 */
    var data = getValue(getKey(), '');
    var status;

    /* 恢复数据过程 */
    if (data && (!ta.val() || confirm('确定要恢复数据吗'))) {
        status = '成功恢复数据';

        if (!(ta instanceof jQuery))
            ta = $(ta);

        ta.val(data);
    } else
        status = data ? '放弃恢复数据' : '没有可以恢复的数据';

    status = '<font color="' + NormStatusColor + '">' 
        + status + '</font>';

    /* 显示在左下方 */
    var style = setAbsPosition(statusBox, ta, 'left', 'bottom');
    showStatus(status, statusBox, style, KeepTime);
}

/* 清除并重置周期定时器 */
function clearIntervalTimer() {
    if (AutoSaveTimer == -1)
        return;

    clearInterval(AutoSaveTimer);
    AutoSaveTimer = -1;
}

/* 切换显示群发信息框(仿微博@功能)*/
function toggleAtUser(ele) {
    var $subjectBar = $(ele).parent('div');
    $subjectBar.find('.reply_input').toggleClass('hidden');
}

/* 触发按钮点击事件 */
function triggerButtonClick(ele) {
    /* 获取按钮名称 */
    var name = getButtonName(ele);

    if (name == 'nonexist')
        return;

    switch (name) {
        case 'reply':  // 显示快速回复或者引用回复框
        case 'quote':
            showReplyPopup(ele, name);
            break;
        case 'send':  // 切换显示群发信息框(仿微博@功能)
            toggleAtUser(ele);
            break;
        case 'close':  // 关闭快速回复或者引用回复框
            hideReplyPopup();
            break;
        case 'expression':
        case 'emotion':
        case 'upload': // 切换显示指定的面板
            toggleReplyPanel(name);
            break;
        default:       // 默认不处理
            break; 
    }
}

/* Main 函数 */
function main() {
    /* 不在frames中再次执行该脚本 */
    if (window.top != window.self)
        return;

    /* 如果未登录，直接退出 */
    if (document.cookie.indexOf('aspsky') == -1)
        return;

    /* 添加自定义的样式 */
    addCustomizedCSS();

    /* 创建快速回复以及快速引用按钮 */
    createReplyButtons();

    /* 绑定按钮点击事件 */
    $('.reply_button').live('click', function (evt) {
        /* 阻止事件默认行为以及停止向上冒泡 */
        evt.preventDefault();
        evt.stopPropagation();

        /* 激活按钮点击事件 */
        triggerButtonClick(this);
    });

    /* 点击退出按钮隐藏快速回复框 */
    $('#btn_cancel').live('click', hideReplyPopup);

    /* 点击心情面板图标更换 */
    $('#expression_panel img').live('click', function () {
        $('.btn_expression img').attr('src', this.src);
    });

    /* 点击表情插入UBB标签到文本框 */
    $('#emotion_panel img').live('click', function () {
        var insertText = this.src.replace(/(.*?emot(\d+)\.gif)/, "[em$2]");
        var $replyContent = $('#reply_content');

        $replyContent.val(function (index, oldValue) {
            var start = $(this).prop('selectionStart');

            return [
                oldValue.slice(0, start),
                insertText,
                oldValue.slice(start)
            ].join('');
        }).focus();
    });

    /* 捕获文本框的各种事件 */
    $('#reply_content')
        .live('input focus', function () {  // 动态统计文本框字数
            var $replyContent = $(this);

            /* 实时统计字数 */
            var remain = showCharCount($replyContent, $('#reply_cnt_box'));

            /* 已经输入数据 */
            if (remain != MaxTextareaLength)　{
                /* 自动备份数据: 未开始自动备份 */
                if (AutoSaveTimer == -1) {
                    AutoSaveTimer = saveData.periodical(AutoSaveInterval, 
                        window, [$replyContent, true, $('#reply_status_box')]);
                }
            }

            /* 显示回复框底部 */
            $('#reply_footer_container').slideDown(AnimateSpeed);
        })
        .live('blur', function () {
            delayHideNotify($('#reply_cnt_box'), 0);  // 隐藏字数统计框 
        });

    /* 自动备份事件处理 */
    $('.asv_action').live('click', function () {
        var $replyContent = $('#reply_content');
        var $replyStatusBox = $('#reply_status_box');

        /* 清除旧的定时器 */
        clearIntervalTimer();

        if (this.id == 'btn_save')
            saveData($replyContent, false, $replyStatusBox);
        else
            recoverData($replyContent, $replyStatusBox);
    });

    /* 刷新页面之前保存帖子内容 */
    $(window).unload(function () { saveData($('#reply_content'), true); });

    /* 捕获群发输入框的回车事件 */
    $('#reply_send').live('keyup', function (evt) {
        if (this.value && evt.keyCode == 13) { // 按下回车
            var $replyContent = $('#reply_content'), 
                $replyStatusBox = $('#reply_status_box');

            /* 设置消息正文与标题 */
            var messages = '我在帖子"[url=' + getOrigURL(this.quote) +
                '][color=blue]' + this.topic + '[/color][/url]"中@了你,快来看看吧~!';
            var title = 'AtUser Messages from ' + decodeURIComponent(
                document.cookie.replace(/.*username=(.*?)&.*/g, '$1')
            );

            /* 清空旧状态信息 */
            $replyStatusBox.empty();

            /* 依次发送消息 */
            var users = this.value.split(/[，,\s]/);
            $.each(users, function (i, u) {
                if (!u) return;

                sendMessages(u, title, messages, $replyContent, $replyStatusBox);
            });

            toggleAtUser(this);
        }
    });

    /* 状态框在鼠标悬浮时一直保持显示 */
    $('#reply_status_box').live('mouseover', function () {
        clearTimeout(StatusKeepTimer);
    }).live('mouseout', function () { // 移出后延迟隐藏
        StatusKeepTimer = delayHideNotify(this, KeepTime, StatusKeepTimer);
    });

    /* 拖拽对象 */
    var dragObject = null;
    /* 鼠标与拖拽对象之间的偏移 */
    var mouseOffset = null;

    /* 捕获鼠标事件 */
    $(document).mousemove(function(evt) {
        if (!dragObject)
            return;

        /* 动态更新位置样式 */
        $(dragObject).css({
            left: evt.pageX - mouseOffset.left - $(document).scrollLeft(),
            top: evt.pageY - mouseOffset.top - $(document).scrollTop()
        });

        /* 避免拖拽的过程中选中页面上的文本 */
        window.getSelection().removeAllRanges();
    }).mouseup(function(evt) {
        dragObject = null;
    });

    /* 捕获回复框的鼠标按下事件 */
    $('#reply_container').live('mousedown', function (evt) {
        if (evt.target != this)
            return;

        dragObject = this;
        dragObject.style.cursor = 'move';

        var dragObjOffset = $(dragObject).offset();
        mouseOffset = {
            left: evt.pageX - dragObjOffset.left,
            top: evt.pageY - dragObjOffset.top
        };
    });
}

/* 执行main函数 */
main();

})();
