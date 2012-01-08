// ==UserScript==
// @id                auto_show_image@cc98.org 
// @name              Auto show image in cc98
// @namespace         http://www.cc98.org
// @author            tuantuan <dangoakachan@gmail.com>
// @version           2.0
// @description       Auto show collapsed images in cc98.org
// @include           http://www.cc98.org/dispbbs.asp*
// @run-at            document-end
// ==/UserScript==

(function() {
    /* Zoom in/out scale */
    var scale = 1.5;

    /* Alias for getElementById */
    function $(id) { return document.getElementById(id); }

    /* Return parent node of specified object */
    function get_parent(obj, parent_tag)
    {
        if (typeof obj === "string")
            obj = $(obj);

        var parent = obj.parentNode;

        while (parent != null) {
            if (parent == document.body || parent.tagName.toLowerCase() 
                == parent_tag.toLowerCase())
                break;

            parent = parent.parentNode;
        }

        return parent;
    }

    /* Add customized style like GM_addStyle */
    var add_style = (typeof GM_addStyle != "undefined")?GM_addStyle:function(css) {
        var head = document.getElementsByTagName("head")[0];
        var style = document.createElement("style");

        style.setAttribute("type", "text/css");
        style.innerHTML = css;
        head.appendChild(style);
    };

    /* C-like Main entry */
    function main()
    {
        /* Variables definition */
        var images, max_width, cur_width;

        /* Get an array ofimages */
        images = document.querySelectorAll("a.clickloadImage img, img.resizeable");

        /* Do nothing if not found */
        if (images.length == 0)
            return;

        /* Add customized style for images */
        var css = "\
            a.clickloadImage img, img.resizeable {\
                background-color: #FFFFFF;\
                border: 1px solid #EFEFEF;\
                display: block;\
                padding: 4px;\
                margin: 0 auto 10px auto;\
            }\
            a.clickloadImage img:hover, img.resizeable:hover {\
                -webkit-transform: scale(%scale%);\
                -moz-transform: scale(%scale%);\
                -webkit-box-shadow: 0 3px 6px rgba(0,0,0,.25);\
                -moz-box-shadow: 0 3px 6px rgba(0,0,0,.25);\
                position: relative;\
                z-index: 5;\
            }\
            ".replace(/%scale%/g, scale);

        add_style(css);

        /* Set max width to the td node's width */
        max_width = get_parent(images[0], "td").offsetWidth;
        images = Array.prototype.slice.call(images, 0);

        /* Iterate each images and show */
        images.forEach(function(image) {
            if (image.className != "resizeable") {
                var parent = image.parentNode;
                parent.innerHTML = "<img src='" + parent.href + "' border='0'>";
                image = parent.firstElementChild;
            }

            /* If image width is larger than window width */
            cur_width = Math.min(image.naturalWidth, window.innerWidth) / scale;

            /* Set image width to min(cur_width, max_width) */
            image.setAttribute("width", Math.min(cur_width, max_width));
        });
    }

    main();
})();
