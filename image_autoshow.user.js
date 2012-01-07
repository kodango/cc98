// ==UserScript==
// @id                auto_show_image@cc98.org 
// @name              Auto show image in cc98
// @namespace         http://dango-akachan.appspot.com
// @author            tuantuan <dangoakachan@gmail.com>
// @version           1.0
// @description       Auto show collapsed images in cc98.org
// @include           http://www.cc98.org/dispbbs.asp*
// @include           http://bbs.cc98.org/Post*
// @run-at            document-end
// ==/UserScript==

if (location.href.indexOf('http://www.cc98.org') != -1)
    location.href = "javascript:Array.prototype.forEach.call(document.getElementsByClassName('clickloadImage'), function(ele) {ele.innerHTML=loadImg(ele.href);ele.onclick=\"function(){}\";});void(0);";
else {
    // CC98 2.0 has added jQuery support 
    location.href = "javascript:jQuery('a span[class^=\"img-file-ext-\"]').parent('a').click();void(0);";
}
