// ==UserScript==
// @name           CC98 Account Switcher
// @namespace      account_switcher@cc98.org
// @description    Quickly switch betwwen different accounts in cc98.org
// @author         tuantuan <dangoakachan@gmail.com>
// @version        0.1
// @match        http://www.cc98.org/*
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
    var decode = options.raw ? function (s) { return s; } : decodeURIComponent;

    return (result = new RegExp('(?:^|; )' + encodeURIComponent(key) + 
        '=([^;]*)').exec(document.cookie)) ? decode(result[1]) : "";
}

// Use md5 algorithm to encrypt string s and return hex string
function md5_hex(s)
{
    s = String(s);

    return hex_md5(s);
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
        location.href = "javascript:window.logon +='" + add + "';void(0);";
    } else {
        location.href = "javascript:window.manage1 +='" + add + "';void(0);";
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
            cc_id[i].addEventListener("click", handler_click, false);
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

// for md5
var hexcase=0;var b64pad="";var chrsz=8;function hex_md5(s){return binl2hex(core_md5(str2binl(s),s.length*chrsz));}
function b64_md5(s){return binl2b64(core_md5(str2binl(s),s.length*chrsz));}
function str_md5(s){return binl2str(core_md5(str2binl(s),s.length*chrsz));}
function hex_hmac_md5(key,data){return binl2hex(core_hmac_md5(key,data));}
function b64_hmac_md5(key,data){return binl2b64(core_hmac_md5(key,data));}
function str_hmac_md5(key,data){return binl2str(core_hmac_md5(key,data));}
function md5_vm_test()
{return hex_md5("abc")=="900150983cd24fb0d6963f7d28e17f72";}
function core_md5(x,len)
{x[len>>5]|=0x80<<((len)%32);x[(((len+64)>>>9)<<4)+14]=len;var a=1732584193;var b=-271733879;var c=-1732584194;var d=271733878;for(var i=0;i<x.length;i+=16)
{var olda=a;var oldb=b;var oldc=c;var oldd=d;a=md5_ff(a,b,c,d,x[i+0],7,-680876936);d=md5_ff(d,a,b,c,x[i+1],12,-389564586);c=md5_ff(c,d,a,b,x[i+2],17,606105819);b=md5_ff(b,c,d,a,x[i+3],22,-1044525330);a=md5_ff(a,b,c,d,x[i+4],7,-176418897);d=md5_ff(d,a,b,c,x[i+5],12,1200080426);c=md5_ff(c,d,a,b,x[i+6],17,-1473231341);b=md5_ff(b,c,d,a,x[i+7],22,-45705983);a=md5_ff(a,b,c,d,x[i+8],7,1770035416);d=md5_ff(d,a,b,c,x[i+9],12,-1958414417);c=md5_ff(c,d,a,b,x[i+10],17,-42063);b=md5_ff(b,c,d,a,x[i+11],22,-1990404162);a=md5_ff(a,b,c,d,x[i+12],7,1804603682);d=md5_ff(d,a,b,c,x[i+13],12,-40341101);c=md5_ff(c,d,a,b,x[i+14],17,-1502002290);b=md5_ff(b,c,d,a,x[i+15],22,1236535329);a=md5_gg(a,b,c,d,x[i+1],5,-165796510);d=md5_gg(d,a,b,c,x[i+6],9,-1069501632);c=md5_gg(c,d,a,b,x[i+11],14,643717713);b=md5_gg(b,c,d,a,x[i+0],20,-373897302);a=md5_gg(a,b,c,d,x[i+5],5,-701558691);d=md5_gg(d,a,b,c,x[i+10],9,38016083);c=md5_gg(c,d,a,b,x[i+15],14,-660478335);b=md5_gg(b,c,d,a,x[i+4],20,-405537848);a=md5_gg(a,b,c,d,x[i+9],5,568446438);d=md5_gg(d,a,b,c,x[i+14],9,-1019803690);c=md5_gg(c,d,a,b,x[i+3],14,-187363961);b=md5_gg(b,c,d,a,x[i+8],20,1163531501);a=md5_gg(a,b,c,d,x[i+13],5,-1444681467);d=md5_gg(d,a,b,c,x[i+2],9,-51403784);c=md5_gg(c,d,a,b,x[i+7],14,1735328473);b=md5_gg(b,c,d,a,x[i+12],20,-1926607734);a=md5_hh(a,b,c,d,x[i+5],4,-378558);d=md5_hh(d,a,b,c,x[i+8],11,-2022574463);c=md5_hh(c,d,a,b,x[i+11],16,1839030562);b=md5_hh(b,c,d,a,x[i+14],23,-35309556);a=md5_hh(a,b,c,d,x[i+1],4,-1530992060);d=md5_hh(d,a,b,c,x[i+4],11,1272893353);c=md5_hh(c,d,a,b,x[i+7],16,-155497632);b=md5_hh(b,c,d,a,x[i+10],23,-1094730640);a=md5_hh(a,b,c,d,x[i+13],4,681279174);d=md5_hh(d,a,b,c,x[i+0],11,-358537222);c=md5_hh(c,d,a,b,x[i+3],16,-722521979);b=md5_hh(b,c,d,a,x[i+6],23,76029189);a=md5_hh(a,b,c,d,x[i+9],4,-640364487);d=md5_hh(d,a,b,c,x[i+12],11,-421815835);c=md5_hh(c,d,a,b,x[i+15],16,530742520);b=md5_hh(b,c,d,a,x[i+2],23,-995338651);a=md5_ii(a,b,c,d,x[i+0],6,-198630844);d=md5_ii(d,a,b,c,x[i+7],10,1126891415);c=md5_ii(c,d,a,b,x[i+14],15,-1416354905);b=md5_ii(b,c,d,a,x[i+5],21,-57434055);a=md5_ii(a,b,c,d,x[i+12],6,1700485571);d=md5_ii(d,a,b,c,x[i+3],10,-1894986606);c=md5_ii(c,d,a,b,x[i+10],15,-1051523);b=md5_ii(b,c,d,a,x[i+1],21,-2054922799);a=md5_ii(a,b,c,d,x[i+8],6,1873313359);d=md5_ii(d,a,b,c,x[i+15],10,-30611744);c=md5_ii(c,d,a,b,x[i+6],15,-1560198380);b=md5_ii(b,c,d,a,x[i+13],21,1309151649);a=md5_ii(a,b,c,d,x[i+4],6,-145523070);d=md5_ii(d,a,b,c,x[i+11],10,-1120210379);c=md5_ii(c,d,a,b,x[i+2],15,718787259);b=md5_ii(b,c,d,a,x[i+9],21,-343485551);a=safe_add(a,olda);b=safe_add(b,oldb);c=safe_add(c,oldc);d=safe_add(d,oldd);}
return Array(a,b,c,d);}
function md5_cmn(q,a,b,x,s,t)
{return safe_add(bit_rol(safe_add(safe_add(a,q),safe_add(x,t)),s),b);}
function md5_ff(a,b,c,d,x,s,t)
{return md5_cmn((b&c)|((~b)&d),a,b,x,s,t);}
function md5_gg(a,b,c,d,x,s,t)
{return md5_cmn((b&d)|(c&(~d)),a,b,x,s,t);}
function md5_hh(a,b,c,d,x,s,t)
{return md5_cmn(b^c^d,a,b,x,s,t);}
function md5_ii(a,b,c,d,x,s,t)
{return md5_cmn(c^(b|(~d)),a,b,x,s,t);}
function core_hmac_md5(key,data)
{var bkey=str2binl(key);if(bkey.length>16)bkey=core_md5(bkey,key.length*chrsz);var ipad=Array(16),opad=Array(16);for(var i=0;i<16;i++)
{ipad[i]=bkey[i]^0x36363636;opad[i]=bkey[i]^0x5C5C5C5C;}
var hash=core_md5(ipad.concat(str2binl(data)),512+data.length*chrsz);return core_md5(opad.concat(hash),512+128);}
function safe_add(x,y)
{var lsw=(x&0xFFFF)+(y&0xFFFF);var msw=(x>>16)+(y>>16)+(lsw>>16);return(msw<<16)|(lsw&0xFFFF);}
function bit_rol(num,cnt)
{return(num<<cnt)|(num>>>(32-cnt));}
function str2binl(str)
{var bin=Array();var mask=(1<<chrsz)-1;for(var i=0;i<str.length*chrsz;i+=chrsz)
bin[i>>5]|=(str.charCodeAt(i/chrsz)&mask)<<(i%32);return bin;}
function binl2str(bin)
{var str="";var mask=(1<<chrsz)-1;for(var i=0;i<bin.length*32;i+=chrsz)
str+=String.fromCharCode((bin[i>>5]>>>(i%32))&mask);return str;}
function binl2hex(binarray)
{var hex_tab=hexcase?"0123456789ABCDEF":"0123456789abcdef";var str="";for(var i=0;i<binarray.length*4;i++)
{str+=hex_tab.charAt((binarray[i>>2]>>((i%4)*8+4))&0xF)+
hex_tab.charAt((binarray[i>>2]>>((i%4)*8))&0xF);}
return str;}
function binl2b64(binarray)
{var tab="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";var str="";for(var i=0;i<binarray.length*4;i+=3)
{var triplet=(((binarray[i>>2]>>8*(i%4))&0xFF)<<16)|(((binarray[i+1>>2]>>8*((i+1)%4))&0xFF)<<8)|((binarray[i+2>>2]>>8*((i+2)%4))&0xFF);for(var j=0;j<4;j++)
{if(i*8+j*6>binarray.length*32)str+=b64pad;else str+=tab.charAt((triplet>>6*(3-j))&0x3F);}}
return str;}
