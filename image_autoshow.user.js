// ==UserScript==
// @id                auto_show_image
// @name              Auto show image
// @namespace         http://www.cc98.org
// @author            tuantuan <dangoakachan@foxmail.com>
// @version           2.0
// @description       Auto show collapsed images in cc98.org
// @include           http://www.cc98.org/dispbbs.asp*
// @run-at            document-end
// ==/UserScript==

(function() {
    /* Enable image scale when hover */
    var enable_scale = true;

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
        var images, max_width, cur_width, window_width;

        /* Get an array ofimages */
        images = document.querySelectorAll("a.clickloadImage img, img.resizeable");

        /* Do nothing if not found */
        if (images.length == 0)
            return;

        if (enable_scale) {
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
                }".replace(/%scale%/g, scale);

            /* Add customized style for images */
            add_style(css);
        } else
            scale = 1;

        /* Set max width to the td node's width */
        max_width = get_parent(images[0], "td").offsetWidth;

        /* Set window width */
        window_width = window.innerWidth;

        /* Iterate each images and show */
        images = Array.prototype.slice.call(images, 0);
        images.forEach(function(image) {
            /* Collapsed images */
            if (image.className != "resizeable") {
                var parent = image.parentNode;
                parent.setAttribute("onclick", "");
                parent.innerHTML = "<img src='" + parent.href + "' border='0'>";
                image = parent.firstElementChild;
            }

            /* Wait for the image to load */
            image.addEventListener("load", function(e) {
                /* If image width is larger than window width */
                cur_width = Math.min(e.target.naturalWidth, window_width) / scale;
                /* Set image width to min(cur_width, max_width) */
                e.target.setAttribute("width", Math.min(cur_width, max_width));
            }, false);
        });
    }

    main();
})();
