// ==UserScript==
// @id             reply_improved
// @name           Reply Improved
// @version        0.8.1
// @namespace      http://www.cc98.org
// @author         tuantuan <dangoakachan@foxmail.com>
// @include        http://localhost/cc98/*
// @include        http://www.cc98.org/dispbbs.asp*
// @include        http://10.10.98.98/dispbbs.asp*
// @require        http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js
// @run-at         document-end
// ==/UserScript==

(function () {

/* 用户设置(默认) */
var DefaultOptions = {
    autoReply: true,             // 10秒错误后自动读秒回复
    gotoLast: false,             // 回复成功后跳转到最后一页
    reloadTimeout: 0,            // 回复成功后几秒后刷新
    animateSpeed: 500,           // 动画速度
    openInNewtab: false,         // 链接是否在新标签页打开
    promptColor: 'green',        // 查看原帖提示颜色
    promptString: '|查看原帖|',  // 查看提示文字
    removeMultiQuote: true,      // 删除多重引用的内容(仅保留最后一重)
    autoSaveInterval: 30000,     // 自动保存数据间隔(毫秒)
    keepTime: 3000,              // 状态显示保持时间
    errorStatusColor: 'red',     // 错误状态颜色
    normStatusColor: 'black',    // 正常状态颜色
    maxTextareaLength: 16240,    // 文本框的最大输入长度(字节数)

    /* 快速回复框样式 */
    replyPopupStyle: {
        opacity: 1,                                    // 透明度
        width: '56%',                                  // 宽度
        fontSize: '1em',                               // 字体大小
        borderRadius: '5px',                           // 边框圆角
        backgroundColor: '#F4F9FB',                    // 背景颜色
        border: '5px solid transparent',               // 边框
        boxShadow: '0 0 18px rgba(0, 0, 0, 0.4)',      // 框阴影
        fontFamily: 'Verdana, Helvetica, sans-serif'   // 字体
    },

    /* 文本框样式 */
    textAreaStyle: {
        height: '270px',              // 高度
        padding: '0.4em',             // 内边距
        lineHeight: '1.6em',          // 行间距
        border: '1px solid #ccc',     // 边框
        backgroundColor: '#fefefe'    // 背景颜色
    },

    /* 状态框样式 */
    statusBoxStyle: {
        opacity: 0.8,                 // 透明度
        padding: '2px 5px',           // 内边距
        lineHeight: '2.0em',          // 行距
        borderRadius: '2px',          // 边框圆角
        backgroundColor: '#fffef9',   // 背景色
        border: '1px solid #cccccc'   // 边框
    },

    /* 字数统计框样式 */
    countBoxStyle: {
        opacity: 0.6,                 // 透明度
        fontWeight: 'bold',           // 字体粗细
        padding: '2px 4px',           // 内边距
        borderRadius: '5px',          // 边框圆角
        backgroundColor: '#d3d7d4',   // 背景色
        border: '1px solid #33a3dc'   // 边框
    }
};

/* 全局设置 */
var Options;

/* 全局定时器 */
var StatusTimer = -1;
var AutoSaveTimer = -1;

/* 拖拽对象 */
var DragObject = null;
/* 鼠标与拖拽对象之间的偏移 */
var MouseOffset = null;

/* 页面相关的参数字典 */
var PageArgs = null;
/* 记录表单Post部分内容 */
var PartialFormData = '';

/* 假设一个大数作为帖子的最后一页 */
var LastPageN = 32767;

/* 图片按钮地址 (普通地址或者Base64编码)*/
ImageURLs = {
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

/* 字符串扩展：求字符串的总字节数 */
String.prototype.bytes = function () {
    var ret = 0;

    for (var i = 0, len = this.length; i < len; i++) {
        if (this.charCodeAt(i) < 0 || this.charCodeAt(i) > 255)
            ret += 2;
        else
            ret += 1;
    }

    return ret;
} 

/* 函数类扩展：周期执行某个函数 (参考 Moontools)*/
Function.prototype.periodical = function (periodical, bind, args) {
    var self = this;

    return setInterval(function () {
        self.apply(bind, args || []);
    }, periodical);
};

/* sessionStorage操作函数 */
function setValue(key, val) { sessionStorage.setItem(key, val); }
function getValue(key, def) { return sessionStorage.getItem(key, def); }
function delValue(key) { sessionStorage.removeItem(key); }

/* 选项存储与加载 */
function saveOptions(opt) {
    if (opt === undefined)
        return;

    opt = $.extend({}, Options, opt);
    localStorage.setItem('rimopt', JSON.stringify(opt));
}

function loadOptions() {
    var storedOptions = localStorage.getItem('rimopt', '');

    return storedOptions ? JSON.parse(storedOptions) : DefaultOptions;
}

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

/* 返回帖子的最后一页 */
function getLastPageURL(url)
{
    return url.replace(/(star=)\d*/, '$1' + LastPageN)
        .replace(/#.*/, "#bottom");
}

/* 解析获得与本页面相关的参数 */
function parsePageArgs() {
    var ret = {}, args, name, val, cookie, match;

    /* 帖子楼层数数 */
    ret.floor = location.hash.slice(1) || '1';

    /* 获取URL地址查询参数 */
    args = location.search.toLowerCase().slice(1).split('&');
    for (var i = 0, len = args.length; i < len; i++) {
        [name, val] = args[i].split('=');
        ret[name] = val;
    }

    /* 获取帖子标题和版块名称 */
    ret.title = document.title.replace(/ » CC98论坛/, '');
    ret.board = $('.tableBorder2 td[valign] a[href*="list.asp"]')
        .eq(1).text();

    /* 获取用户名与加密过的密码 */
    cookie = document.cookie;

    match = cookie.match(/username=([^&;]*)/);
    ret.user = match ? match[1] : '';

    match = cookie.match(/password=([^&;]*)/);
    ret.passwd = match ? match[1] : '';

    return ret;
}

/* 添加自定义的样式 */
function addCustomizedCSS() {
    /* 添加到Head节点 */
    $('<style type="text/css"/>').appendTo('head').html('\
        .reply_button img, .panel img {\
            width: 15px;\
            height: 15px;\
            border: none;\
            cursor: pointer;\
            vertical-align: middle;\
        }\
        .btn_reply, .btn_quote {\
            margin-left: 5px;\
        }\
        .btn_close img {\
            opacity: 0.3;\
        }\
        #reply_container {\
            display: none;\
            position: fixed;\
        }\
        #reply_container.dragged {\
            box-shadow: 0 0 36px rgba(0, 0, 0, 0.9);\
        }\
        #reply_header_container {\
            margin-bottom: 10px;\
        }\
        #reply_subjectbar {\
            height: 27px;\
            position: relative;\
        }\
        .reply_input {\
            width: 100%;\
            height: 27px;\
            padding: 4px;\
            background-color: #fefefe;\
            border: 1px solid #ccc;\
        }\
        .btn_send, #reply_panel_button {\
            position: absolute;\
            background-color: #eee;\
            border: 1px solid #ccc;\
        }\
        .btn_send {\
            left: 0px;\
            top: 0px;\
            padding: 5px;\
        }\
        #reply_panel_button {\
            top: 0px;\
            right: 0px;\
            padding: 4px;\
        }\
        #reply_panel_button .reply_button {\
            margin: 0 3px;\
        }\
        #reply_panel_container {\
            margin: 0 5px;\
        }\
        .panel .label {\
            margin-right: 5px;\
            float: left;\
        }\
        .panel img {\
            margin-right: 5px;\
        }\
        #reply_content_container {\
            position: relative;\
            margin-top: 10px;\
        }\
        #reply_content { \
            width: 100%;\
        }\
        #reply_footer_container { \
            margin-top: 5px;\
            text-align: right;\
            display: none;\
            height: 25px;\
        }\
        #reply_actions {\
            padding-right: 8px;\
        }\
        .reply_action {\
            cursor: pointer;\
            font-size: 1em;\
            font-weight: bold;\
            border-radius: 5px;\
            margin-left: 10px;\
            padding: 2px 10px;\
            border: 1px solid #c4c4c4;\
            font-family: Verdana, Helvetica, sans-serif;\
            box-shadow: 0 0 3px rgba(120, 80, 100, 0.4);\
        }\
        #daily_actions {\
            float: left;\
            padding-top: 5px;\
        }\
        #daily_actions span {\
            cursor: pointer;\
            font-size: 0.9em;\
            padding: 2px 8px;\
            border-right: 1px solid #999;\
        }\
        #reply_status_box,\
        #reply_cnt_box {\
            display: none;\
            position: absolute;\
        }\
        #reply_status_box font {\
            display: block;\
        }\
        .hidden {\
            display: none;\
        }\
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
    var html = [
        '<a class="reply_button btn_reply" title="快速回复">',  // 快速回复按钮
        '<img alt="快速回复" src=""/>',
        '</a>',

        '<a class="reply_button btn_quote" title="快速引用">',  // 快速引用按钮
        '<img alt="快速引用" src=""/>',
        '</a>'
    ].join('');

    $('img[src$="message.gif"]').closest('td')                  // 查找插入位置
        .append(html)
        .find('.reply_button img').attr('src', function () {    // 设定按钮的地址
            return getButtonURL(this); 
        });
}

/* 创建快速回复弹出窗口 */
function createReplyPopup() {
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
        '<div id="daily_actions">',
        '<span id="btn_save">保存数据</span>',     // 保存数据
        '<span id="btn_recover">恢复数据</span>',  // 恢复数据
        '<span id="btn_instime">插入时间</span>',  // 插入时间
        '</div>',
        '<div id="reply_actions">',
        '<input type="button" id="btn_submit" class="reply_action" value="回复"/>',  // 回复
        '<input type="button" id="btn_preview" class="reply_action" value="预览"/>',  // 预览
        '<input type="button" id="btn_cancel" class="reply_action" value="退出"/>',   // 退出
        '</div>',
        '</div>'
    ].join(''));

    return $replyContainer;
}

/* 处理引用的内容 */
function processQuoteContent(value) {
    /* 正则表达式定义 */
    var rmultiquote = 
        /(\[quotex?\][\s\S]*?)\[quotex?\][\s\S]*\[\/quotex?\]([\s\S]*?\[\/quotex?\])/gi;
    var rbegdupblank = /\s*\n*(\[quotex?\])\s*\n*/i;
    var renddupblank = /\s*\n*(\[\/quotex?\])\s*\n*/i;
    var remotubb = /(\[em\d{2}\])/gi;
    var rupldubb = /(\[upload=[^,]*?)(,0)?(\])/gi;

    var insPos, insContent;

    /* 删除多余的空行 */
    value = value.replace(rbegdupblank, '$1\n').replace(renddupblank, '\n\n$1\n');

    /* 删除多重引用内容 */
    if (Options.removeMultiQuote) 
        value = value.replace(rmultiquote, '$1$2');

    /* 查找插入位置 */
    insPos = value.indexOf('[/b]') + 4;

    /* 构造插入内容 */
    insContent = [ 
        '[url=', PageArgs.quote, ',t=', Options.openInNewtab ? 'blank' : 'self',
        '][color=', Options.promptColor, '][b]', Options.promptString, 
        '[/b][/color][/url]\n'
    ].join('');

    /* 拼接内容 */
    return value.substring(0, insPos) + insContent + value.substring(insPos)
        .replace(remotubb, "[noubb]$1[/noubb]")  // 不解释 [em**] 标签
        .replace(rupldubb, "$1,1$3");  // 不自动展开图片
}

/* 动态显示回复文本框 */
function showReplyPopup(ele, name) {
    var $replyContainer, $replyContent, $btn;
    var quoteURL, style;
    
    $replyContainer = createReplyPopup();
    $btn = $(ele);

    /* 调整回复框高度 */
    $replyContent = $replyContainer.find('#reply_content').css(Options.textAreaStyle)
        .attr('placeholder', '请输入回复内容, 最多可输入' + Options.maxTextareaLength + '字');

    /* 扩展用户样式 */
    style = {
        width: 'auto',
        left: function () { 
            return ($(window).width() - $(this).outerWidth()) / 4 * 3;
        },
        top: function () {
            return ($(window).height() - $(this).outerHeight()) / 3 * 2;
        }
    };

    style = $.extend({}, style, Options.replyPopupStyle);
    $replyContainer.css(style);

    /* 填充页面元素 */
    $replyContainer
        .find('.reply_button img')
            .attr('src', function () { return getButtonURL(this); })  // 设定按钮地址
        .end()
        .find('#reply_subject').val('Re: ' + PageArgs.title).end()  // 设定主题
        .find('#reply_send')
            .attr('placeholder', '用户名以逗号或者空格相隔, 按回车发送。例如: u1, u2 u3')
        .end();

    /* 显示回复框 */
    $replyContainer.slideDown(Options.animateSpeed, function () {
        $replyContainer.find('.reply_input').css({    // 微调回复主题框
            paddingLeft: function (index, oldValue) {
                var offset = $replyContainer.find('.btn_send').outerWidth();
                var preOffset = parseFloat(oldValue) || 0;
                
                return (preOffset > offset) ? preOffset : preOffset + offset;
            },
            width: function (index, oldValue) {
                var $replyBtnPanel = $replyContainer.find('#reply_panel_button');
                var btnNum = $replyBtnPanel.children().length;
                var btnWidth = $replyBtnPanel.width() / btnNum;

                return $(this).parent().width() - btnWidth * (1 + btnNum);
            }
        });
    });

    /* 找到引用的地址 */
    quoteURL = $btn.siblings().filter('a[href*="reannounce.asp"]').attr('href');
    PageArgs.quote = getOrigURL(quoteURL);

    /* 如果是快速引用类型 */
    if (quoteURL && name == 'quote') {
        var rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;

        /* 获取引用的内容 */
        $.get(quoteURL, function (data) {
            var value = $('<div>').append(data.replace(rscript, ''))
                .find('textarea#content').val();

            $replyContent.val(processQuoteContent(value));
        });
    }

    return $replyContainer;
}

/* 隐藏快速回复框 */
function hideReplyPopup() {
    var $replyContainer = $('#reply_container');

    if ($replyContainer.is(':hidden'))
        return;

    /* 清除旧的定时器 */
    clearIntervalTimer();

    /* 退出前备份数据 */
    saveData($replyContainer.find('#reply_content'), true);

    $replyContainer
        .find('#reply_footer_container')
            .slideUp(Options.animateSpeed)
        .end()
    .slideUp(Options.animateSpeed);
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
        PageArgs.boardid,
        '" name="uploadframe"></iframe>'
    ].join('');
}

/* 创建快速回复框面板 */
function createReplyPanel(name) {
    var html;

    switch (name) {
        case 'emotion':    // 表情面板
            html = createEmotPanel();
            break;
        case 'expression': // 心情面板
            html = createExprPanel();
            break;
        case 'upload':     // 上传面板
            html = createUpldPanel();
            break;
        default:
            html = '面板创建失败';
    }

    return html;
}

/* 切换显示快速回复框面板 */
function toggleReplyPanel(name) {
    /* 获取待显示的面板对象 */
    var $panel = $('#' + name + '_panel');

    /* 若面板未创建则填充面板元素 */
    if ($panel.is(':empty')) {
        $panel.html(createReplyPanel(name));
    }

    /* 控制面板的显示与隐藏 */
    $panel.siblings().addClass('hidden');
    $panel.toggleClass('hidden');
}

/* 显示通知信息 */
function showNotify(content, box, style, type, append) {
    if (!(box instanceof jQuery))
        box = $(box);

    /* 状态类型：错误或者正常 */
    type = (type || 'norm') + 'StatusColor';
    content = $('<font color="' + Options[type] + '"/>').wrapInner(content);

    if (append) // 追加内容
        box.append(content);
    else  // 填充内容
        box.html(content);

    /* 设定样式并显示内容 */
    //box.css(style).fadeTo(Options.animateSpeed, style.opacity || 1);
    box.css(style).show();
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
        box.fadeOut(Options.animateSpeed, function() {
            $(this).empty();
        });
    }, (keepTime||0) + Options.animateSpeed);
}

/* 显示状态信息 */
function showStatus(status, box, style, keepTime, append, type) {
    /* 扩展用户定义样式 */
    style = $.extend({}, style, Options.statusBoxStyle);

    showNotify(status, box, style, type, append);

    /* 延迟隐藏信息 */
    StatusTimer = delayHideNotify(box, keepTime, StatusTimer);
}

/* 动态显示文本框的剩余字数 */
function showCharCount(ta, cntBox) {
    /* 获取实际的jQuery对象 */
    if (!(ta instanceof jQuery))
        ta = $(ta);

    var remain, style, type;

    /* 统计剩余字数 */
    remain = Options.maxTextareaLength - ta.val().bytes();

    /* 显示在右下方 */
    style = setAbsPosition(cntBox, ta, 'right', 'bottom');
    style = $.extend({}, style, Options.countBoxStyle);

    /* 超出字数限制时，提示类型为错误 */
    type = (remain >= 0) ? 'norm' : 'error';
    showNotify(remain + '字', cntBox, style, type);

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
function sendMessages(user, title, message, ta, box) {
    /* 构建post数据 */
    var formData = 'touser=' + encodeURIComponent(user) + '&title=' 
        + encodeURIComponent(title) + '&message=' + encodeURIComponent(message);

    /* Post */
    $.post('messanger.asp?action=send', formData, function (data) {
        var status, style, type;

        /* 显示在正中间 */
        style = setAbsPosition(box, ta, 'middle', 'middle');

        if (data.indexOf('操作成功') != -1) { // 发送成功
            status = '✔ 消息成功发送给"' + user + '"';
            type = 'norm'
        } else { // 发送失败
            status = '✘ 消息未能发送给"' + user + '"';
            type = 'error';
        }

        showStatus(status, box, style, Options.keepTime, true, type);
    });
}

/* 获取存储Key值 */
function getKey() { return 'cc98bbscontent_tid' + PageArgs.id; }

/* 备份文本框数据 */
function saveData(ta, auto, statusBox) {
    if (!(ta instanceof jQuery))
        ta = $(ta);

    var data, status, style;

    data = ta.val();
    status = auto ? '自动: ' : '手动: ';

    if (data) { // 保存数据
        setValue(getKey(), data);
        status += '帖子内容保存于' + (new Date()).toLocaleTimeString();
    } else { // 放弃
        status += '帖子内容为空, 放弃备份';
        clearIntervalTimer(AutoSaveTimer);
    }

    if (statusBox === undefined)
        return;

    /* 显示在左下方 */
    style = setAbsPosition(statusBox, ta, 'left', 'bottom');
    showStatus(status, statusBox, style, Options.keepTime);
}

/* 恢复文本框数据 */
function recoverData(ta, statusBox) {
    var data, status, style;

    /* 获取上次保存的数据 */
    data = getValue(getKey(), '');

    /* 恢复数据过程 */
    if (data && (!ta.val() || confirm('确定要恢复数据吗'))) {
        status = '成功恢复数据';

        if (!(ta instanceof jQuery))
            ta = $(ta);

        ta.val(data);
    } else
        status = data ? '放弃恢复数据' : '没有可以恢复的数据';

    /* 显示在左下方 */
    style = setAbsPosition(statusBox, ta, 'left', 'bottom');
    showStatus(status, statusBox, style, Options.keepTime);
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

/* 发表回复成功后的回调函数 */
function postOnSuccess(data)
{
    var $replyContainer, $replyContent, $replyStatusBox;
    var status, style;
    
    $replyContainer = $('#reply_container');
    $replyContent = $replyContainer.find('#reply_content');
    $replyStatusBox = $replyContainer.find('#reply_status_box');

    /* 显示在正中间 */
    style = setAbsPosition($replyStatusBox, $replyContent, 'middle', 'middle');

    if (data.indexOf('本页面将在3秒后自动返回') != -1) {
        if (Options.reloadTimeout == 0)
            status = '回复帖子成功, 页面将会立即刷新';
        else
            status = '回复帖子成功，将会在' + Options.reloadTimeout +
                '秒后自动刷新';

        showStatus(status, $replyStatusBox, style, Options.keepTime, true);

        setTimeout(function() {
            var url = PageArgs.quote;

            if (Options.gotoLast)
                url = getLastPageURL(url);

            location.href = url;
            location.reload();
        }, Options.reloadTimeout);

        return;
    }

    status = data.match(/产生错误的原因：([\w\W]+)请您仔细阅读了/)[1]
        .replace(/\n/g, " ").replace(/<[^>]*?>/g, "").replace(/\s*(.*)\s*/, "$1");

    showStatus(status, $replyStatusBox, style, Options.keepTime, true, 'error');

    if (status.indexOf('本论坛限制发贴距离时间为10秒') != -1) {
        var $submitBtn = $replyContainer.find('#btn_submit')
        var value = $submitBtn.val();

        $submitBtn.value = '[10秒]';

        for (var i = 9; i >= 1; i--) {
            setTimeout((function(i) {
                return function() { $submitBtn.val('[' + i + '秒]'); }
            })(i), (10 - i) * 1000);
        }

        /* Restore submit button */
        setTimeout(function() {
            /* Restore submit button value */
            $submitBtn.val(value);

            if (Options.autoReply) { /* Auto reply */
                postReply();
            } else { /* Enable submit button */
                $submitBtn.prop('disabled', false);
            }
        }, 10 * 1000);

        return;
    }
}

/* 发表回复 */
function postReply()
{
    var $replyContainer, $replyContent;
    var formData, postURL, face, content;

    $replyContainer = $('#reply_container');
    $replyContent = $replyContainer.find('#reply_content');

    content = '\n' + getRelativeURL($replyContent.val());

    face = $replyContainer.find('.btn_expression img').attr('src');
    face = face.replace(/(.*\/)/, '');

    postURL = 'SaveReAnnounce.asp?method=fastreply&BoardID=' + PageArgs.boardid;

    formData = [
        ['followup', PageArgs.id],
        ['rootid', PageArgs.id],
        ['star', PageArgs.star],
        ['username', PageArgs.user],
        ['passwd', PageArgs.passwd],
        ['content', encodeURIComponent(content)],
        ['expression', face],
        ['totalusetable', 'bbs1'],
        ['subject', $replyContainer.find('#reply_subject').val()],
        ['signflag', 'yes']
    ];

    for (var i = 0, len = formData.length; i < len; i++)
        formData[i] = formData[i].join('=');

    $.post(postURL, formData.join('&'), postOnSuccess);
}

/* 触发回复动作事件 */
function triggerActionClick(ele)
{
    switch (ele.id) {
        case 'btn_cancel':
            hideReplyPopup();
            break;
        case 'btn_submit':
            ele.disabled = true;
            postReply();
            break;
        case 'btn_preview':
            alert('该功能还未实现');
            break;
        default:
            break;
    }
}

/* 插入内容到文本框中 */
function insertIntoTextarea(insertText, ta)
{
    if (!(ta instanceof jQuery))
        ta = $(ta);

    ta.val(function (index, oldValue) {
        var start = this.selectionStart;

        return [
            oldValue.slice(0, start),
            insertText,
            oldValue.slice(start)
        ].join('');
    }).focus();
}

/* 事件处理函数 */
function handleEvents() {
    /* 捕获回复按钮点击事件 */
    $('.reply_button').live('click', function (evt) {
        /* 阻止事件默认行为 */
        evt.preventDefault();

        /* 激活按钮点击事件 */
        triggerButtonClick(this);
    });

    /* 捕获心情图标点击事件(替换面板按钮图标)*/
    $('#expression_panel img').live('click', function () {
        $('.btn_expression img').attr('src', this.src);
    });

    /* 点击表情插入UBB标签到文本框 */
    $('#emotion_panel img').live('click', function () {
        var insertText = this.src.replace(/(.*?emot(\d+)\.gif)/, "[em$2]");
        insertIntoTextarea(insertText, '#reply_content');
    });

    /* 捕获文本框的各种事件 */
    $('#reply_content').live('input focus', function () {  // 动态统计文本框字数
        var $replyContainer, $replyContent, $actionBtn, remain;

        $replyContainer = $('#reply_container')
        $replyContent = $(this);

        /* 实时统计字数 */
        remain = showCharCount($replyContent, $('#reply_cnt_box'));

        /* 显示回复框底部 */
        $replyContainer.find('#reply_footer_container').slideDown(Options.animateSpeed);
        $actionBtn = $replyContainer.find('#btn_submit, #btn_preview')

        /* 如果未输入数据则禁用动作按钮 */
        if (remain == Options.maxTextareaLength) {
            $actionBtn.prop('disabled', true);
            return;
        }

        /* 激活动作按钮 */
        $actionBtn.prop('disabled', false);

        /* 已经开始自动备份则退出 */
        if (AutoSaveTimer != -1)
            return;

        AutoSaveTimer = saveData.periodical(
            Options.autoSaveInterval, window,
            [$replyContent, true, $('#reply_status_box')]
        );
    }).live('blur', function () {
        delayHideNotify($('#reply_cnt_box'), 0);  // 隐藏字数统计框 
    });

    /* 备份与恢复等日常操作 */
    $('#btn_save, #btn_recover').live('click', function () {
        var $replyContainer = $('#reply_container');
        var $replyContent = $replyContainer.find('#reply_content');
        var $replyStatusBox = $replyContainer.find('#reply_status_box');

        /* 清除旧的定时器 */
        clearIntervalTimer();

        if (this.id == 'btn_save')
            saveData($replyContent, false, $replyStatusBox);
        else
            recoverData($replyContent, $replyStatusBox);
    });

    /* 插入时间 */
    $('#btn_instime').live('click', function() {
        insertIntoTextarea((new Date()).toLocaleString(), '#reply_content');
    });

    /* 刷新页面之前保存帖子内容 */
    $(window).unload(function () { 
        saveData($('#reply_content'), true); 
    });

    /* 捕获群发输入框的回车事件 */
    $('#reply_send').live('keyup', function (evt) {
        if (!this.value || evt.keyCode != 13)
            return;

        var $replyContent, $replyStatus, messages, title;

        $replyContent = $('#reply_content'), 
        $replyStatusBox = $('#reply_status_box');

        /* 设置消息正文与标题 */
        messages= [
            '我在帖子"[url=', PageArgs.quote, '][color=blue]', PageArgs.board,
            '->', PageArgs.title, '[/color][/url]"中@了你,快来看看吧~!',
        ].join('');

        title = '来自' + decodeURIComponent(PageArgs.user) + '的At信息';

        /* 清空旧状态信息 */
        $replyStatusBox.empty();

        /* 依次发送消息 */
        $.each(this.value.split(/[，,\s]/), function (i, u) {
            if (!u) return;

            sendMessages(u, title, messages, $replyContent, $replyStatusBox);
        });

        toggleAtUser(this);
    });

    /* 状态框在鼠标悬浮时一直保持显示 */
    $('#reply_status_box').live('mouseover', function () {
        clearTimeout(StatusTimer);
    }).live('mouseout', function () { // 移出后延迟隐藏
        StatusTimer = delayHideNotify(this, Options.keepTime, StatusTimer);
    });

    /* 捕获鼠标事件 */
    $(document).mousemove(function(evt) {
        if (!DragObject)
            return;

        /* 动态更新位置样式 */
        $(DragObject).css({
            left: evt.pageX - MouseOffset.left - $(document).scrollLeft(),
            top: evt.pageY - MouseOffset.top - $(document).scrollTop(),
        }).addClass('dragged');

        /* 避免拖拽的过程中选中页面上的文本 */
        window.getSelection().removeAllRanges();
    }).mouseup(function(evt) {
        if (DragObject) {
            $(DragObject).removeClass('dragged');
            DragObject = null;
        }
    });

    /* 捕获回复框的鼠标按下事件 */
    $('#reply_container').live('mousedown', function (evt) {
        if (evt.target != this)
            return;

        var dragObjOffset;

        DragObject = this;
        DragObject.style.cursor = 'move';
        dragObjOffset = $(DragObject).offset();

        MouseOffset = {
            left: evt.pageX - dragObjOffset.left,
            top: evt.pageY - dragObjOffset.top
        };
    });

    /* 捕获回复动作事件 */
    $('.reply_action').live('click', function() {
        triggerActionClick(this);
    });
}

/* Main 函数 */
function main() {
    /* 不在frames中再次执行该脚本 */
    if (window.top != window.self)
        return;

    /* 加载用户设置 */
    Options = loadOptions();
    /* 解析页面参数 */
    PageArgs = parsePageArgs();

    /* 如果未登录，直接退出 */
    if (!PageArgs.user)
        return;
    
    /* 添加自定义的样式 */
    addCustomizedCSS();
    /* 创建快速回复以及快速引用按钮 */
    createReplyButtons();

    /* 监听事件并处理 */
    handleEvents();
}

/* 执行main函数 */
main();

})();
