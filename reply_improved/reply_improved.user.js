// ==UserScript==
// @id             reply_improved
// @name           Reply Improved
// @version        0.8.9
// @namespace      http://www.cc98.org
// @author         tuantuan <dangoakachan@foxmail.com>
// @include        http://localhost/cc98/*
// @include        http://www.cc98.org/dispbbs.asp*
// @include        http://10.10.98.98/dispbbs.asp*
// @require        http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js
// @description    Improve the CC98's native reply functions.
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
    autoPreview: true,           // 开启实时预览功能
    previewTriggerPattern:       // 实际预览触发模式
        '(\\[/[a-z]{1,6}\\]|[^0-9a-z\u4E00-\u9FA5]|\n)$',  // UBB标签或者非中文数字英文符号
    errorStatusColor: 'red',     // 错误状态颜色
    normStatusColor: 'black',    // 正常状态颜色
    maxTextareaLength: 16240,    // 文本框的最大输入长度(字节数)
    maxSubjectLength: 100,        // 主题框的最大输入长度(字节数)

    /* 快速回复框样式 */
    popupStyle: {
        opacity: 1,                                    // 透明度
        width: '56%',                                  // 宽度
        fontSize: '1em',                               // 字体大小
        borderRadius: '5px',                           // 边框圆角
        backgroundColor: '#F4F9FB',                    // 背景颜色
        border: '5px solid transparent',               // 边框
        boxShadow: '0 0 18px rgba(0, 0, 0, 0.4)',      // 框阴影
        fontFamily: 'Verdana, Helvetica, sans-serif'   // 字体
    },

    /* 面板栏样式 */
    panelStyle: {
        width: '30%',
        opacity: 0.8,                                  // 透明度
        borderRadius: '5px',                           // 边框圆角
        backgroundColor: '#F4F9FB',                    // 背景颜色
        border: '5px solid transparent',               // 边框
        boxShadow: '0 0 18px rgba(0, 0, 0, 0.4)',      // 框阴影
        padding: '5px'
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
var Opts = null;
/* 与本主题相关的参数字典 */
var Args = null;

/* 全局定时器 */
var StatusTimer = -1;
var AutoSaveTimer = -1;

/* 拖拽对象 */
var DragObject = null;
/* 鼠标与拖拽对象之间的偏移 */
var MouseOffset = null;

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
    /* 心情按钮 */
    expr: 'face/face7.gif',
    /* 表情按钮 */
    emot: 'emot/simpleemot/emot88.gif',
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

/* URL信息编码与解码函数 */
function encode(str) { return encodeURIComponent(str); }
function decode(str) { return decodeURIComponent(str); }

/* 功能提示函数 */
function unimplement()
{
    alert('该功能还未实现');
}

/* 选项存储与加载 */
function saveOptions(opt) {
    if (opt === undefined)
        return;

    $.extend(Opts, opt);
    localStorage.setItem('rimopt', JSON.stringify(Opts));
}

function loadOptions() {
    var storedOptions = localStorage.getItem('rimopt', '');

    return storedOptions ? JSON.parse(storedOptions) : DefaultOptions;
}

/* HTML5 dataset 属性读方法 */
function getDataSet(ele, name) {
    if (ele.dataset)
        return ele.dataset[name];
    else
        return ele.getAttribute('data-' + name);
}

/* 从HTMl代码串中查询指定选择器的片断 */
function queryHTMLBySelector(raw, selector)
{
    /* 匹配script标签内容 */
    var rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;

    /* 临时创建div标签容纳所选择的片断 */
    return $('<div/>').append(raw.replace(rscript, '')) // 去除script部分
        .find(selector);
}

/* 返回相对地址 */
function getRelativeURL(url) {
    return url.replace(/http:\/\/www\.cc98\.org\/([a-z])/g, '$1');
}

/* 返回原帖地址 */
function getOrigURL(url) {
    return getRelativeURL(url).replace(/reannounce/, 'dispbbs')
        .replace(/reply.*?&/g, '').replace(/&bm=/, '#');
}

/* 返回帖子的最后一页 */
function getLastPageURL(url)
{
    return url.replace(/(star=)\d*/, '$1' + LastPageN)
        .replace(/#.*/, "#bottom");
}

/* 解析获得与本主题相关的参数 */
function parseTopicArgs() {
    var ret = {}, args, cookie, match;

    /* 帖子楼层数数 */
    ret.floor = location.hash.slice(1) || '1';

    /* 获取URL地址查询参数 */
    args = location.search.toLowerCase().slice(1).split('&');
    for (var i = 0, len = args.length, arg; i < len; i++) {
        arg = args[i].split('=');
        ret[arg[0]] = arg[1];
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
    $('<style type="text/css"/>').appendTo('head').text('\
        .rim_btn {\
            cursor: pointer;\
            text-decoration: none;\
        }\
        .rim_btn:not(:last-of-type) {\
            margin-right: 5px;\
        }\
        .rim_btn_img, .rim_panel img {\
            width: 15px;\
            height: 15px;\
            border: none;\
            vertical-align: middle;\
        }\
        #rim_popup {\
            position: fixed;\
            cursor: move;\
        }\
        .dragged {\
            opacity: 0.7 !important;\
            box-shadow: 0 0 36px rgba(0, 0, 0, 0.9) !important;\
        }\
        #rim_header {\
            margin-bottom: 10px;\
            position: relative;\
            text-align: right;\
        }\
        #rim_subjectbar {\
            position: relative;\
        }\
        .rim_input {\
            width: 100%;\
            height: 27px;\
            padding: 2px;\
            background-color: #fefefe;\
            border: 1px solid #ccc;\
        }\
        #rim_ltoolbar, #rim_mtoolbar,\
        #rim_rtoolbar {\
            top: 0px;\
            height: 17px;\
            cursor: auto;\
            padding: 4px;\
            position: absolute;\
            border: 1px solid #ccc;\
        }\
        #rim_ltoolbar, #rim_mtoolbar {\
            left: 0px;\
            background-color: #eee;\
        }\
        #rim_mtoolbar {\
            border-right-width: 0;\
        }\
        #rim_rtoolbar {\
            right: 0px;\
            border-right-width: 0;\
        }\
        .btn_close {\
            opacity: 0.3;\
        }\
        .rim_panel {\
            cursor: auto;\
            position: absolute;\
        }\
        .rim_panel img {\
            cursor: pointer;\
            margin: 1px;\
            padding: 3px;\
            border: 1px solid #ccc;\
        }\
        .rim_panel img:hover {\
            background: #fff;\
        }\
        #rim_contentbox {\
            position: relative;\
            margin-top: 10px;\
        }\
        #rim_content { \
            width: 100%;\
        }\
        #rim_statusbox,\
        #rim_cntbox {\
            display: none;\
            position: absolute;\
        }\
        #rim_statusbox font {\
            display: block;\
        }\
        #rim_footer { \
            margin-top: 5px;\
            text-align: right;\
            height: 25px;\
        }\
        #rim_actbar {\
            padding-right: 8px;\
        }\
        .rim_action {\
            font-size: 1em;\
            cursor: pointer;\
            font-weight: bold;\
            margin-left: 10px;\
            padding: 2px 10px;\
            border-radius: 5px;\
            border: 1px solid #c4c4c4;\
            box-shadow: 0 0 3px rgba(120, 80, 100, 0.4);\
            font-family: Verdana, Helvetica, sans-serif;\
        }\
        #rim_opbar {\
            float: left;\
            padding-top: 5px;\
        }\
        #rim_opbar span {\
            cursor: pointer;\
            font-size: 0.9em;\
            padding: 2px 8px;\
            border-right: 1px solid #999;\
        }\
        #rim_previewbox {\
            margin-top: 5px;\
            border: 1px solid #ccc;\
            padding: 5px;\
        }\
        .hidden {\
            display: none;\
        }\
    ');
}

/* 返回指定按钮的图片地址 */
function getBtnURL(ele) {
    return ImageURLs[getDataSet(ele, 'name')];
}

/* 创建快速回复以及快速引用按钮 */
function createReplyBtns() {
    var html = [
        '<a class="rim_btn btn_reply" title="快速回复">',  // 快速回复按钮
        '<img class="rim_btn_img" data-name="reply" alt="快速回复" src=""/>',
        '</a>',

        '<a class="rim_btn btn_quote" title="快速引用">',  // 快速引用按钮
        '<img class="rim_btn_img" data-name="quote" alt="快速引用" src=""/>',
        '</a>'
    ].join('');

    $('a[onclick*="messanger.asp"]').parent('td')         // 查找插入位置
        .append(html).find('.rim_btn_img')
        .attr('src', function () {    // 设定按钮的地址
            return getBtnURL(this); 
        });
}

/* 创建快速回复弹出窗口 */
function createReplyPopup() {
    var $popup = $('#rim_popup'), style;

    /* 若已经添加到文档中 */
    if ($popup.length != 0)
        return $popup;

    /* 创建回复框容器DIV */
    $popup = $('<div id="rim_popup"/>').appendTo('body');

    /* 填充回复框界面骨架 */
    $popup.html([
        '<div id="rim_header">',   // 回复框头部
        '<div id="rim_subjectbar">',  // 回复框主题栏
        '<input type="text" id="rim_subject" class="rim_input"/>',  // 回复框主题
        '<input type="text" id="rim_sms" class="rim_input hidden"/>',  // 群发信息输入框
        '<div id="rim_mtoolbar">',
        '<a class="rim_btn btn_send">',  // 群发信息
        '<img class="rim_btn_img" data-name="send" alt="点击群发信息"/>',
        '</a>',
        '</div>',
        '<div id="rim_rtoolbar">',  // 回复面板按钮
        '<a class="rim_btn btn_close" title="关闭">',  // 回复框关闭按钮
        '<img class="rim_btn_img" data-name="close" alt="关闭"/>',
        '</a>',
        '</div>',
        '</div>',

        '<div id="rim_ltoolbar">',
        '<a class="rim_btn btn_expr" title="发帖心情">',  // 发帖心情按钮
        '<img class="rim_btn_img" data-name="expr" alt="发帖心情"/>',
        '</a>',
        '<a class="rim_btn btn_emot" title="插入表情">',  // 插入表情按钮
        '<img class="rim_btn_img" data-name="emot" alt="插入表情"/>',
        '</a>',
        '</div>',
        '</div>',

        '<div id="rim_panelbar">',  // 回复框面板
        '<div class="rim_panel hidden" id="expr_panel"/>',  // 心情面板
        '<div class="rim_panel hidden" id="emot_panel"/>',  // 表情面板
        '</div>',

        '<div id="rim_contentbox">',  // 回复框内容
        '<textarea id="rim_content"/>',  // 回复输入框
        '<div id="rim_cntbox"/>',  // 字数统计
        '<div id="rim_statusbox"/>',  // 字数统计
        '</div>',

        '<div id="rim_footer">',  // 回复框尾部
        '<div id="rim_opbar">',   // 日常操作栏
        '<span id="btn_save">保存数据</span>',     // 保存数据
        '<span id="btn_recover">恢复数据</span>',  // 恢复数据
        '<span id="btn_instime">插入时间</span>',  // 插入时间
        '</div>',
        '<div id="rim_actbar">',  // 回复动作栏
        '<input type="button" id="btn_submit" class="rim_action" value="回复"/>',  // 回复
        '<input type="button" id="btn_preview" class="rim_action" value="预览"/>',  // 预览
        '<input type="button" id="btn_cancel" class="rim_action" value="退出"/>',   // 退出
        '</div>',
        '</div>',

        '<div id="rim_previewbox" class="hidden"/>',  // 预览框
    ].join(''));

    /* 微调主题栏样式 */
    $popup.find('#rim_subjectbar').css({
        marginLeft: function (index, oldValue) {
            var $toolbar, btnNum, btnWidth, offset, preOffset;

            $toolbar = $popup.find('#rim_ltoolbar'); 
            btnNum = $toolbar.children().length;
            btnWidth = $toolbar.outerWidth() / btnNum;

            offset = (btnNum + 0.25) * btnWidth;
            preOffset = parseFloat(oldValue) || 0;

            return preOffset + offset;
        },
        paddingLeft: function (index, oldValue) {
            var offset = $popup.find('#rim_mtoolbar').outerWidth();
            var preOffset = parseFloat(oldValue) || 0;

            return preOffset + offset;
        },
    });

    /* 动态填充快速回复框内容 */
    $popup
        .find('.rim_btn_img')
            .attr('src', function () {  // 设定按钮地址
                return getBtnURL(this); 
            })
        .end()
        .find('#rim_subject')  // 设定主题
            .val('Re: ' + Args.title)
        .end()
        .find('#rim_sms') // 设定短消息栏的点位内容
            .attr('placeholder', '用户名以逗号或者空格相隔, 按回车发送。例如: u1, u2 u3')
        .end();

    /* 设置文本框样式和占位文字 */
    $popup.find('#rim_content').css(Opts.textAreaStyle)
        .attr('placeholder', '请输入回复内容, 最多可输入' + Opts.maxTextareaLength + '字');

    /* 扩展用户设置的快速回复框样式 */
    style = {
        left: function () { 
            return ($(window).width() - $(this).outerWidth()) / 4 * 3;
        },
        top: function () {
            return ($(window).height() - $(this).outerHeight()) / 3 * 2;
        }
    };

    style = $.extend({}, Opts.popupStyle, style);
    $popup.css(style);

    /* 设定面板样式 */
    $popup.find('.rim_panel').css(
        $.extend({}, Opts.panelStyle, { 
            top: 0,
            right: $popup.outerWidth()
        })
    );

    /* 隐藏 */
    $popup.css('display', 'none');

    return $popup;
}

/* 处理引用的内容 */
function processQuoteContent(val) {
    /* 正则表达式定义 */
    var rmultiquote = 
        /(\[quotex?\][\s\S]*?)\[quotex?\][\s\S]*\[\/quotex?\]([\s\S]*?\[\/quotex?\])/gi;
    var rbegdupblank = /\s*\n*(\[quotex?\])\s*\n*/i;
    var renddupblank = /\s*\n*(\[\/quotex?\])\s*\n*/i;
    var remotubb = /(\[em\d{2}\])/gi;
    var rupldubb = /(\[upload=[^,]*?)(,0)?(\])/gi;

    var insPos, insContent;

    /* 删除多余的空行 */
    val = val.replace(rbegdupblank, '$1\n')
        .replace(renddupblank, '\n\n$1\n');

    /* 删除多重引用内容 */
    if (Opts.removeMultiQuote) 
        val = val.replace(rmultiquote, '$1$2');

    /* 查找插入位置 */
    insPos = val.indexOf('[/b]') + 4;

    /* 构造插入内容 */
    insContent = [ 
        '[url=', 
        Args.quote, 
        ',t=', 
        Opts.openInNewtab ? 'blank' : 'self',
        '][color=', 
        Opts.promptColor, 
        '][b]', 
        Opts.promptString, 
        '[/b][/color][/url]\n'
    ].join('');

    /* 拼接内容 */
    return val.substring(0, insPos) + insContent + val.substring(insPos)
        .replace(remotubb, "[noubb]$1[/noubb]")  // 不解析[em**] 标签
        .replace(rupldubb, "$1,1$3");  // 不自动展开图片
}

/* 动态显示回复文本框 */
function showReplyPopup(name, ele) {
    var $popup, quoteURL;
    
    $popup = $('#rim_popup');

    /* 显示回复框 */
    $popup.slideDown(Opts.animateSpeed, function () { 
        /* 禁用回复与预览按钮 */
        var $actionBtn = $popup.find('#btn_submit, #btn_preview');
        $actionBtn.prop('disabled', true);
    });

    /* 如果不是从页面上点击回复或者引用按钮 */
    if (!ele) {
        Args.quote = getRelativeURL(location.href);
        return $popup;
    }

    /* 获取帖子引用地址 */
    quoteURL = $(ele).parent('a').siblings()
        .filter('a[href*="reannounce.asp"]').attr('href');

    /* 如果获取失败或者是快速回复类型 */
    if (!quoteURL || name == 'reply') {
        Args.quote = getRelativeURL(location.href);
        return $popup
    }

    /* 否则为快速引用类型 */

    /* 获取原帖地址 */
    Args.quote = getOrigURL(quoteURL);

    /* 获取引用的内容 */
    $.get(quoteURL, function (data) {
        var value = queryHTMLBySelector(data, 'textarea#content').val();

        /* 内容处理，添加查看原帖等功能 */
        $popup.find('#rim_content').val(processQuoteContent(value))
            .focus();
    });

    return $popup;
}

/* 隐藏快速回复框 */
function hideReplyPopup() {
    var $popup = $('#rim_popup');
    var $previewBox = $popup.find('#rim_previewbox');

    if ($popup.is(':hidden'))
        return;

    /* 清除旧的定时器 */
    clearIntervalTimer();
    /* 退出前备份数据 */
    saveData($popup.find('#rim_content'), true);

    /* 清理预览信息 */
    if (!$previewBox.hasClass('hidden'))
        hidePreview($previewBox);

    $popup.slideUp(Opts.animateSpeed);
}

/* 创建表情面板 */
function createEmotPanel() {
    var arr = new Array();
    var html = '<img src="emot/simpleemot/emot%n%.gif" alt="[em%n%]">';

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

    for (var i = 1; i <= 22; i++)
        arr.push(html.replace(/%n%/g, i));

    return arr.join('');
}

/* 创建快速回复框面板 */
function createReplyPanel(name) {
    var html;

    switch (name) {
        case 'emot':    // 表情面板
            html = createEmotPanel();
            break;
        case 'expr': // 心情面板
            html = createExprPanel();
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
    if ($panel.is(':empty'))
        $panel.html(createReplyPanel(name));

    /* 控制面板的显示与隐藏 */
    $panel.siblings().addClass('hidden');
    $panel.toggleClass('hidden');
}

/* 显示通知信息 */
function showNotify(msg, box, style, type, append) {
    if (!(box instanceof jQuery))
        box = $(box);

    /* 状态类型：错误或者正常 */
    type = (type || 'norm') + 'StatusColor';
    msg = $('<font color="' + Opts[type] + '"/>').wrapInner(msg);

    if (append) // 追加内容
        box.append(msg);
    else  // 填充内容
        box.html(msg);

    /* 设定样式并显示内容 */
    //box.css(style).fadeTo(Opts.animateSpeed, style.opacity || 1);
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
        box.fadeOut(Opts.animateSpeed, function () {
            $(this).empty();
        });
    }, (keepTime||0) + Opts.animateSpeed);
}

/* 显示状态信息 */
function showStatus(status, box, style, keepTime, append, type) {
    /* 扩展用户定义样式 */
    style = $.extend({}, Opts.statusBoxStyle, style);
    showNotify(status, box, style, type, append);

    /* 延迟隐藏信息 */
    StatusTimer = delayHideNotify(box, keepTime, StatusTimer);
}

/* 动态显示文本框的剩余字数 */
function showCharCount(ta, cntBox) {
    var remain, style, type;

    /* 获取实际的jQuery对象 */
    if (!(ta instanceof jQuery))
        ta = $(ta);

    /* 统计剩余字数 */
    remain = Opts.maxTextareaLength - ta.val().bytes();

    /* 显示在右下方 */
    style = setAbsPosition(cntBox, ta, 'right', 'bottom');
    style = $.extend({}, Opts.countBoxStyle, style);

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
    var formData = 'touser=' + encode(user) + '&title=' 
        + encode(title) + '&message=' + encode(message);

    /* Post */
    $.post('messanger.asp?action=send', formData, function (data) {
        var status, style, type;

        /* 显示在正中间 */
        style = setAbsPosition(box, ta, 'middle', 'middle');

        if (data.indexOf('操作成功') != -1) { // 发送成功
            status = '✔ 消息成功发送给"' + user + '"';
            type = 'norm';
        } else { // 发送失败
            status = '✘ 消息未能发送给"' + user + '"';
            type = 'error';
        }

        showStatus(status, box, style, Opts.keepTime, true, type);
    }).error(postOnError);
}

/* 获取存储Key值 */
function key(id) { return 'cc98bbscontent_tid' + Args.id; }

/* 清除并重置周期定时器 */
function clearIntervalTimer() {
    if (AutoSaveTimer == -1)
        return;

    clearInterval(AutoSaveTimer);
    AutoSaveTimer = -1;
}

/* 备份文本框数据 */
function saveData(ta, auto, statusBox) {
    var data, status, style;

    if (!(ta instanceof jQuery))
        ta = $(ta);

    data = ta.val();
    status = auto ? '自动: ' : '手动: ';

    if (data) { // 保存数据
        setValue(key(), data);
        status += '帖子内容保存于' + (new Date()).toLocaleTimeString();
    } else { // 放弃
        status += '帖子内容为空, 放弃备份';
        clearIntervalTimer(AutoSaveTimer);
    }

    if (statusBox === undefined)
        return;

    /* 显示在左下方 */
    style = setAbsPosition(statusBox, ta, 'left', 'bottom');
    showStatus(status, statusBox, style, Opts.keepTime);
}

/* 恢复文本框数据 */
function recoverData(ta, statusBox) {
    var data, status, style;

    if (!(ta instanceof jQuery))
        ta = $(ta);

    /* 获取上次保存的数据 */
    data = getValue(key(), '');

    /* 恢复数据过程 */
    if (data && (!ta.val() || confirm('确定要恢复数据吗'))) {
        status = '成功恢复数据';

        ta.val(data);
    } else
        status = data ? '放弃恢复数据' : '没有可以恢复的数据';

    ta.focus();

    /* 显示在左下方 */
    style = setAbsPosition(statusBox, ta, 'left', 'bottom');
    showStatus(status, statusBox, style, Opts.keepTime);
}

/* 切换显示群发信息框(仿微博@功能)*/
function toggleSMSInput(ele) {
    $('.rim_input').toggleClass('hidden');
}

/* 触发按钮点击事件 */
function triggerButtonClick(ele) {
    /* 获取按钮名称 */
    var name = getDataSet(ele, 'name');

    switch (name) {
        case 'reply':  // 显示快速回复或者引用回复框
        case 'quote':
            showReplyPopup(name, ele);
            break;
        case 'send':  // 切换显示群发信息框(仿微博@功能)
            toggleSMSInput(ele);
            break;
        case 'close':  // 关闭快速回复或者引用回复框
            hideReplyPopup();
            break;
        case 'expr':
        case 'emot': // 切换显示指定的面板
            toggleReplyPanel(name);
            break;
        default:       // 默认不处理
            break; 
    }
}

/* Post提交成功后的回调函数 */
function postOnSuccess(data)
{
    var $popup, $content, $statusBox, $errList;
    var status, style, errNum;
    
    $popup = $('#rim_popup');
    $content = $popup.find('#rim_content');
    $statusBox = $popup.find('#rim_statusbox');

    /* 清空旧状态信息 */
    $statusBox.empty();

    /* 显示在正中间 */
    style = setAbsPosition($statusBox, $content, 'middle', 'middle');

    /* 回复成功 */
    if (data.indexOf('本页面将在3秒后自动返回') != -1) {
        if (Opts.reloadTimeout == 0)
            status = '✔ 回复帖子成功, 页面将会立即刷新';
        else
            status = '✔ 回复帖子成功，将会在' + Opts.reloadTimeout +
                '秒后自动刷新';

        showStatus(status, $statusBox, style, Opts.keepTime, true);

        setTimeout(function () {
            var url = Args.quote;

            /* 回帖后跳转到帖子最后一页 */
            if (Opts.gotoLast)
                url = getLastPageURL(url);

            /* 强制刷新页面(即使URL hash不一样) */
            location.href = url;
            location.reload();
        }, Opts.reloadTimeout);

        return;
    }
    
    /* 获取错误信息 */
    $errList = queryHTMLBySelector(data, 'table li');
    errNum = $errList.length;

    $errList.each(function () {
        status = this.firstChild.nodeValue; // 错误文本内容
        status = status.replace(/^\s*|\s*$/g, ''); // 去除首尾空白

        showStatus('✘ ' + status, $statusBox, style, Opts.keepTime, 
            true, 'error');

        /* 10秒间隔内回复错误 */
        if (status.indexOf('本论坛限制发贴距离时间为10秒') != -1) {
            var $submitBtn = $popup.find('#btn_submit')
            var value = $submitBtn.val();

            /* 开始10秒倒计时 */
            $submitBtn.val('[10秒]');

            for (var i = 9; i >= 1; i--) {
                setTimeout((function (i) {
                    return function () { $submitBtn.val('[' + i + '秒]'); }
                })(i), (10 - i) * 1000);
            }

            /* 10秒后重新启动回复 */
            setTimeout(function () {
                $submitBtn.val(value);

                if (Opts.autoReply && errNum == 1) // 自动回复
                    postReply();
                else // 手动回复
                    $submitBtn.prop('disabled', false);
            }, 10 * 1000);
        }
    });
    
    return;
}

/* Ajax Post提交错误处理函数 */
function postOnError(xhr)
{
    var $popup, $content, $statusBox;
    var status, style;
    
    $popup = $('#rim_popup');
    $content = $popup.find('#rim_content');
    $statusBox = $popup.find('#rim_statusbox');

    /* 显示在正中间 */
    style = setAbsPosition($statusBox, $content, 'middle', 'middle');

    status = [
        '✘ 提交错误, 原因是: "', 
        xhr.status, ' ', xhr.statusText, 
        '"'
    ].join('');

    showStatus(status, $statusBox, style, Opts.keepTime, true, 'error');
}

/* 使用Ajax post发表回复 */
function postReply()
{
    var $popup, $content;
    var formData, postURL, face, content;

    $popup = $('#rim_popup');
    $content = $popup.find('#rim_content');

    /* 处理帖子内容：去除多余的空行, 链接转换成相对 */
    content = getRelativeURL(
        $content.val().replace(/^(\n*)/, '\n').replace(/(\n*)$/g, '')
    );

    /* 记录回帖心情图标 */
    face = $popup.find('.btn_expr img').attr('src');
    face = face.replace(/(.*\/)/, '');

    postURL = 'SaveReAnnounce.asp?method=fastreply&BoardID=' + 
        Args.boardid;

    /* 组成Post的表单数据 */
    formData = [
        ['followup', Args.id],
        ['rootid', Args.id],
        ['star', Args.star],
        ['username', Args.user],
        ['passwd', Args.passwd],
        ['content', encode(content)],
        ['expression', face],
        ['totalusetable', 'bbs1'],
        ['subject', $popup.find('#rim_subject').val()],
        ['signflag', 'yes']
    ];

    for (var i = 0, len = formData.length; i < len; i++)
        formData[i] = formData[i].join('=');

    /* 提交 */
    $.post(postURL, formData.join('&'), postOnSuccess)
        .error(postOnError);
}

/* 触发回复动作事件 */
function triggerActionClick(ele)
{
    switch (ele.id) {
        case 'btn_cancel': // 退出
            hideReplyPopup();
            break;
        case 'btn_submit': // 提交
            ele.disabled = true; // 禁用提交按钮
            postReply();
            break;
        case 'btn_preview': // 预览
            togglePreview();
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
        /* 插入到当前光标所有的位置 */
        var start = this.selectionStart;

        return [
            oldValue.slice(0, start),
            insertText,
            oldValue.slice(start)
        ].join('');
    }).focus();
}

function showPreview(box)
{
    var script = document.createElement('script');

    script.type = 'text/javascript';
    script.innerHTML = 'searchubb("rim_preview", 1, "tablebody2")';

    box = $('#rim_previewbox').html([
        '<span id="rim_preview">',
        $('#rim_content').val().replace(/\n/g, '<br>'),
        '</span>'
    ].join(''));

    box.get(0).appendChild(script);
    box.removeClass('hidden');
}

function hidePreview(box)
{
    box.addClass('hidden');
    box.empty();
}

function togglePreview()
{
    var $previewBox = $('#rim_previewbox');

    if ($previewBox.hasClass('hidden'))
        showPreview($previewBox);
    else
        hidePreview($previewBox);
}

/* 未完成 */
function handleFiles(files)
{
}

function uploadFile(file)
{
    var data, upldURL;

    if (window.FormData) { /* 如果支持FormData (Firefox 5.0+/Chrome 12.0+ */
        var formData = new FormData();
        formData.append('act', 'upload');
        formData.append('fname', filen.name);
        formData.append('file1', file);

        data = fromData;
    } else {
    }
}

/* 事件处理函数 */
function handleEvents() {
    /* 捕获回复按钮点击事件 */
    $('.rim_btn_img').on('click', function (evt) {
        /* 阻止事件默认行为 */
        evt.preventDefault();

        /* 激活按钮点击事件 */
        triggerButtonClick(this);
    });

    /* 捕获心情图标点击事件(替换面板按钮图标)*/
    $('#expr_panel').on('click', 'img', function () {
        $('.btn_expr img').attr('src', this.src);
    });

    /* 点击表情插入UBB标签到文本框 */
    $('#emot_panel').on('click', 'img', function () {
        var insertText = this.src.replace(/(.*?emot(\d+)\.gif)/, '[em$2]');
        insertIntoTextarea(insertText, '#rim_content');
    });

    /* 主题栏字数限制 */
    $('#rim_subject').on('input', function () {
        if (this.value.bytes() > Opts.maxSubjectLength)
            this.style.color = Opts.errorStatusColor;
        else
            this.style.color = Opts.normStatusColor;
    });

    /* 捕获文本框的各种事件 */
    $('#rim_content').on('input focus', function () {  // 动态统计文本框字数
        var $popup, $content, $actionBtn, remain;

        $popup = $('#rim_popup');
        $content = $(this);
        $actionBtn = $popup.find('#btn_submit, #btn_preview');

        /* 实时统计字数 */
        remain = showCharCount($content, $('#rim_cntbox'));

        /* 如果未输入数据则禁用动作按钮 */
        if (remain == Opts.maxTextareaLength) {
            $actionBtn.prop('disabled', true);
            return;
        }

        /* 所见即所得模式：实时更新预览内容，效率比较差?慎用? */
        if (Opts.autoPreview) {
            var $previewBox = $popup.find('#rim_previewbox');

            if (!$previewBox.hasClass('hidden')) { // 预览框显示
                var lastSubStr = $content.val().slice(-9);
                var pattern = new RegExp(Opts.previewTriggerPattern, 'gi');

                if (lastSubStr.match(pattern))
                    showPreview($previewBox);
            }
        }

        /* 激活动作按钮 */
        $actionBtn.prop('disabled', false);

        /* 已经开始自动备份则退出 */
        if (AutoSaveTimer != -1)
            return;

        /* 激活自动备份 */
        AutoSaveTimer = saveData.periodical(
            Opts.autoSaveInterval, window,
            [$content, true, $('#rim_statusbox')]
        );
    }).on('blur', function () {  // 隐藏字数统计框
        delayHideNotify($('#rim_cntbox'), 0); 
    });

    /* 监听Ctrl+Enter键回复 */
    $('#rim_content').on('keyup', function (evt) {
        if (evt.ctrlKey && evt.keyCode == 13)
            postReply();
    });

    /* 监听按键(快捷键)操作 */
    $(document).on('keyup', function (evt) {
        if (!evt.altKey)
            return;

        switch (evt.keyCode) {
            case 82:  // Alt+R键打开快速回复框
                showReplyPopup();
                break;
            case 81: // Alt+Q键关闭快速回复框
                hideReplyPopup();
                break;
            default:
                break;
        }
    });

    /* 备份与恢复等日常操作 */
    $('#btn_save, #btn_recover').on('click', function () {
        var $popup, $conent, $statusBox;

        $popup = $('#rim_popup');
        $content = $popup.find('#rim_content');
        $statusBox = $popup.find('#rim_statusbox');

        /* 清除旧的定时器 */
        clearIntervalTimer();

        if (this.id == 'btn_save')
            saveData($content, false, $statusBox);
        else
            recoverData($content, $statusBox);
    });

    /* 插入时间 */
    $('#btn_instime').on('click', function () {
        insertIntoTextarea((new Date()).toLocaleString(), '#rim_content');
    });

    /* 刷新页面之前保存帖子内容 */
    $(window).unload(function () { 
        saveData($('#rim_content'), true); 
    });

    /* 捕获群发输入框的回车事件 */
    $('#rim_sms').on('keyup', function (evt) {
        if (!this.value || evt.keyCode != 13)
            return;

        var $content, $replyStatus;
        var messages, title;

        $content = $('#rim_content');
        $statusBox = $('#rim_statusbox');

        /* 设置消息正文与标题 */
        messages= [
            '我在帖子"[url=', 
            Args.quote, 
            '][color=blue]', 
            Args.board,
            ' -> ', 
            Args.title, 
            '[/color][/url]"中@了你,快来看看吧~!',
        ].join('');

        title = '来自' + decode(Args.user) + '的At信息';

        /* 清空旧状态信息 */
        $statusBox.empty();

        /* 依次发送消息 */
        $.each(this.value.split(/[，,\s]/), function (i, u) {
            if (!u) return;

            sendMessages(u, title, messages, $content, $statusBox);
        });

        toggleSMSInput(this);
    });

    /* 状态框在鼠标悬浮时一直保持显示 */
    $('#rim_statusbox').on('mouseover', function () {
        clearTimeout(StatusTimer);
    }).on('mouseout', function () { // 移出后延迟隐藏
        StatusTimer = delayHideNotify(this, Opts.keepTime, StatusTimer);
    });

    /* 捕获鼠标事件 */
    $(document).mousemove(function (evt) {
        if (!DragObject)
            return;

        /* 动态更新位置样式 */
        $(DragObject).css({
            left: evt.pageX - MouseOffset.left - $(document).scrollLeft(),
            top: evt.pageY - MouseOffset.top - $(document).scrollTop()
        }).addClass('dragged');

        /* 避免拖拽的过程中选中页面上的文本 */
        window.getSelection().removeAllRanges();
    }).mouseup(function (evt) {
        if (DragObject) {
            $(DragObject).removeClass('dragged');
            DragObject = null;
        }
    });

    /* 捕获回复框的鼠标按下事件 */
    $('#rim_popup').on('mousedown', function (evt) {
        var dragObjOffset;

        /* 使得拖拽面积更大 */
        if (evt.target.tagName.toLowerCase() != 'div')
            return;

        /* 记录拖拽对象 */
        DragObject = this;
        dragObjOffset = $(DragObject).offset();

        MouseOffset = {
            left: evt.pageX - dragObjOffset.left,
            top: evt.pageY - dragObjOffset.top
        };
    });

    /* 捕获回复动作事件 */
    $('.rim_action').on('click', function () {
        triggerActionClick(this);
    });
}
 
/* Main 函数 */
function main() {
    /* 不在frames中再次执行该脚本 */
    if (window.top != window.self)
        return;

    /* 加载用户设置 */
    Opts = loadOptions();
    /* 解析页面参数 */
    Args = parseTopicArgs();

    /* 如果未登录，直接退出 */
    if (!Args.user)
        return;
    
    /* 添加自定义的样式 */
    addCustomizedCSS();
    /* 创建快速回复以及快速引用按钮 */
    createReplyBtns();
    /* 创建快速回复框 */
    createReplyPopup();

    /* 监听事件并处理 */
    handleEvents();
}

/* 执行main函数 */
main();

})();
