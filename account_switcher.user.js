// ==UserScript==
// @name           CC98 Account Switcher
// @namespace      account_switcher@cc98.org
// @description    Quickly switch betwwen different accounts in cc98.org
// @author         tuantuan <dangoakachan@gmail.com>
// @version        0.1
// @include        http://www.cc98.org/*
// ==/UserScript==

/*
 * Muti-account setting
 * format: 
 *      "name":"passwd"
 */
var accounts = {
};

/*
 * Do not modify these code below!
 *
 */

// Helper functions definition begin

/*
 *
 * Create a cookie with the given key and value and other optional parameters.
 * or get the value of a cookie with the given key.
 *
 * code from: https://github.com/carhartl/jquery-cookie/blob/master/jquery.cookie.js
 */
function cookie(key, value, options) 
{
    if (arguments.length > 1 && String(value) !== "[object Object]") {
        options = options || {};

        if (value === null || vnalue === undefined)
            options.expires = -1;

        if (typeof options.expires === "number") {
            var days = options.expires;
            var t = options.expires = new Date();

            t.setDate(t.getDate() + days);
        }

        value = String(value);

        document.cookie = [
            encodeURIComponent(key), "=",
            options.raw ? value : encodeURIComponent(value),
            options.expires ? "; expires=" + options.expires.toUTCString() : "",
            options.path ? "; path=" + options.path : "/",
            options.domain ? "; domain=" + options.domain : "",
            options.secure ? "; secure" : ""].join("");

        return document.cookie;
    }

    options = value || {};
    var result;
    var decode = options.raw ? function (s) s : decodeURIComponent;

    return (result = new RegExp('(?:^|; )' + encodeURIComponent(key) + 
        '=([^;]*)').exec(document.cookie)) ? decode(result[1]) : "";
}

// Use md5 algorithm to encrypt string s and return hex string
function md5_hex(s)
{
    s = String(s);

    if (typeof GM_cryptoHash !== "undefined") // Scriptish API
        return GM_cryptoHash(s, "MD5", "UTF-8");
    else if (typeof hex_md5 !== "undefined") // From CC98 js/md5.js
        return hex_md5(s);
    else
        alert("Require MD5 hash algorithm, add below line at the\n" + 
            "beginning (under @version) of this file:\n" +
            "\n\t@require http://www.cc98.org/js/md5.js\n\n" + 
            "and then reinstall this script.");

        return s;
} 

// Reload current page
function reloadPage(flag)
{
    if (flag)
        location.reload();
}

// Using xpath
function xpath(expr)
{
    return document.evaluate(
        expr,
        document,
        null,
		XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
        null
    );
}

// For simple, no more check
function xhrPost(url, data, loadcallback)
{
    var req = new XMLHttpRequest();

    req.open("POST", url, true)
    req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    req.onload = loadcallback;
    req.send(data);
}

// Helper functions end

// Determine sign in or not
function isSignedIn(username)
{
    if (cookie("aspsky").indexOf(username) != -1)
        return true;
    else
        return false;
}

// Sign in CC98.org
function signIn(username, password, reload) {
    var data, hashedPasswd;

    if (typeof reload == "undefined") // reload after logging in
        reload = true;

    if (isSignedIn(username)) // Already Log in
        return;

    hashedPasswd = md5_hex(password);

    if (hashedPasswd == password) // No hash algorithm
        return;

    data = "a=i&u=" + encodeURIComponent(username) + 
        "&p=" + encodeURIComponent(hashedPasswd) + "&userhidden=2";

    xhrPost("http://www.cc98.org/sign.asp", data, function(e) {
        req = e.target || this;

        switch(req.responseText) {
            case "9898":
                reloadPage(reload);
                break;
            case "1003":
                alert("Wrong Password!");
                break;
            case "1002":
                alert("The username has been locked!");
                break;
            case "1001":
                alert("The username doesn't exist!");
                break;
            default:
                alert("Some other problem!");
                break;
        }
    });
}

// Sign out CC98.org
function signOut(reload) {
    if (typeof reload == "undefined")
        reload = true;

    if (cookie("aspsky")) {
        xhrPost("http://www.cc98.org/sign.asp", "a=o", function(e) {
            req = e.target || this;

            if (req.status == 200) {
                cookie("aspsky", null);
                reloadPage(reload);
            }
        });
    }
}

// Muti account switcher
function multiSwitcher()
{
    var add = "";
    var rel = xpath("//td[@class='TopLighNav1']//b").snapshotItem(0).nextElementSibling;

    for (var name in accounts) {
        if (isSignedIn(name))
            continue;

        if (add == "")
            add = "<br />----------<br />";

        add += '<a class="mainjs cc_id" href="javascript:">' +
            name + '</a><br />';
    }

    if (cookie("aspsky")) {
        unsafeWindow.logon += add;
    } else {
        unsafeWindow.manage1 += add;
    }

    function handler_click(e)
    {
        var target = e.target || this;
        var name = target.innerHTML;

        signOut(false);
        signIn(name, accounts[name]);
    }

    function handler_mouseover(e)
    {
        cc_id = document.getElementsByClassName("cc_id");

        for (var i = 0; i < cc_id.length; i++) {
            let j = i;
            cc_id[j].addEventListener("click", handler_click, false);
        }
    }

    rel.addEventListener("mouseover", handler_mouseover, false);
}

function postAs()
{
    var submitbtn = document.getElementsByName("Submit")[0];
    var select = document.createElement("select");
    var text = document.createTextNode("Post as: ");

    submitbtn.parentNode.insertBefore(text, submitbtn); 
    submitbtn.parentNode.insertBefore(select, submitbtn);
    select.id = "postas";
    select.style.marginRight = "10px";
    //select.innerHTML = "<option value=''>Post as ... </option>";

    for (var name in accounts) {
        var o = new Option(name, name) ;

        if (isSignedIn(name))
            o.setAttribute("selected", "selected");

        select.options[select.length] = o;
    }

    function handler_change(e)
    {
        var target = e.target || this;

        if (!isSignedIn(target.value)) {
            signIn(target.value, accounts[target.value]);
        }
    }

    select.addEventListener("change", handler_change, false);
}

if (cookie("aspsky") && (location.href.indexOf("announce.asp") != -1 ||
    location.href.indexOf("dispbbs.asp") != -1))
    postAs();

multiSwitcher();
