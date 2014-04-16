(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
//jade runtime
!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.jade=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';

/**
 * Merge two attribute objects giving precedence
 * to values in object `b`. Classes are special-cased
 * allowing for arrays and merging/joining appropriately
 * resulting in a string.
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Object} a
 * @api private
 */

exports.merge = function merge(a, b) {
  if (arguments.length === 1) {
    var attrs = a[0];
    for (var i = 1; i < a.length; i++) {
      attrs = merge(attrs, a[i]);
    }
    return attrs;
  }
  var ac = a['class'];
  var bc = b['class'];

  if (ac || bc) {
    ac = ac || [];
    bc = bc || [];
    if (!Array.isArray(ac)) ac = [ac];
    if (!Array.isArray(bc)) bc = [bc];
    a['class'] = ac.concat(bc).filter(nulls);
  }

  for (var key in b) {
    if (key != 'class') {
      a[key] = b[key];
    }
  }

  return a;
};

/**
 * Filter null `val`s.
 *
 * @param {*} val
 * @return {Boolean}
 * @api private
 */

function nulls(val) {
  return val != null && val !== '';
}

/**
 * join array as classes.
 *
 * @param {*} val
 * @return {String}
 */
exports.joinClasses = joinClasses;
function joinClasses(val) {
  return Array.isArray(val) ? val.map(joinClasses).filter(nulls).join(' ') : val;
}

/**
 * Render the given classes.
 *
 * @param {Array} classes
 * @param {Array.<Boolean>} escaped
 * @return {String}
 */
exports.cls = function cls(classes, escaped) {
  var buf = [];
  for (var i = 0; i < classes.length; i++) {
    if (escaped && escaped[i]) {
      buf.push(exports.escape(joinClasses([classes[i]])));
    } else {
      buf.push(joinClasses(classes[i]));
    }
  }
  var text = joinClasses(buf);
  if (text.length) {
    return ' class="' + text + '"';
  } else {
    return '';
  }
};

/**
 * Render the given attribute.
 *
 * @param {String} key
 * @param {String} val
 * @param {Boolean} escaped
 * @param {Boolean} terse
 * @return {String}
 */
exports.attr = function attr(key, val, escaped, terse) {
  if ('boolean' == typeof val || null == val) {
    if (val) {
      return ' ' + (terse ? key : key + '="' + key + '"');
    } else {
      return '';
    }
  } else if (0 == key.indexOf('data') && 'string' != typeof val) {
    return ' ' + key + "='" + JSON.stringify(val).replace(/'/g, '&apos;') + "'";
  } else if (escaped) {
    return ' ' + key + '="' + exports.escape(val) + '"';
  } else {
    return ' ' + key + '="' + val + '"';
  }
};

/**
 * Render the given attributes object.
 *
 * @param {Object} obj
 * @param {Object} escaped
 * @return {String}
 */
exports.attrs = function attrs(obj, terse){
  var buf = [];

  var keys = Object.keys(obj);

  if (keys.length) {
    for (var i = 0; i < keys.length; ++i) {
      var key = keys[i]
        , val = obj[key];

      if ('class' == key) {
        if (val = joinClasses(val)) {
          buf.push(' ' + key + '="' + val + '"');
        }
      } else {
        buf.push(exports.attr(key, val, false, terse));
      }
    }
  }

  return buf.join('');
};

/**
 * Escape the given string of `html`.
 *
 * @param {String} html
 * @return {String}
 * @api private
 */

exports.escape = function escape(html){
  var result = String(html)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  if (result === '' + html) return html;
  else return result;
};

/**
 * Re-throw the given `err` in context to the
 * the jade in `filename` at the given `lineno`.
 *
 * @param {Error} err
 * @param {String} filename
 * @param {String} lineno
 * @api private
 */

exports.rethrow = function rethrow(err, filename, lineno, str){
  if (!(err instanceof Error)) throw err;
  if ((typeof window != 'undefined' || !filename) && !str) {
    err.message += ' on line ' + lineno;
    throw err;
  }
  try {
    str =  str || _dereq_('fs').readFileSync(filename, 'utf8')
  } catch (ex) {
    rethrow(err, null, lineno)
  }
  var context = 3
    , lines = str.split('\n')
    , start = Math.max(lineno - context, 0)
    , end = Math.min(lines.length, lineno + context);

  // Error context
  var context = lines.slice(start, end).map(function(line, i){
    var curr = i + start + 1;
    return (curr == lineno ? '  > ' : '    ')
      + curr
      + '| '
      + line;
  }).join('\n');

  // Alter exception message
  err.path = filename;
  err.message = (filename || 'Jade') + ':' + lineno
    + '\n' + context + '\n\n' + err.message;
  throw err;
};

},{"fs":2}],2:[function(_dereq_,module,exports){

},{}]},{},[1])
(1)
});

(function () {
var root = this, exports = {};

// create our folder objects
exports["otherfolder"] = {};
exports["otherfolder"]["deep2"] = {};
exports["otherfolder"]["deepnested"] = {};

// 404.jade compiled template
exports["404"] = function tmpl_404() {
    return '<div class="page-404">404!</div>';
};

// 404withVars.jade compiled template
exports["404withVars"] = function tmpl_404withVars(locals) {
    var buf = [];
    var jade_mixins = {};
    var jade_interp;
    var locals_for_with = locals || {};
    (function (content) {
        buf.push('<div class="page-404">' + jade.escape((jade_interp = content || '404') == null ? '' : jade_interp) + '!</div>');
    }('content' in locals_for_with ? locals_for_with.content : typeof content !== 'undefined' ? content : undefined));
    return buf.join('');
};

// otherfolder/deep2/deeptweet.jade compiled template
exports["otherfolder"]["deep2"]["deeptweet"] = function tmpl_otherfolder_deep2_deeptweet(locals) {
    var buf = [];
    var jade_mixins = {};
    var jade_interp;
    var locals_for_with = locals || {};
    (function (tweet) {
        buf.push('<li class="tweet">' + jade.escape(null == (jade_interp = tweet) ? '' : jade_interp) + '</li>');
    }('tweet' in locals_for_with ? locals_for_with.tweet : typeof tweet !== 'undefined' ? tweet : undefined));
    return buf.join('');
};

// otherfolder/deepnested/deeptweet.jade compiled template
exports["otherfolder"]["deepnested"]["deeptweet"] = function tmpl_otherfolder_deepnested_deeptweet(locals) {
    var buf = [];
    var jade_mixins = {};
    var jade_interp;
    var locals_for_with = locals || {};
    (function (tweet) {
        buf.push('<li class="tweet">' + jade.escape(null == (jade_interp = tweet) ? '' : jade_interp) + '</li>');
    }('tweet' in locals_for_with ? locals_for_with.tweet : typeof tweet !== 'undefined' ? tweet : undefined));
    return buf.join('');
};

// otherfolder/nestedMixin.jade compiled template
exports["otherfolder"]["nestedMixin"] = function tmpl_otherfolder_nestedMixin(locals) {
    var buf = [];
    var jade_mixins = {};
    var jade_interp;
    var locals_for_with = locals || {};
    (function (users) {
        buf.push('<ul>');
        var i = 0;
        (function () {
            var $$obj = users;
            if ('number' == typeof $$obj.length) {
                for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
                    var user = $$obj[$index];
                    buf.push(exports.otherfolder.nestedMixin.user_li(user, i));
                    i++;
                }
            } else {
                var $$l = 0;
                for (var $index in $$obj) {
                    $$l++;
                    var user = $$obj[$index];
                    buf.push(exports.otherfolder.nestedMixin.user_li(user, i));
                    i++;
                }
            }
        }.call(this));
        buf.push('</ul>');
    }('users' in locals_for_with ? locals_for_with.users : typeof users !== 'undefined' ? users : undefined));
    return buf.join('');
};

// otherfolder/nestedMixin.jade:user_li compiled template
exports["otherfolder"]["nestedMixin"]["user_li"] = function tmpl_otherfolder_nestedMixin_user_li(user, index) {
    var block = this && this.block, attributes = this && this.attributes || {}, buf = [], jade_interp;
    buf.push("<li" + jade.attr("data-user-id", user.id, true, false) + jade.attr("data-user-index", index, true, false) + ">test</li>");
    return buf.join("");
};

// otherfolder/othertweet.jade compiled template
exports["otherfolder"]["othertweet"] = function tmpl_otherfolder_othertweet(locals) {
    var buf = [];
    var jade_mixins = {};
    var jade_interp;
    var locals_for_with = locals || {};
    (function (user) {
        buf.push('<li class="tweet">' + jade.escape(null == (jade_interp = user) ? '' : jade_interp) + '</li>');
    }('user' in locals_for_with ? locals_for_with.user : typeof user !== 'undefined' ? user : undefined));
    return buf.join('');
};

// underscoreUsers.jade compiled template
exports["underscoreUsers"] = function tmpl_underscoreUsers(locals) {
    var buf = [];
    var jade_mixins = {};
    var jade_interp;
    var locals_for_with = locals || {};
    (function (users, _) {
        buf.push('<ul>');
        (function () {
            var $$obj = users;
            if ('number' == typeof $$obj.length) {
                for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
                    var user = $$obj[$index];
                    buf.push('<li>' + jade.escape((jade_interp = _.isObject(user) && _.isString(user.name) ? user.name : '') == null ? '' : jade_interp) + '</li>');
                }
            } else {
                var $$l = 0;
                for (var $index in $$obj) {
                    $$l++;
                    var user = $$obj[$index];
                    buf.push('<li>' + jade.escape((jade_interp = _.isObject(user) && _.isString(user.name) ? user.name : '') == null ? '' : jade_interp) + '</li>');
                }
            }
        }.call(this));
        buf.push('</ul>');
    }('users' in locals_for_with ? locals_for_with.users : typeof users !== 'undefined' ? users : undefined, '_' in locals_for_with ? locals_for_with._ : typeof _ !== 'undefined' ? _ : undefined));
    return buf.join('');
};

// users.jade compiled template
exports["users"] = function tmpl_users(locals) {
    var buf = [];
    var jade_mixins = {};
    var jade_interp;
    var locals_for_with = locals || {};
    (function (users) {
        buf.push('<ul>');
        (function () {
            var $$obj = users;
            if ('number' == typeof $$obj.length) {
                for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
                    var user = $$obj[$index];
                    buf.push('<li>' + jade.escape(null == (jade_interp = user.name) ? '' : jade_interp) + '</li>');
                }
            } else {
                var $$l = 0;
                for (var $index in $$obj) {
                    $$l++;
                    var user = $$obj[$index];
                    buf.push('<li>' + jade.escape(null == (jade_interp = user.name) ? '' : jade_interp) + '</li>');
                }
            }
        }.call(this));
        buf.push('</ul>');
    }('users' in locals_for_with ? locals_for_with.users : typeof users !== 'undefined' ? users : undefined));
    return buf.join('');
};

// usersLocals.jade compiled template
exports["usersLocals"] = function tmpl_usersLocals(locals) {
    var buf = [];
    var jade_mixins = {};
    var jade_interp;
    buf.push('<ul>');
    (function () {
        var $$obj = locals.users;
        if ('number' == typeof $$obj.length) {
            for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
                var user = $$obj[$index];
                buf.push('<li>' + jade.escape(null == (jade_interp = user.name) ? '' : jade_interp) + '</li>');
            }
        } else {
            var $$l = 0;
            for (var $index in $$obj) {
                $$l++;
                var user = $$obj[$index];
                buf.push('<li>' + jade.escape(null == (jade_interp = user.name) ? '' : jade_interp) + '</li>');
            }
        }
    }.call(this));
    buf.push('</ul>');
    return buf.join('');
};

// usersMixins.jade compiled template
exports["usersMixins"] = function tmpl_usersMixins(locals) {
    var buf = [];
    var jade_mixins = {};
    var jade_interp;
    var locals_for_with = locals || {};
    (function (users) {
        buf.push('<ul>');
        var i = 0;
        (function () {
            var $$obj = users;
            if ('number' == typeof $$obj.length) {
                for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
                    var user = $$obj[$index];
                    buf.push(exports.usersMixins.user_li(user, i));
                    i++;
                }
            } else {
                var $$l = 0;
                for (var $index in $$obj) {
                    $$l++;
                    var user = $$obj[$index];
                    buf.push(exports.usersMixins.user_li(user, i));
                    i++;
                }
            }
        }.call(this));
        buf.push('</ul>');
    }('users' in locals_for_with ? locals_for_with.users : typeof users !== 'undefined' ? users : undefined));
    return buf.join('');
};

// usersMixins.jade:user_li compiled template
exports["usersMixins"]["user_li"] = function tmpl_usersMixins_user_li(user, index) {
    var block = this && this.block, attributes = this && this.attributes || {}, buf = [], jade_interp;
    buf.push("<li" + jade.attr("data-user-id", user.id, true, false) + jade.attr("data-user-index", index, true, false) + "><span>Before</span>");
    buf.push(exports.usersMixins.user_a(user, index));
    buf.push("</li>");
    return buf.join("");
};

// usersMixins.jade:user_a compiled template
exports["usersMixins"]["user_a"] = function tmpl_usersMixins_user_a(user, index) {
    var block = this && this.block, attributes = this && this.attributes || {}, buf = [], jade_interp;
    buf.push("<a" + jade.attr("href", user.url, true, false) + jade.attr("data-user-index", index, true, false) + ">Within " + jade.escape((jade_interp = user.name) == null ? "" : jade_interp) + "</a>");
    return buf.join("");
};

// userscomplex.jade compiled template
exports["userscomplex"] = function tmpl_userscomplex(locals) {
    var buf = [];
    var jade_mixins = {};
    var jade_interp;
    var locals_for_with = locals || {};
    (function (users) {
        buf.push('<ul>');
        (function () {
            var $$obj = users;
            if ('number' == typeof $$obj.length) {
                for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
                    var user = $$obj[$index];
                    buf.push('<li' + jade.attr('data-user-id', user.id, true, false) + '><span>Before</span><a' + jade.attr('href', user.url, true, false) + '>Within ' + jade.escape((jade_interp = user.name) == null ? '' : jade_interp) + '</a></li>');
                }
            } else {
                var $$l = 0;
                for (var $index in $$obj) {
                    $$l++;
                    var user = $$obj[$index];
                    buf.push('<li' + jade.attr('data-user-id', user.id, true, false) + '><span>Before</span><a' + jade.attr('href', user.url, true, false) + '>Within ' + jade.escape((jade_interp = user.name) == null ? '' : jade_interp) + '</a></li>');
                }
            }
        }.call(this));
        buf.push('</ul>');
    }('users' in locals_for_with ? locals_for_with.users : typeof users !== 'undefined' ? users : undefined));
    return buf.join('');
};


// attach to window or export with commonJS
if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
    module.exports = exports;
} else if (typeof define === "function" && define.amd) {
    define(exports);
} else {
    root.templatizer = exports;
}

})();
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],2:[function(require,module,exports){
/* globals test, ok */

var t = require('../demo_output.js');
var data = {
    users: [{
        name: 'larry',
        url: 'http://andyet.com',
        id: 1
    }, {
        name: 'curly',
        url: 'http://andbang.com',
        id: 2
    }, {
        name: 'moe',
        url: 'http://talky.io',
        id: 3
    }]
};

module.exports = {
    start: function () {
        test("Test that templates work when browserified", function () {
            var users = t.users,
                withLocals = t.usersLocals;

            ok(users({users: data.users}) === withLocals({users: data.users}));
        });
    }
};

module.exports.start();

},{"../demo_output.js":1}]},{},[2])