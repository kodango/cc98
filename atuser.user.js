// ==UserScript==
// @id             atUser
// @name           At user
// @version        1.0
// @namespace      www.cc98.org
// @author         dango
// @description    Support @user  when post a reply
// @include        http://www.cc98.org/dispbbs.asp*
// @include        http://10.10.98.98/dispbbs.asp*
// @include        http://www.cc98.org/reannounce.asp*
// @include        http://10.10.98.98/reannounce.asp*
// @include        http://www.cc98.org/editannounce.asp*
// @include        http://10.10.98.98/editannounce.asp*
// @run-at         document-end
// ==/UserScript==

/* User Settings */
var timeout = 1000;
/* User Settings End */

/* Do not modify below codes */
var QUOTREPLY = 1;
var FASTREPLY = 2;
var EDITREPLY = 3;

/* Yeah xpath evaluator */
function xpath(xstr) 
{
    return document.evaluate(
        xstr, document, null,
        XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
}

function $(id) { return document.getElementById(id); }

/* Acquire the logger */
var logger = (typeof GM_log != "undefined")?GM_log:console.log;
var add_css = (typeof GM_addStyle != "undefined")?GM_addStyle:function(css) {
    var head = document.getElementsByTagName("head")[0];
    var style = document.createElement("style");

    style.setAttribute("type", "text/css");
    style.innerHTML = css;
    head.appendChild(style);
};

var cc98 = (function () {
    /* Return object */
    var ret = {};

    /* Relative URL */
    var url = (location.pathname + location.search).toLowerCase();

    /* Set type of reply post */
    if (url.indexOf("dispbbs") != -1)
        ret.reply_type =  FASTREPLY;
    else if (url.indexOf("editannounce") != -1)
        ret.reply_type = EDITREPLY;
    else
        ret.reply_type = QUOTREPLY;

    var args = url.split("?", 2)[1].split("&");
    var arg_name, arg_val;
    
    /* Parse and get the search parameters in url */
    for (var i = 0, len = args.length; i < len; i++) {
        [arg_name, arg_val] = args[i].split("=");
        ret[arg_name] = arg_val;
    }

    url = url.replace(/(?:re|edit)announce/, "dispbbs").replace(/reply.*?&/g, "")
        .replace(/&bm=/, "#");
    ret.url = url;

    /* Set title to current topic */
    if (ret.reply_type == FASTREPLY)
        ret.title = document.title.replace(/ » CC98论坛/, "");
    else
        ret.title = window.sessionStorage.getItem(ret.id) || "这个帖子";

    /* Set board name */
    var nodes = xpath("//table[@class='tableBorder2']//td[@valign= \
        'middle']/a[starts-with(@href, 'list.asp')]");

    if (nodes.snapshotLength == 2)
        ret.board_name = nodes.snapshotItem(1).innerHTML;
    else
        ret.board_name = "未知版面";

    /* Need user name may be */
    var user_name = document.cookie.replace(/.*username=(.*?)&.*/g, "$1");
    ret.user_name = decodeURIComponent(user_name);

    /* We will get submit button here */
    var submit_btn = xpath("//td[@class='tablebody2']//input[@type='submit']")
        .snapshotItem(0);

    ret.submit = submit_btn.form.submit;
    ret.submit_btn = submit_btn;
    ret.text_area = $("content");

    return ret;
})();

function send_messages(user, title, message)
{
    var xhr = new XMLHttpRequest();
    var data = "touser=" + encodeURIComponent(user) + "&title=" + encodeURIComponent(title)
        + "&message=" + encodeURIComponent(message);

    xhr.onreadystatechange = function() {
        if (xhr.readyState != 4 || xhr.status != 200)
            return;

        if (xhr.responseText.indexOf("操作成功") != -1) {
            $("status").innerHTML += "@" + user + " ";
        } else
            $("status").innerHTML += "<font color='red'>@" + user + "</font> ";
    }

    xhr.open("post", "http://www.cc98.org/messanger.asp?action=send", true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8");
    xhr.send(data);
}

/* Procee @user in the post */
function process_content()
{
    var textarea = cc98.text_area;
    var content = textarea.value.replace(/^\[quotex?\][\w\W]*\[\/quotex?\]/ig, "");

    var at_users = content.match(/@[^\s[@]{2,10}/g);

    if (at_users == null) {
        logger("Doesn't found any @user");
        cc98.submit();
        return;
    }

    /* Remove @ prefix in at users */
    at_users = at_users.map(function(item, index, arr) {
        return item.slice(1);
    });

    /* Remove duplicated users */
    at_users = at_users.filter(function(item, index, arr) {
        return index == arr.lastIndexOf(item);
    });

    logger("At users in the reply: " + at_users);

    /* @ message */
    var messages = "我在帖子[url=%url%][color=blue]%title%[/color][/url]中@了你,快来看看吧~!".
        replace(/%(\w+)%/g, function(attr, p1) {
            return cc98[p1];
        });

    /* When edit post, check whether the messages has been sent to sb */
    var send_users = window.sessionStorage.getItem(cc98.replyid);

    if (send_users == null || send_users == "") {
        window.sessionStorage.setItem(cc98.replyid, at_users);
    } else {
        send_users = send_users.split(",");
        logger("Users that have been sent last time: " + send_users);

        /* Filter the users that have been sent to */
        at_users = at_users.filter(function(item, index, arr) {
            return send_users.indexOf(item) == -1;
        });

        window.sessionStorage.setItem(cc98.replyid, 
            send_users.concat(at_users));
    }

    logger("At users that will be sent to: " + at_users);

    if (at_users.length > 0) {
        $("message").innerHTML = "发现的@user列表: " + at_users;

        for (var i = 0, size = at_users.length; i < size; i++) {
            logger("Send message to " + at_users[i]);
            send_messages(at_users[i], "AtUser Messages from " + cc98.user_name, messages);
        }
    } else
        timeout = 0;

    setTimeout(cc98.submit, timeout);

    return;
}

/* Listen post event */
function post_listen() 
{
    var btns = xpath("//img[contains(@src, 'reply.gif') or \
        contains(@src, 'edit.gif')]");
    var i, len = btns.snapshotLength;

    logger("Listen post event");
    for (i = 0; i < len; i++) {
        btns.snapshotItem(i).addEventListener("mousedown", function(e) {
            logger("Save '" + cc98.id + ": " + cc98.title + "' to session storage.");
            window.sessionStorage.setItem(cc98.id, cc98.title);
        }, false);
    }
}

/* Listen submit event */
function submit_listen() 
{
    logger("Listen submit event");
    cc98.submit_btn.addEventListener("click", function(e) {
        e.preventDefault();
        process_content();
    }, false);
}

/* Listen ctrl+enter key event */
function ctrl_enter_listen()
{
    window.addEventListener("keydown", function(e) {
        if (e.target.id != "content")
            return;

        if (e.ctrlKey && e.keyCode == 13)
            process_content();
    });
}

/* The c-like main entry */
function main()
{
    /* Listen post event in fast reply */
    if (cc98.reply_type == FASTREPLY)
        post_listen();

    /* Listen submit event */
    submit_listen();

    /* Create status dialog for show messages */
    var status_dialog = document.createElement("div");
    status_dialog.id = "status_dialog";

    var pos = $("EditArea");
    pos.insertBefore(status_dialog, pos.lastElementChild);

    var span = document.createElement("span");
    span.id = "message";
    status_dialog.appendChild(span);

    span = document.createElement("span");
    span.id = "status";
    status_dialog.appendChild(span);
    
    add_css("\
        #status_dialog {\
            padding: 5px;\
            font-family: sans-serif;\
            font-bold: true;\
            font-size: 13px;\
        }\
        #status_dialog #message {\
            display: block;\
        }\
    ");
}

main();
