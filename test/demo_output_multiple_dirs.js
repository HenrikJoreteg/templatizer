(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.templatizer = factory();
    }
}(this, function () {
    var jade=function(){function r(r){return null!=r&&""!==r}function n(e){return Array.isArray(e)?e.map(n).filter(r).join(" "):e}var e={};return e.merge=function t(n,e){if(1===arguments.length){for(var a=n[0],s=1;s<n.length;s++)a=t(a,n[s]);return a}var i=n["class"],l=e["class"];(i||l)&&(i=i||[],l=l||[],Array.isArray(i)||(i=[i]),Array.isArray(l)||(l=[l]),n["class"]=i.concat(l).filter(r));for(var o in e)"class"!=o&&(n[o]=e[o]);return n},e.joinClasses=n,e.cls=function(r,t){for(var a=[],s=0;s<r.length;s++)a.push(t&&t[s]?e.escape(n([r[s]])):n(r[s]));var i=n(a);return i.length?' class="'+i+'"':""},e.attr=function(r,n,t,a){return"boolean"==typeof n||null==n?n?" "+(a?r:r+'="'+r+'"'):"":0==r.indexOf("data")&&"string"!=typeof n?" "+r+"='"+JSON.stringify(n).replace(/'/g,"&apos;")+"'":t?" "+r+'="'+e.escape(n)+'"':" "+r+'="'+n+'"'},e.attrs=function(r,t){var a=[],s=Object.keys(r);if(s.length)for(var i=0;i<s.length;++i){var l=s[i],o=r[l];"class"==l?(o=n(o))&&a.push(" "+l+'="'+o+'"'):a.push(e.attr(l,o,!1,t))}return a.join("")},e.escape=function(r){var n=String(r).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");return n===""+r?r:n},e.rethrow=function a(r,n,e,t){if(!(r instanceof Error))throw r;if(!("undefined"==typeof window&&n||t))throw r.message+=" on line "+e,r;try{t=t||require("fs").readFileSync(n,"utf8")}catch(s){a(r,null,e)}var i=3,l=t.split("\n"),o=Math.max(e-i,0),c=Math.min(l.length,e+i),i=l.slice(o,c).map(function(r,n){var t=n+o+1;return(t==e?"  > ":"    ")+t+"| "+r}).join("\n");throw r.path=n,r.message=(n||"Jade")+":"+e+"\n"+i+"\n\n"+r.message,r},e}();

    var templatizer = {};
    templatizer["otherfolder"] = {};
    templatizer["otherfolder"]["deep2"] = {};
    templatizer["otherfolder"]["deepnested"] = {};

    // 404.jade compiled template
    templatizer["404"] = function tmpl_404() {
        return '<div class="page-404">404!</div>';
    };

    // 404withVars.jade compiled template
    templatizer["404withVars"] = function tmpl_404withVars(locals) {
        var buf = [];
        var jade_mixins = {};
        var jade_interp;
        var locals_for_with = locals || {};
        (function(content) {
            buf.push('<div class="page-404">' + jade.escape((jade_interp = content || "404") == null ? "" : jade_interp) + "!</div>");
        })("content" in locals_for_with ? locals_for_with.content : typeof content !== "undefined" ? content : undefined);
        return buf.join("");
    };

    // mixins.jade compiled template
    templatizer["mixins"] = function tmpl_mixins(locals) {
        var buf = [];
        var jade_mixins = {};
        var jade_interp;
        buf.push("<ul>");
        buf.push(templatizer["mixins"]["test"]());
        buf.push("</ul>");
        return buf.join("");
    };

    // mixins.jade:test compiled template
    templatizer["mixins"]["test"] = function tmpl_mixins_test(user, index) {
        var block = this && this.block, attributes = this && this.attributes || {}, buf = [];
        buf.push("<li>test</li>");
        return buf.join("");
    };

    // mixinsWithBlocks.jade compiled template
    templatizer["mixinsWithBlocks"] = function tmpl_mixinsWithBlocks(locals) {
        var buf = [];
        var jade_mixins = {};
        var jade_interp;
        buf.push(templatizer["mixinsWithBlocks"]["MyModal"].call({
            block: function(buf) {
                buf.push("<p>some body text</p>");
            }
        }, "foo"));
        return buf.join("");
    };

    // mixinsWithBlocks.jade:MyModal compiled template
    templatizer["mixinsWithBlocks"]["MyModal"] = function tmpl_mixinsWithBlocks_MyModal(title) {
        var block = this && this.block, attributes = this && this.attributes || {}, buf = [];
        buf.push("<h1>" + jade.escape(null == (jade_interp = title) ? "" : jade_interp) + '</h1><div class="body">');
        block && block(buf);
        buf.push("</div>");
        return buf.join("");
    };

    // mixinsWithoutBlocks.jade compiled template
    templatizer["mixinsWithoutBlocks"] = function tmpl_mixinsWithoutBlocks(locals) {
        var buf = [];
        var jade_mixins = {};
        var jade_interp;
        buf.push(templatizer["mixinsWithoutBlocks"]["MyModal"]("foo"));
        return buf.join("");
    };

    // mixinsWithoutBlocks.jade:MyModal compiled template
    templatizer["mixinsWithoutBlocks"]["MyModal"] = function tmpl_mixinsWithoutBlocks_MyModal(title) {
        var block = this && this.block, attributes = this && this.attributes || {}, buf = [];
        buf.push("<h1>" + jade.escape(null == (jade_interp = title) ? "" : jade_interp) + '</h1><div class="body"><p>some body text</p></div>');
        return buf.join("");
    };

    // otherfolder/deep2/deeptweet.jade compiled template
    templatizer["otherfolder"]["deep2"]["deeptweet"] = function tmpl_otherfolder_deep2_deeptweet(locals) {
        var buf = [];
        var jade_mixins = {};
        var jade_interp;
        var locals_for_with = locals || {};
        (function(tweet) {
            buf.push('<li class="tweet">' + jade.escape(null == (jade_interp = tweet) ? "" : jade_interp) + "</li>");
        })("tweet" in locals_for_with ? locals_for_with.tweet : typeof tweet !== "undefined" ? tweet : undefined);
        return buf.join("");
    };

    // otherfolder/deepnested/deeptweet.jade compiled template
    templatizer["otherfolder"]["deepnested"]["deeptweet"] = function tmpl_otherfolder_deepnested_deeptweet(locals) {
        var buf = [];
        var jade_mixins = {};
        var jade_interp;
        var locals_for_with = locals || {};
        (function(tweet) {
            buf.push('<li class="tweet">' + jade.escape(null == (jade_interp = tweet) ? "" : jade_interp) + "</li>");
        })("tweet" in locals_for_with ? locals_for_with.tweet : typeof tweet !== "undefined" ? tweet : undefined);
        return buf.join("");
    };

    // otherfolder/nestedMixin.jade compiled template
    templatizer["otherfolder"]["nestedMixin"] = function tmpl_otherfolder_nestedMixin(locals) {
        var buf = [];
        var jade_mixins = {};
        var jade_interp;
        var locals_for_with = locals || {};
        (function(users) {
            buf.push("<ul>");
            var i = 0;
            (function() {
                var $obj = users;
                if ("number" == typeof $obj.length) {
                    for (var $index = 0, $l = $obj.length; $index < $l; $index++) {
                        var user = $obj[$index];
                        buf.push(templatizer["otherfolder"]["nestedMixin"]["user_li"](user, i));
                        i++;
                    }
                } else {
                    var $l = 0;
                    for (var $index in $obj) {
                        $l++;
                        var user = $obj[$index];
                        buf.push(templatizer["otherfolder"]["nestedMixin"]["user_li"](user, i));
                        i++;
                    }
                }
            }).call(this);
            buf.push("</ul>");
        })("users" in locals_for_with ? locals_for_with.users : typeof users !== "undefined" ? users : undefined);
        return buf.join("");
    };

    // otherfolder/nestedMixin.jade:user_li compiled template
    templatizer["otherfolder"]["nestedMixin"]["user_li"] = function tmpl_otherfolder_nestedMixin_user_li(user, index) {
        var block = this && this.block, attributes = this && this.attributes || {}, buf = [];
        buf.push("<li" + jade.attr("data-user-id", user.id, true, false) + jade.attr("data-user-index", index, true, false) + ">test</li>");
        return buf.join("");
    };

    // otherfolder/othertweet.jade compiled template
    templatizer["otherfolder"]["othertweet"] = function tmpl_otherfolder_othertweet(locals) {
        var buf = [];
        var jade_mixins = {};
        var jade_interp;
        var locals_for_with = locals || {};
        (function(user) {
            buf.push('<li class="tweet">' + jade.escape(null == (jade_interp = user) ? "" : jade_interp) + "</li>");
        })("user" in locals_for_with ? locals_for_with.user : typeof user !== "undefined" ? user : undefined);
        return buf.join("");
    };

    // underscoreUsers.jade compiled template
    templatizer["underscoreUsers"] = function tmpl_underscoreUsers(locals) {
        var buf = [];
        var jade_mixins = {};
        var jade_interp;
        var locals_for_with = locals || {};
        (function(users, _) {
            buf.push("<ul>");
            (function() {
                var $obj = users;
                if ("number" == typeof $obj.length) {
                    for (var $index = 0, $l = $obj.length; $index < $l; $index++) {
                        var user = $obj[$index];
                        buf.push("<li>" + jade.escape((jade_interp = _.isObject(user) && _.isString(user.name) ? user.name : "") == null ? "" : jade_interp) + "</li>");
                    }
                } else {
                    var $l = 0;
                    for (var $index in $obj) {
                        $l++;
                        var user = $obj[$index];
                        buf.push("<li>" + jade.escape((jade_interp = _.isObject(user) && _.isString(user.name) ? user.name : "") == null ? "" : jade_interp) + "</li>");
                    }
                }
            }).call(this);
            buf.push("</ul>");
        })("users" in locals_for_with ? locals_for_with.users : typeof users !== "undefined" ? users : undefined, "_" in locals_for_with ? locals_for_with._ : typeof _ !== "undefined" ? _ : undefined);
        return buf.join("");
    };

    // users.jade compiled template
    templatizer["users"] = function tmpl_users(locals) {
        var buf = [];
        var jade_mixins = {};
        var jade_interp;
        var locals_for_with = locals || {};
        (function(users) {
            buf.push("<ul>");
            (function() {
                var $obj = users;
                if ("number" == typeof $obj.length) {
                    for (var $index = 0, $l = $obj.length; $index < $l; $index++) {
                        var user = $obj[$index];
                        buf.push("<li>" + jade.escape(null == (jade_interp = user.name) ? "" : jade_interp) + "</li>");
                    }
                } else {
                    var $l = 0;
                    for (var $index in $obj) {
                        $l++;
                        var user = $obj[$index];
                        buf.push("<li>" + jade.escape(null == (jade_interp = user.name) ? "" : jade_interp) + "</li>");
                    }
                }
            }).call(this);
            buf.push("</ul>");
        })("users" in locals_for_with ? locals_for_with.users : typeof users !== "undefined" ? users : undefined);
        return buf.join("");
    };

    // usersLocals.jade compiled template
    templatizer["usersLocals"] = function tmpl_usersLocals(locals) {
        var buf = [];
        var jade_mixins = {};
        var jade_interp;
        buf.push("<ul>");
        (function() {
            var $obj = locals.users;
            if ("number" == typeof $obj.length) {
                for (var $index = 0, $l = $obj.length; $index < $l; $index++) {
                    var user = $obj[$index];
                    buf.push("<li>" + jade.escape(null == (jade_interp = user.name) ? "" : jade_interp) + "</li>");
                }
            } else {
                var $l = 0;
                for (var $index in $obj) {
                    $l++;
                    var user = $obj[$index];
                    buf.push("<li>" + jade.escape(null == (jade_interp = user.name) ? "" : jade_interp) + "</li>");
                }
            }
        }).call(this);
        buf.push("</ul>");
        return buf.join("");
    };

    // usersMixins.jade compiled template
    templatizer["usersMixins"] = function tmpl_usersMixins(locals) {
        var buf = [];
        var jade_mixins = {};
        var jade_interp;
        var locals_for_with = locals || {};
        (function(users) {
            buf.push("<ul>");
            var i = 0;
            (function() {
                var $obj = users;
                if ("number" == typeof $obj.length) {
                    for (var $index = 0, $l = $obj.length; $index < $l; $index++) {
                        var user = $obj[$index];
                        buf.push(templatizer["usersMixins"]["user_li"](user, i));
                        i++;
                    }
                } else {
                    var $l = 0;
                    for (var $index in $obj) {
                        $l++;
                        var user = $obj[$index];
                        buf.push(templatizer["usersMixins"]["user_li"](user, i));
                        i++;
                    }
                }
            }).call(this);
            buf.push("</ul>");
        })("users" in locals_for_with ? locals_for_with.users : typeof users !== "undefined" ? users : undefined);
        return buf.join("");
    };

    // usersMixins.jade:user_li compiled template
    templatizer["usersMixins"]["user_li"] = function tmpl_usersMixins_user_li(user, index) {
        var block = this && this.block, attributes = this && this.attributes || {}, buf = [];
        buf.push("<li" + jade.attr("data-user-id", user.id, true, false) + jade.attr("data-user-index", index, true, false) + "><span>Before</span>");
        buf.push(templatizer["usersMixins"]["user_a"](user, index));
        buf.push("</li>");
        return buf.join("");
    };


    // usersMixins.jade:user_a compiled template
    templatizer["usersMixins"]["user_a"] = function tmpl_usersMixins_user_a(user, index) {
        var block = this && this.block, attributes = this && this.attributes || {}, buf = [];
        buf.push("<a" + jade.attr("href", user.url, true, false) + jade.attr("data-user-index", index, true, false) + ">Within " + jade.escape((jade_interp = user.name) == null ? "" : jade_interp) + "</a>");
        return buf.join("");
    };

    // userscomplex.jade compiled template
    templatizer["userscomplex"] = function tmpl_userscomplex(locals) {
        var buf = [];
        var jade_mixins = {};
        var jade_interp;
        var locals_for_with = locals || {};
        (function(users) {
            buf.push("<ul>");
            (function() {
                var $obj = users;
                if ("number" == typeof $obj.length) {
                    for (var $index = 0, $l = $obj.length; $index < $l; $index++) {
                        var user = $obj[$index];
                        buf.push("<li" + jade.attr("data-user-id", user.id, true, false) + "><span>Before</span><a" + jade.attr("href", user.url, true, false) + ">Within " + jade.escape((jade_interp = user.name) == null ? "" : jade_interp) + "</a></li>");
                    }
                } else {
                    var $l = 0;
                    for (var $index in $obj) {
                        $l++;
                        var user = $obj[$index];
                        buf.push("<li" + jade.attr("data-user-id", user.id, true, false) + "><span>Before</span><a" + jade.attr("href", user.url, true, false) + ">Within " + jade.escape((jade_interp = user.name) == null ? "" : jade_interp) + "</a></li>");
                    }
                }
            }).call(this);
            buf.push("</ul>");
        })("users" in locals_for_with ? locals_for_with.users : typeof users !== "undefined" ? users : undefined);
        return buf.join("");
    };

    // otherfolder/othertweet2.jade compiled template
    templatizer["otherfolder"]["othertweet2"] = function tmpl_otherfolder_othertweet2() {
        return "<p>test</p>";
    };

    // test.jade compiled template
    templatizer["test"] = function tmpl_test() {
        return "<p>test</p>";
    };

    return templatizer;
}));