// ==UserScript==
// @id             reply_improved
// @name           Reply Improved
// @version        0.9.7.1
// @namespace      http://www.cc98.org
// @author         tuantuan <dangoakachan@foxmail.com>
// @description    Improve the CC98's native reply functions.
// @include        http://localhost/cc98/*
// @include        http://www.cc98.org/dispbbs.asp*
// @include        http://10.10.98.98/dispbbs.asp*
// @resource       reply.png   images/reply.png
// @resource       quote.png   images/quote.png
// @resource       emot.png    images/emot.png
// @resource       expr.png    images/expr.png
// @resource       close.png   images/close.png
// @resource       state.png   images/state.png
// @resource       send.png    images/send.png
// @resource       edit.png    images/edit.png
// @resource       rim.css     rim.css
// @require        jquery.min.js
// @require        lscache.js
// @updateURL      https://raw.github.com/dangoakachan/cc98/master/reply_improved/src/reply_improved.user.js
// @run-at         document-end
// ==/UserScript==

(function () {

/* 用户设置(默认) */
var DefaultOptions = {
    autoReply: true,             // 10秒错误后自动读秒回复
    gotoLast: false,             // 回复成功后跳转到最后一页
    removeMultiQuote: true,      // 删除多重引用的内容(仅保留最后一重)
    autoPreview: true,           // 开启实时预览功能
    openInNewtab: false,         // 链接是否在新标签页打开
    prependState: true,          // 在帖子内容开头增加个人状态
    enableAnimate: true,         // 开启动画效果

    animateSpeed: 500,           // 动画速度(毫秒)
    keepTime: 3000,              // 状态显示保持时间(毫秒)
    autoSaveInterval: 0.5,       // 自动保存间隔(分钟)
    expireTime: 30,              // 帖子内容过期时间(分钟)
    maxTextareaLength: 16240,    // 文本框的最大输入长度(字节数)
    maxSubjectLength: 100,       // 主题框的最大输入长度(字节数)

    promptString: '|查看原帖|',  // 查看提示文字
    promptColor: 'green',        // 查看原帖提示颜色
    errorStatusColor: 'red',     // 错误状态颜色
    normStatusColor: 'black',    // 正常状态颜色
    previewTriggerPattern:       // 实际预览触发模式
        /* 末尾文字为UBB标签结束或者非中文数字英文符号(不包括[]/) */
        '(\\[/[a-z]{1,6}\\]|[^0-9a-z\u4E00-\u9FA5\\[\\]/]|\n)$'
};

/* ==全局变量== */

var Options = null;     // 选项设置
var Args = null;        // 页面参数

var StatusTimer = -1;   // 状态显示定时器
var AutoSaveTimer = -1; // 自动备份定时器

var LastPageN = 32767;  // 假设一个大数作为帖子的最后一页 

var DragObject = null;  // 拖拽对象
var MouseOffset = null; // 鼠标与拖拽对象之间的偏移

/* 缓存jQuery对象, 避免多次查询 */
var $Popup = null;       // 弹出回复框
var $Content = null;     // 内容输入框
var $Status = null;      // 状态框
var $Counter = null;     // 字数统计框
var $Preview = null;     // 预览框
var $Submit = null;      // 回复按钮

/* ==全局变量== */

/* 字符串扩展：求字符串的总字节数 */
String.prototype.bytes = function () {
    var ret = 0, len = this.length;

    for (var i = 0; i < len; i++) {
        if (this.charCodeAt(i) < 0 || this.charCodeAt(i) > 255) // 双字节
            ret += 2;
        else // 单字节
            ret += 1;
    }

    return ret;
}; 

/* 函数类扩展：周期执行某个函数 (参考 Moontools)*/
Function.prototype.periodical = function (periodical, bind, args) {
    var self = this;

    return setInterval(function () {
        self.apply(bind, args || []);
    }, periodical);
};

/* URL信息编码与解码函数 */
function encode(str) { return encodeURIComponent(str); }
function decode(str) { return decodeURIComponent(str); }

/* 返回当前时间 */
function getCurrentTime() {
    return (new Date()).toLocaleTimeString();
}

/* HTML5 dataset属性读方法 */
function getDataSet(ele, name) {
    if (ele.dataset) // 如果支持
        return ele.dataset[name];
    else // 否则使用旧的API
        return ele.getAttribute('data-' + name);
}

/* 选项保存 */
function saveOptions(opt) {
    if (opt === undefined)
        return;

    $.extend(Options, opt);  // 即时更新原选项设置
    lscache.set('rimopt', Options);
}

/* 选项加载 */
function loadOptions() {
    return lscache.get('rimopt') || DefaultOptions;
}

/* 清除并重置周期定时器 */
function clearIntervalTimer() {
    if (AutoSaveTimer == -1)
        return;

    clearInterval(AutoSaveTimer);
    AutoSaveTimer = -1;
}

/* 检查是否为Chrome浏览器 */
function isChrome()
{
    return (window.chrome != null);
}

/* 检查是否为Sogou浏览器 */
function isSogou()
{
    /* Fix: useAgent判断不准确 */
    var userAgent = navigator.userAgent.toLowerCase();
    return (userAgent.indexOf('se 2.x') != -1);
}

/* 检查是否为GM环境 */
function isGM()
{
    return (typeof GM_getResourceURL !== 'undefined');
}

/* 获取资源的Data URL地址 */
function getResourceURL(resourceName)
{
    if (isChrome()) // 如果是Chrome
        return chrome.extension.getURL('images/' + resourceName);
    else if (isGM()) // 判断是否在Greasemonkey环境下(Firefox)
        return GM_getResourceURL(resourceName);
    else if (isSogou()) // 如果是搜狗浏览器
        return sogouExplorer.extension.getURL('images/' + resourceName);
    else
        return 'emot/simpleemot/em02.gif';
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

/* 从HTMl代码串中查询指定选择器的片断 */
function queryHTML(raw, selector)
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

/* 根据引用地址返回原帖地址 */
function getOrigURL(url) {
    return getRelativeURL(url).replace(/reannounce/, 'dispbbs')
        .replace(/reply.*?&/g, '').replace(/&bm=/, '#');
}

/* 根据引用地址返回编辑地址 */
function getEditURL(url) {
    return getRelativeURL(url).replace(/re(announce.asp)/i, 'edit$1')
        .replace(/&reply=true/i, '');
}

/* 返回帖子的最后一页 */
function getLastPageURL(url)
{
    return getRelativeURL(url).replace(/(star=)\d*/, '$1' + LastPageN)
        .replace(/#.*/, "#bottom");
}

/* 返回指定按钮的图片地址 */
function getBtnURL(ele) {
    var name = getDataSet(ele, 'name');
    return getResourceURL(name + '.png');
}

/* 显示通知信息 */
function showNotify(msg, box, style, type, append) {
    /* 通知类型：错误或者正常 */
    type = (type || 'norm') + 'StatusColor';
    msg = $('<font color="' + Options[type] + '"/>').wrapInner(msg);

    if (append) // 追加通知
        box.append(msg);
    else  // 覆盖通知
        box.html(msg);

    /* 设定通知样式并显示 */
    //box.css(style).fadeTo(Options.animateSpeed, style.opacity || 1);
    box.css(style).show();
}

/* 延迟隐藏通知 */
function delayHideNotify(box, keepTime, oldTimer) {
    /* 如果存在定时器，则先清除并重置 */
    if (oldTimer && oldTimer != -1)
        clearTimeout(oldTimer);

    /* 延时隐藏 */
    return setTimeout(function () {
        box.fadeOut(Options.animateSpeed, function () {
            $(this).empty();
        });
    }, (keepTime || 0) + Options.animateSpeed);
}

/* 显示状态信息 */
function showStatus(status, position, type, append) {
    var style;

    /* 如果position参数非数组 */
    if (typeof position == 'string') {
        append = type;
        type = position;
        position = ['middle', 'middle']; // 默认居中
    }

    /* 确定显示位置 */
    style = setAbsPosition($Status, $Content, position);
    showNotify(status, $Status, style, type, append);

    /* 延迟隐藏信息 */
    StatusTimer = delayHideNotify($Status, Options.keepTime, StatusTimer);
}

/* 动态显示文本框的剩余字数 */
function showCharCount() {
    var remain, style, type;

    /* 统计剩余字数 */
    remain = Options.maxTextareaLength - $Content.val().bytes();

    /* 显示在右下方 */
    style = setAbsPosition($Counter, $Content, ['right', 'bottom']);

    /* 超出字数限制时，提示类型为错误 */
    type = (remain >= 0) ? 'norm' : 'error';
    showNotify(remain, $Counter, style, type, false);

    return remain;
}

/* 设置一个页面元素相对其它元素的绝对位置 */
function setAbsPosition(target, refer, position) {
    var style, x, y;

    /* 位置样式 */
    style = {
        left: 'auto',
        right: 'auto',
        top: 'auto',
        bottom: 'auto',
        position: 'absolute'
    };

    x = position[0], y = position[1];

    /* 设置水平位置 */
    if (x == 'middle') {
        style['left'] = function () {
            return (refer.innerWidth() - target.outerWidth()) / 2;
        };
    } else {
        style[x] = function () {
            return refer.css('padding-' + x);
        };
    }

    /* 设置垂直位置 */
    if (y == 'middle') {
        style['bottom'] = function () {
            return (refer.innerHeight() - target.outerHeight()) / 2;
        };
    } else {
        style[y] = function () {
            return refer.css('padding-' + y);
        };
    }

    return style;
}

/* 获取数据保存Key值 */
function getKey(id) { return 'rimdata_tid' + Args.id; }

/* 备份文本框数据 */
function saveData(auto, disableStatus) {
    var data, status, key;

    data = $Content.val();
    status = auto ? '自动: ' : '手动: ';
    key = getKey();

    /* 清除自动备份定时器 */
    clearIntervalTimer(AutoSaveTimer);

    if (data) { // 备份数据
        lscache.set(key, data, Options.expireTime);
        status += '帖子内容保存于' + getCurrentTime();
    } else { // 放弃备份
        status += '帖子内容为空, 放弃备份';
    }

    /* 显示在左下方 */
    if (!disableStatus) {
        showStatus(status, ['left', 'bottom'], 'norm', false);
    }
}

/* 恢复文本框数据 */
function recoverData() {
    var data, status, key = getKey();

    /* 获取上次保存的数据 */
    data = lscache.get(key);

    /* 恢复数据过程 */
    if (data && (!$Content.val() || confirm('确定要恢复数据吗'))) {
        status = '成功恢复数据';
        $Content.val(data).focus();
    } else {
        status = data ? '放弃恢复数据' : '没有可以恢复的数据';
    }

    /* 显示在左下方 */
    showStatus(status, ['left', 'bottom'], 'norm', false);
}

/* 发送站短 */
function sendMessages(user, title, message) {
    /* 构建post数据 */
    var formData = 'touser=' + encode(user) + '&title=' 
        + encode(title) + '&message=' + encode(message);

    /* Post */
    $.post('messanger.asp?action=send', formData, function (data) {
        var status, type;

        if (data.indexOf('操作成功') != -1) { // 发送成功
            status = '✔ 消息成功发送给' + user;
            type = 'norm';
        } else { // 发送失败
            status = '✘ 消息未能发送给' + user;
            type = 'error';
        }

        /* 显示居中 */
        showStatus(status, type, true);
    }).error(postOnError);
}

/* 回复成功回调函数 */
function replySuccess(data)
{
    var status, action, url;
    
    action = Args.edit ? '编辑' : '回复';

    /* 清空旧状态信息 */
    $Status.empty();

    /* 提示信息 */
    status = '✔ ' + action + '帖子成功, 页面将会立即刷新';

    /* 显示居中 */
    showStatus(status, 'norm', true);

    /* 回帖后跳转到帖子最后一页 */
    if (Options.gotoLast)
        url = getLastPageURL(url);
    else
        url = Args.original;

    /* Fix: 回帖后地址不刷新 */
    /* 当URL Hash部分变化时, 刷新页面 */
    $(window).one('hashchange', function () {
        location.reload();
    });

    if (equalURL(location.href, url)) // 地址相同则直接刷新
        location.reload();
    else // 否则, 更换地址栏地址
        location.href = url;
}

function equalURL(lhs, rhs)
{
    /* 标准化 */
    lhs = getRelativeURL(lhs).toLowerCase();
    rhs = getRelativeURL(rhs).toLowerCase();

    return (lhs == rhs);
}

/* 显示回复/引用/编辑过程中的错误信息 */
function showError(data, callback)
{
    /* 获取错误信息 */
    var $error = queryHTML(data, 'table li');

    /* 清空旧状态信息 */
    $Status.empty();

    /* 未知错误, 例如编辑他人的帖子内容 */
    if ($error.length == 0) {
        showStatus('✘ 未知错误, 无权限操作', 'error', true);
        return;
    }

    /* 依次处理每个错误 */
    $error.each(function () {
        var status = this.firstChild.nodeValue; // 错误文本内容
        status = status.replace(/^\s*|\s*$/g, ''); // 去除首尾空白
        showStatus('✘ ' + status, 'error', true);
    });

    /* 如果提供callback函数, 对错误信息做进一步的处理 */
    if (callback && callback instanceof Function)
        callback($error);
}

/* 回复错误回调函数 */
function replyError(data)
{
    /* 启用回复按钮 */
    $Submit.prop('disabled', false);

    showError(data, function($error) {
        var value = $Submit.val();

        /* 10秒间隔内回复错误 */
        if ($error.text().indexOf('限制发贴距离时间为10秒') == -1)
            return;

        /* 开始10秒倒计时 */
        $Submit.val('[10秒]');
        $Submit.prop('disabled', true);

        for (var i = 9; i >= 1; i--) {
            setTimeout((function (i) {
                return function () { 
                    $Submit.val('[' + i + '秒]'); 
                };
            })(i), (10 - i) * 1000);
        }

        /* 10秒后重新启动回复 */
        setTimeout(function () {
            $Submit.val(value).prop('disabled', false);

            /* 仅在唯一错误以及自动回复功能开启时 */
            if ($error.length != 1 || !Options.autoReply)
                return;

            /* 自动提交回复 */
            submitReply();
        }, 10 * 1000);
    });
}

/* Ajax Post提交成功回调函数 */
function postOnSuccess(data)
{
    if (data.indexOf('将在3秒后自动返回') != -1) {
        replySuccess(data); // 回复成功
    } else {
        replyError(data);  // 回复错误
    }
}

/* Ajax Get/Post错误回调函数 */
function postOnError(xhr)
{
    var status = [
        '✘ 提交错误, 原因是: "', 
        xhr.status, ' ', xhr.statusText, 
        '"'
    ].join('');

    /* 显示居中 */
    showStatus(status, 'error', true);
}

/* 利用Ajax Post方法提交帖子 */
function ajaxReply(subject, content, face)
{
    /* 组成Post的表单数据 */
    var formData = [
        ['followup', Args.id],
        ['rootid', Args.id],
        ['star', Args.star],
        ['username', Args.user],
        ['passwd', Args.passwd],
        ['content', encode(content)],
        ['expression', face],
        ['subject', encode(subject)],
        ['totalusetable', 'bbs1'],
        ['signflag', 'yes']
    ];

    for (var i = 0, len = formData.length; i < len; i++)
        formData[i] = formData[i].join('=');

    /* 提交 */
    $.post(Args.post, formData.join('&'), postOnSuccess)
        .error(postOnError);
}

/* 监听回复按钮提交事件 */
function submitReply()
{
    var content, face, subject, state;

    /* 去除多余的空行 */
    content = $Content.val().replace(/^(\n*)/, '\n')
        .replace(/(\n*)$/g, '');

    /* 处于非编辑模式, 考虑添加个人状态 */
    if (!Args.edit && Options.prependState) {
        state = lscache.get('rimstate');

        if (state && state.value) {
            content = [
                '\n[quotex]状态更新时间: ',
                state.timestamp,
                '\n',
                state.value,
                '[/quotex]',
                content
            ].join('');
        }
    }

    /* 转换链接为相对链接 */
    content = getRelativeURL(content);

    /* 记录回帖心情图标 */
    face = $Popup.find('.btn_expr img').attr('src');
    if (face.indexOf('data:image') == 0) // 默认
        face = 'face7.gif';
    else
        face = face.replace(/.*\//, '');

    subject = $Popup.find('#rim_subject').val();

    /* 提交回复 */
    ajaxReply(subject, content, face);
}

/* 添加自定义的样式 */
function addCustomizedCSS() {
    var $style, css;

    $style = $('<style type="text/css"/>');

    if (isGM()) {
        css = GM_getResourceText('rim.css');
    } else {
        // Todo
        css = '';
    }

    $style.text(css);
    $style.appendTo('head');
}

/* 创建快速回复/引用/编辑按钮 */
function createReplyBtns() {
    var html = [
        '<a class="rim_btn btn_reply">',  // 快速回复按钮
        '<img class="rim_btn_img" data-name="reply" alt="快速回复"/>',
        '</a>',

        '<a class="rim_btn btn_quote">',  // 快速引用按钮
        '<img class="rim_btn_img" data-name="quote" alt="快速引用"/>',
        '</a>',

        '<a class="rim_btn btn_edit">',  // 快速编辑按钮
        '<img class="rim_btn_img" data-name="edit" alt="快速编辑"/>',
        '</a>'
    ].join('');

    $('a[href*="dispbbslz.asp"]').parent('td').append(html) // 添加到文档中
        .find('.rim_btn_img').attr('src', function () {  // 设定按钮的地址
            return getBtnURL(this); 
        });
}

/* 创建弹出回复框 */
function createReplyPopup() {
    /* 创建回复框容器DIV */
    $Popup = $('<div id="rim_popup"/>').appendTo('body');

    /* 填充回复框界面骨架 */
    $Popup.html([
        '<div id="rim_header">',   // 回复框头部

        '<div id="rim_ltoolbar">',       // 左侧工具按钮
        '<a class="rim_btn btn_emot">',  // 插入表情
        '<img class="rim_btn_img" data-name="emot" alt="插入表情"/>',
        '</a>',
        '<a class="rim_btn btn_send">',  // 群发信息
        '<img class="rim_btn_img" data-name="send" alt="群发信息"/>',
        '</a>',
        '<a class="rim_btn btn_state">', // 个人状态
        '<img class="rim_btn_img" data-name="state" alt="个人状态"/>',
        '</a>',
        '</div>',

        '<div id="rim_subjectbar">',     // 回复框主题栏
        '<input type="text" id="rim_subject" class="rim_input"/>',  // 回复框主题

        '<div id="rim_mtoolbar">',       // 中间工具按钮 
        '<a class="rim_btn btn_expr">',  // 发帖心情
        '<img class="rim_btn_img" data-name="expr" alt="发帖心情"/>',
        '</a>',
        '</div>',

        '<div id="rim_rtoolbar">',       // 右侧按钮
        '<a class="rim_btn btn_close">', // 关闭回复框
        '<img class="rim_btn_img" data-name="close" alt="关闭"/>',
        '</a>',
        '</div>',

        '</div>',

        '<div>', // Input输入框
        '<input type="text" id="rim_state" class="rim_input hidden"',  // 个人状态输入框
        ' placeholder="请输入个人状态, 按回车保存。"/>',
        '<input type="text" id="rim_send" class="rim_input hidden"',  // 群发信息输入框
        ' placeholder="用户名以逗号或空格相隔, 按回车发送。"/>',
        '</div>',

        '</div>', // 头部结束

        '<div id="rim_panelbar">',  // 回复框面板
        '<div class="rim_panel hidden" id="expr_panel"/>',  // 心情面板
        '<div class="rim_panel hidden" id="emot_panel"/>',  // 表情面板
        '</div>',

        '<div id="rim_contentbox">',     // 回复框中部
        '<textarea id="rim_content"/>',  // 回复内容输入框
        '<div id="rim_cntbox"/>',        // 字数统计框
        '<div id="rim_statusbox"/>',     // 状态框
        '</div>', // 中部结束

        '<div id="rim_footer">',                   // 回复框尾部
        '<div id="rim_asvbar">',                   // 备份操作栏
        '<span id="btn_save">保存数据</span>',
        '<span id="btn_recover">恢复数据</span>',
        '</div>',

        '<div id="rim_actbar">', // 回复动作栏
        '<input type="button" id="btn_submit" class="rim_action" value="回复"/>',
        '<input type="button" id="btn_preview" class="rim_action" value="预览"/>',
        '<input type="button" id="btn_cancel" class="rim_action" value="退出"/>',
        '</div>',

        '</div>', // 底部结束

        '<div id="rim_previewbox" class="hidden"/>',  // 预览框
    ].join(''));

    /* 微调主题栏样式 */
    $Popup.find('#rim_subjectbar').css({
        marginLeft: function (index, oldValue) {
            var offset = $Popup.find('#rim_ltoolbar').outerWidth(); 

            return (parseFloat(oldValue) || 0) + offset; 
        },
        paddingLeft: function (index, oldValue) {
            var offset = $Popup.find('#rim_mtoolbar').innerWidth();

            return (parseFloat(oldValue) || 0) + offset; 
        },
    });

    /* 设定按钮地址 */
    $Popup.find('.rim_btn_img').attr('src', function () { 
        return getBtnURL(this); 
    });

    /* 设定主题 */
    //$Popup.find('#rim_subject').val('Re: ' + Args.title);
    $Popup.find('#rim_subject').attr('placeholder', '帖子标题是可选的'
        + '(首楼编辑除外), 最多可输入' + Options.maxSubjectLength + '字节');

    /* 设置文本框样式和占位文字 */
    $Content = $Popup.find('#rim_content');
    $Content.attr('placeholder', '请输入回复内容, 最多可输入' 
        + Options.maxTextareaLength + '字节(每个汉字占2个字节)');

    /* 扩展用户设置的弹出回复框样式 */
    $Popup.css({
        left: function () { 
            return ($(window).width() - $(this).outerWidth()) / 2;
        },
        top: function () {
            return ($(window).height() - $(this).outerHeight()) / 2;
        }
    });

    /* 设置面板样式 */
    $Popup.find('.rim_panel').css({top: 0, right: $Popup.outerWidth()});

    /* 缓存状态框/统计框/预览框 */
    $Status = $Popup.find('#rim_statusbox');
    $Counter = $Popup.find('#rim_cntbox');
    $Preview = $Popup.find('#rim_previewbox');
    $Submit = $Popup.find('#btn_submit');

    /* 隐藏 */
    $Popup.css('display', 'none');
}

/* 获取引用内容 */
function getQuoteContent(data)
{
    var rbegdupblank, renddupblank, rmultiquote,
        remotubb, rupldubb, insPos, insContent, value;

    /* 正则表达式定义 */
    rbegdupblank = /[\s\n]*(\[quotex?\].*)[\s\n]*/i;
    renddupblank = /[\s\n]*(\[\/quotex?\])[\s\n]*/i;
    remotubb = /(\[em\d{2}\])/gi;
    rupldubb = /(\[upload=[^,]*?)(,0)?(\])/gi;
    rmultiquote = /(\[quotex?\][\s\S]*?)\[quotex?\][\s\S]*\[\/quotex?\]([\s\S]*?\[\/quotex?\])/gi;

    /* 获取引用的内容 */
    value = queryHTML(data, 'textarea#content').val();

    if (value === undefined) {
        showError(data);
        return;
    }

   /* 删除多余的空行 */
    value = value.replace(rbegdupblank, '\n$1\n\n')
        .replace(renddupblank, '\n\n$1\n');

    /* 删除多重引用内容 */
    if (Options.removeMultiQuote) 
        value = value.replace(rmultiquote, '$1$2');

    /* 查找插入位置 */
    insPos = value.indexOf('[/b]') + 4;
    /* 构造插入内容 */
    insContent = [ 
        '[url=', 
        Args.original, 
        ',t=', 
        Options.openInNewtab ? 'blank' : 'self',
        '][color=', 
        Options.promptColor, 
        '][b]', 
        Options.promptString, 
        '[/b][/color][/url]'
    ].join('');

    /* 拼接内容 */
    value = value.substring(0, insPos) + insContent + value.substring(insPos)
        .replace(remotubb, "[noubb]$1[/noubb]")  // 不解析[em**] 标签
        .replace(rupldubb, "$1,1$3");  // 不自动展开图片

    /* 增加到回复内容输入框 */
    $Content.val(value).focus();
}

/* 获取待编辑帖子的内容 */
function getEditContent(data)
{
    /* 编辑内容 */
    var value = queryHTML(data, 'textarea#content').val();

    /* 获取帖子内容失败, 例如编辑他人帖子 */
    if (value === undefined) {
        showError(data);
        return;
    }

    /* 增加到回复内容输入框 */
    $Content.val(value).focus();
}

/* 插入内容到文本框中 */
function insertIntoTextarea(text)
{
    $Content.val(function (index, oldValue) {
        /* 插入到当前光标所在的位置 */
        var start = this.selectionStart;

        /* 插入内容 */
        return [
            oldValue.slice(0, start),
            text,
            oldValue.slice(start)
        ].join('');
    }).focus();
}

/* 显示弹出回复框 */
function showPopup(name, ele) {
    var quoteURL, editURL;
    
    /* 禁用回复按钮 */
    $Submit.prop('disabled', true);

    /* 显示回复框 */
    $Popup.slideDown(Options.animateSpeed);

    /* 获取帖子引用地址 */
    quoteURL = $(ele).parent('a').siblings()
        .filter('a[href*="reannounce.asp"]').attr('href');

    /* 如果找不到引用地址(一般不会发生) */
    if (!quoteURL) name = 'reply'; 

    switch (name) {
        case 'reply': // 快速回复
            /* 非编辑帖子 */
            Args.edit = false;
            /* Ajax回复post地址 */
            Args.post = 'SaveReAnnounce.asp?method=fastreply&BoardID=' 
                + Args.boardid;
            /* 原帖地址为当前地址 */
            Args.original = getRelativeURL(location.href);

            break;
        case 'quote': // 快速引用
            Args.edit = false;
            Args.post = 'SaveReAnnounce.asp?method=fastreply&BoardID=' 
                + Args.boardid;
            /* 从引用地址中还原原帖地址 */
            Args.original = getOrigURL(quoteURL);

            /* 获取引用内容 */
            $.get(quoteURL, getQuoteContent).error(postOnError);

            break;
        case 'edit': // 快速编辑
            /* 返回编辑帖子地址 */
            editURL = getEditURL(quoteURL);

            Args.original = getOrigURL(quoteURL);
            Args.post = 'SaveditAnnounce.asp?' + editURL.split('?').slice(-1);
            Args.edit = true;

            /* 获取待编辑的帖子内容(不做处理) */
            $.get(editURL, getEditContent).error(postOnError);

            break;
        default:
            break;
    }

    return;
}

/* 隐藏弹出回复框 */
function hidePopup() {
    if ($Popup.is(':hidden'))
        return;

    /* 清除预览内容 */
    hidePreview($Popup.find('#rim_previewbox'));

    /* 清除旧的定时器 */
    clearIntervalTimer();
    /* 退出前备份数据 */
    saveData(true, true);

    $Popup.slideUp(Options.animateSpeed);
}

/* 创建表情面板 */
function createEmotPanel() {
    var arr = new Array();
    var html = '<img src="emot/simpleemot/emot%n%.gif" alt="[em%n%]">';

    for (var i = 0; i <= 90; i++)
        arr.push(html.replace(/%n%/g, (('0' + i).slice(-2))));

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

/* 创建弹出回复框面板 */
function createPanel(name) {
    var html;

    switch (name) {
        case 'emot': // 表情面板
            html = createEmotPanel();
            break;
        case 'expr': // 心情面板
            html = createExprPanel();
            break;
        default:
            html = '面板创建失败';
            break;
    }

    return html;
}

/* 切换显示弹出回复框面板 */
function togglePanel(name, ele) {
    /* 获取待显示的面板 */
    var $panel = $('#' + name + '_panel');

    /* 初始显示则创建面板 */
    if ($panel.is(':empty'))
        $panel.html(createPanel(name));

    /* 控制面板的显示与隐藏 */
    $panel.siblings().addClass('hidden');
    $panel.toggleClass('hidden');
}

/* 切换显示输入框 */
function toggleInput(name) {
    $('#rim_' + name).toggleClass('hidden');
}

/* 按钮点击处理函数 */
function btnClickHandlers(evt) {
    var name, ele;

    ele = evt.target;
    name = getDataSet(ele, 'name');

    switch (name) {
        case 'reply':  // 显示弹出回复框
        case 'quote':
        case 'edit':
            showPopup(name, ele);
            break;
        case 'close':  // 关闭弹出回复框
            hidePopup();
            break;
        case 'state':  // 切换显示个人状态或者群发信息输入框
        case 'send': 
            toggleInput(name);
            break;
        case 'expr':
        case 'emot':  // 切换显示指定的面板
            togglePanel(name, ele);
            break;
        default:       // 默认不处理
            break; 
    }
}

/* 显示回复内容预览框 */
function showPreview()
{
    var script = document.createElement('script');

    script.type = 'text/javascript';
    script.innerHTML = 'searchubb("rim_preview", 1, "tablebody2")';

    $Preview.html([
        '<span id="rim_preview">',
        $Content.val().replace(/\n/g, '<br>'),
        '</span>'
    ].join(''));

    $Preview.get(0).appendChild(script);
    $Preview.removeClass('hidden');
}

/* 隐藏回复内容预览框 */
function hidePreview()
{
    $Preview.addClass('hidden');
    $Preview.empty();
}

/* 切换显示回复内容预览框 */
function togglePreview()
{
    if ($Preview.hasClass('hidden'))
        showPreview();
    else
        hidePreview();
}

/* 监听回复文本框按键等事件 */
function textareaHandlers()
{
    var remain, last, pattern;

    /* 实时统计字数 */
    remain = showCharCount();

    /* 如果未输入数据则禁用动作按钮 */
    if (remain == Options.maxTextareaLength) {
        $Submit.prop('disabled', true);
        return;
    }

    /* 所见即所得模式：实时更新预览内容，效率比较差?慎用? */
    if (Options.autoPreview && !$Preview.hasClass('hidden')) {
        pattern = new RegExp(Options.previewTriggerPattern, 'gi');
        last = $Content.val().slice(-9);

        /* 如果文本末尾匹配预定义的模式 */
        if (last.match(pattern)) {
            showPreview();
        }
    }

    /* 激活回复按钮 */
    $Submit.prop('disabled', false);

    /* 激活自动备份 */
    if (AutoSaveTimer == -1)　{
        AutoSaveTimer = saveData.periodical(
            Options.autoSaveInterval * 60 * 1000, null, [true]
        );
    }
}

/* 监听主题输入框按键事件 */
function subjectHandler()
{
    var $subject = $('#rim_subject');

    if ($subject.val().bytes() > Options.maxSubjectLength)
        $subject.css('color', Options.errorStatusColor);
    else
        $subject.css('color', Options.normStatusColor);
}

/* 监听页面按键(快捷键) */
function shortcutHandlers(evt)
{
    if (!evt.altKey)
        return;

    switch (evt.keyCode) {
        case 82:  // Alt+R键打开弹出回复框
            showPopup();
            break;
        case 81:  // Alt+Q键关闭弹出回复框
            hidePopup();
            break;
        default:
            break;
    }
}

/* 监听备份恢复按键事件 */
function backupHandlers(evt)
{
    /* 清除旧的定时器 */
    clearIntervalTimer();

    switch (this.id) {
        case 'btn_save':     // 保存
            saveData(false);
            break;
        case 'btn_recover':  // 恢复
            recoverData();
            break;
        default:
            break;
    }
}

/* 监听群发信息输入框回车事件 */
function sendMsgHandler(evt) {
    var messages, title;

    /* 确认输入框有内容和回车键按下 */
    if (!this.value || evt.keyCode != 13)
        return;

    /* 清空旧状态信息 */
    $Status.empty();

    /* 设置消息正文与标题 */
    msg = [
        '我在帖子"[url=', 
        Args.original, 
        '][color=blue]', 
        Args.board,
        ' -> ', 
        Args.title, 
        '[/color][/url]"中@了你,快来看看吧~!',
    ].join('');

    title = '来自' + decode(Args.user) + '的At信息';

    /* 依次发送消息 */
    $.each(this.value.split(/[，,\s]/), function (i, u) {
        if (!u) return;

        sendMessages(u, title, msg);
    });

    $(this).toggleClass('hidden');
}

/* 监听更新个人状态回车事件 */
function updateStateHandler(evt) {
    /* 确认输入框有内容和回车键按下 */
    if (!this.value || evt.keyCode != 13)
        return;

    /* 保存个人状态信息 */
    lscache.set('rimstate', {
        timestamp: getCurrentTime(),
        value: this.value
    });

    showStatus('个人状态成功更新', 'norm', false);
    $(this).toggleClass('hidden');
}

/* 监听回复动作事件 */
function actClickHandlers(evt)
{
    var ele = evt.target;

    switch (ele.id) {
        case 'btn_cancel':  // 退出
            hidePopup();
            break;
        case 'btn_submit':  // 提交
            ele.disabled = true;
            submitReply();
            break;
        case 'btn_preview': // 预览
            togglePreview();
            break;
        default:
            break;
    }
}

/* 监听弹出回复框拖拽事件 */
function dragHandler(evt)
{
    /* 如果没有拖拽 */
    if (!DragObject)
        return;

    evt.preventDefault();

    /* 动态更新位置样式 */
    $(DragObject).css({
        left: evt.pageX - MouseOffset.left - $(document).scrollLeft(),
        top: evt.pageY - MouseOffset.top - $(document).scrollTop()
    }).addClass('dragged'); // 增加拖拽效果
}

function dragStartHandler(evt)
{
    var dragObjOffset;

    /* 使得拖拽面积更大 */
    if (evt.target.tagName.toLowerCase() != 'div')
        return;

    /* 避免拖拽的过程中选中页面上的文本 */
    //window.getSelection().removeAllRanges();
    $(document).one('mousedown', function() {
        return false;
    });

    /* 记录拖拽对象 */
    DragObject = this; // 不是evt.target
    /* 拖拽对象相对文档的偏移 */
    dragObjOffset = $(DragObject).offset(); 

    /* 记录鼠标与拖拽对象之间的偏移 */
    MouseOffset = {
        left: evt.pageX - dragObjOffset.left,
        top: evt.pageY - dragObjOffset.top
    };
}

function dragEndHandler()
{
    if (DragObject) {
        $(DragObject).removeClass('dragged'); //移除拖拽效果
        DragObject = null; // 删除拖拽对象
    }
}

/* 事件处理函数 */
function handleEvents() {
    /* 监听页面按钮点击事件 */
    $('.rim_btn_img').click(btnClickHandlers);

    /* 监听心情图标点击事件：替换回复心情 */
    $('#expr_panel').on('click', 'img', function () {
        $('.btn_expr img').attr('src', this.src);
    });

    /* 监听表情图标点击事件: 插入UBB标签到文本框*/
    $('#emot_panel').on('click', 'img', function () {
        var text = this.src.replace(/(.*?(\d+)\.gif)/, '[em$2]');
        insertIntoTextarea(text);
    });

    /* 监听主题输入框按键事件：字数限制 */
    $('#rim_subject').on('input', subjectHandler);

    /* 监听回复文本框按键等事件 */
    $Content.on('input focus', textareaHandlers);

    /* 监听回复文本框blur事件：隐藏字数统计框 */
    $Content.on('blur', function () {
        delayHideNotify($Counter, Options.keepTime); 
    });

    /* 监听Ctrl+Enter键回复 */
    $Content.keyup(function (evt) {
        if (evt.ctrlKey && evt.keyCode == 13)
            submitReply();
    });

    /* 监听按键(快捷键)操作 */
    $(document).keyup(shortcutHandlers);

    /* 监听备份与恢复等点击事件 */
    $('#rim_asvbar span').click(backupHandlers);

    /* 监听窗口退出事件: 备份帖子内容 */
    $(window).unload(function () { 
        saveData(true, true); 
    });

    /* 监听群发输入框和个人状态输入框回车事件 */
    $('#rim_send').keyup(sendMsgHandler);
    $('#rim_state').keyup(updateStateHandler);

    /* 监听状态框鼠标移入和移出事件 */
    $Status.mouseover(function () { // 鼠标悬浮时一直保持显示
        clearTimeout(StatusTimer);
    }).mouseout(function () { // 移出后延迟隐藏
        StatusTimer = delayHideNotify($Status, Options.keepTime, StatusTimer);
    });

    /* 监听回复动作事件 */
    $('.rim_action').click(actClickHandlers);

    /* 监听弹出回复框拖拽事件 */
    $(document).mousemove(dragHandler);
    $Popup.mouseup(dragEndHandler);
    $Popup.mousedown(dragStartHandler);
}

/* 初始化工作 */
function initialize()
{
    /* 解析页面参数 */
    Args = parseTopicArgs();

    /* 如果未登录，直接退出 */
    if (!Args.user) return;

    /* 加载用户设置 */
    Options = loadOptions();
    jQuery.fx.off = !Options.enableAnimate;

    /* 添加自定义的样式 */
    addCustomizedCSS();
    /* 创建快速回复/引用/编辑按钮 */
    createReplyBtns();
    /* 创建弹出回复框 */
    createReplyPopup();
}
 
/* Main 函数 */
function main() {
    /* 不在frames中再次执行该脚本 */
    if (window.top != window.self)
        return;

    /* 初始化 */
    initialize();

    /* 监听事件并处理 */
    handleEvents();
}

main();

})();
