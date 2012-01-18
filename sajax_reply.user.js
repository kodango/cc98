// ==UserScript==
// @id             sajax_reply
// @name           Simple ajax reply
// @version        0.2
// @namespace      http://www.cc98.org
// @author         tuantuan <dangoakachan@foxmail.com>
// @description    Use ajax to avoid redirection after replying
// @include        http://www.cc98.org/dispbbs.asp*
// @include        http://www.cc98.org/reannounce.asp*
// @include        http://www.cc98.org/editannounce.asp*
// @include        http://10.10.98.98/dispbbs.asp*
// @include        http://10.10.98.98/reannounce.asp*
// @include        http://10.10.98.98/editannounce.asp*
// @run-at         document-end
// ==/UserScript==

(function() {
    /* User Setting */

    var auto_reply = true;        /* Auto reply when ten-sec ocurrs */
    var goto_last = false;        /* Go to last page when reply successfully */
    var reload_timeout = 0;       /* Reload timeout after reply */
    var default_color = "black";  /* Default status log color */
    var warn_color = "blue";      /* Warn status log color */
    var error_color = "red";      /* Error status log color */
    var font_size = "11px";       /* Font size of status log */

    /* User Setting End */

    /* Set the status logger position */
    var status_where = "reply_status";

    /* Post response string */
    var POST_SUCCESS = "本页面将在3秒后自动返回"; 
    var POST_TENSEC = "本论坛限制发贴距离时间为10秒";
    var POST_EMPTY = "没有填写内容";

    /* Express the last page with a very large number */
    var star = 32767;

    /* Get submit button */
    var submit_btn = xpath("//td[@class='tablebody2']//input[@type='submit']")
        .snapshotItem(0);

    /* Print the log to the status box */
    function logger(msg, color)
    {
        var status = document.getElementById(status_where)

        color = color || default_color;
        msg = "<font color='" + color + "'>" + msg + "</font>";
        status.innerHTML = msg;
        status.style.display = "inline";
    }

    /* Evaluate a xpath expression */
    function xpath(path)
    {
        return document.evaluate(
            path, document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
    }

    /* Add customized style like GM_addStyle */
    function add_style(css)
    {
        var head = document.getElementsByTagName("head")[0];
        var style = document.createElement("style");

        style.setAttribute("type", "text/css");
        style.innerHTML = css;
        head.appendChild(style);
    }

    /* Do ajax post request */
    function xhr_post(url, data, callback)
    {
        /* Create a request object */
        var req = new XMLHttpRequest();

        req.open("POST", url, true);
        req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

        /* If callback is a function, bind it to onload event */
        if (typeof callback == "function")
            req.onload = callback;
        else if (typeof callback == "object")
            /* Otherwise, callback is a event object as {"event": "callback"} */
            for (var attr in callback)
                req[attr] = callback[attr];

        /* Send the post data */
        req.send(data);
    }

    /* Get original url when quote or edit a post */
    function get_orig_url(url)
    {
        return url.replace(/(?:re|edit)announce/, "dispbbs").replace(/reply.*?&/g, "")
            .replace(/&bm=/, "#");
    }

    /* Get the url of last reply */
    function get_last_reply_url(url)
    {
        return get_orig_url(url).replace(/(star=)\d*/, "$1" + star)
            .replace(/#.*/, "#bottom");
    }

    /* Do ajax post with the form */
    function ajax_post(form, fields, encode_fields, callback)
    {
        /* Form post data */
        var form_data = [];

        /* Convert NodeList to an array */
        var elements = Array.prototype.slice.call(form.elements, 0);
        var elem, name;

        /* Iterate each element to construct form data */
        for (var i in elements) {
            /* Get the element */
            elem = elements[i];

            /* Assign  name to either name or id attribute */
            name = elem.name || elem.id;

            /* Filter the elements, whose name is empty, or not in fields, or
             * not checked radio element */
            if (name == "" || fields.indexOf(name.toLowerCase()) == -1
                || (elem.type == "radio" && !elem.checked))
                continue;

            /* Construct the form_data */
            if (encode_fields.indexOf(name.toLowerCase()) != -1 )
                form_data[form_data.length] = name + "=" + encodeURIComponent(elem.value);
            else
                form_data[form_data.length] = name + "=" + elem.value;
        }

        /* Join each items in form_data array */
        form_data = form_data.join("&");

        /* Do a xhr post */
        xhr_post(form.action, form_data, callback);
    }

    /* Submit the reply form */
    function form_submit()
    {
        /* Get reply form */
        var form = submit_btn.form;

        /* The fields we need when do a post */
        var fields = ["followup", "rootid", "subject", "upfilerename",
            "username", "passwd", "star", "totalusetable", "content",
            "expression", "signflag"];

        /* The fields we need to encode when post */
        var encode_fields = [ "content" ];

        /* Do ajax post */
        ajax_post(form, fields, encode_fields, {"onreadystatechange": post_callback});
    }

    /* Callback function for ajax post */
    function post_callback(e)
    {
        /* Get the request object */
        var req = e.target || this;

        /* Response is not ready or request fail */
        if (req.readyState != 4 || req.status != 200)
            return;

        /* Get the response text */
        var response = req.responseText;

        /* If reply success fully */
        if (response.indexOf(POST_SUCCESS) != -1) {
            logger("回复帖子成功，将会在" + reload_timeout + "秒后自动刷新");
            setTimeout(function() {
                var url = location.href;

                if (url.indexOf("dispbbs") != -1) { /* If fast reply */
                    url = get_last_reply_url(url);
                } else  /* Otherwise, quote reply */
                    url = goto_last?get_last_reply_url(url):get_orig_url(url);

                if (url == location.href)
                    location.reload();
                else
                    location.href = url;
            }, reload_timeout);

            return;
        }

        /* Get the error text from response */
        var error_text = response.match(/产生错误的原因：([\w\W]+)请您仔细阅读了/)[1]
            .replace(/\n/g, " ").replace(/<[^>]*?>/g, "").replace(/\s*(.*)\s*/, "$1");

        /* Print the status log */
        logger(error_text, error_color);

        /* Empty repy content */
        if (error_text.indexOf(POST_EMPTY) != -1) {
            submit_btn.disabled = false;
            return;
        }

        /* If the interval of two replies is less than ten seconds */
        if (error_text.indexOf(POST_TENSEC) != -1) {
            /* Save submit button value */
            var val = submit_btn.value;
            submit_btn.value = val + "[剩余" + 10 + "秒]";

            /* Update the countdown time */
            for (var i = 9; i >= 1; i--) {
                setTimeout((function(i) {
                    return function() { submit_btn.value = val + "[剩余" + i + "秒]"; }
                })(i), (10 - i) * 1000);
            }

            /* Restore submit button */
            setTimeout(function() {
                /* Restore submit button value */
                submit_btn.value = val;

                if (auto_reply) { /* Auto reply */
                    logger("10秒后自动回复");
                    form_submit();
                } else { /* Enable submit button */
                    logger("10秒后手动回复");
                    submit_btn.disabled = false;
                }
            }, 10 * 1000);
        }

        return;
    }

    /* C-like main entry */
    function main()
    {
        /* Add status notification box */
        var status = document.createElement("pre");
        status.id = status_where;
        submit_btn.parentNode.insertBefore(status, submit_btn);

        /* Add customized style for select menu */
        add_style("\
            #reply_status {\
                font-size: %(font_size)%;\
                width: 50px;\
                margin-right: 5px;\
                display: none;\
            }\
        ".replace("%(font_size)%", font_size));

        /* Enable the submit button when reloading */
        submit_btn.disabled = false;

        /* Bind click event to submit button */
        submit_btn.addEventListener("click", function(e) {
            /* Prevent default handle */
            e.preventDefault();
            /* Disable submit button */
            e.target.disabled = true;
            /* Submit the reply form */
            form_submit();
        }, false);
    }

    main();
})();
