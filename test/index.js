var test = require('tape');

var templatizer = require('./builtTemplates/templates.js');
var unaltered = require('./builtTemplates/no_mixins');
var multipleDirs = require('./builtTemplates/multiple_dirs');
var dontRemoveMixins = require('./builtTemplates/dont_remove_mixins');
var glob = require('./builtTemplates/glob');
var negativeglob = require('./builtTemplates/negativeglob');

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

test("Test mixins", function (t) {
    var users = templatizer.usersMixins({users: data.users});
    var user_li = templatizer.usersMixins.user_li(data.users[0], 0);
    var user_a = templatizer.usersMixins.user_a(data.users[0], 0);

    var _users = '<ul>';
    for (var i = 0, m = data.users.length; i < m; i++) {
        _users += templatizer.usersMixins.user_li(data.users[i], i);
    }
    _users += '</ul>';

    t.ok(users === _users);
    t.ok(users.indexOf(user_li) > -1);
    t.ok(users.indexOf(user_a) > -1);
    t.ok(user_li.indexOf(user_a) > -1);

    t.end();
});

test("Test calling templates with different context", function (t) {
    var usersObj = {template: templatizer.usersMixins};
    var user_liObj = {template: templatizer.usersMixins.user_li};
    var user_aObj = {template: templatizer.usersMixins.user_a};

    var users = usersObj.template({users: data.users});
    var user_li = user_liObj.template(data.users[0], 0);
    var user_a = user_aObj.template(data.users[0], 0);

    var _users = '<ul>';
    for (var i = 0, m = data.users.length; i < m; i++) {
        _users += templatizer.usersMixins.user_li(data.users[i], i);
    }
    _users += '</ul>';

    t.ok(users === _users);
    t.ok(users.indexOf(user_li) > -1);
    t.ok(users.indexOf(user_a) > -1);
    t.ok(user_li.indexOf(user_a) > -1);

    t.end();
});

test("Test multiple dirs", function (t) {
    t.ok(multipleDirs.hasOwnProperty('test'));
    t.ok(!templatizer.hasOwnProperty('test'));

    t.ok(multipleDirs.otherfolder.hasOwnProperty('othertweet'));
    t.ok(multipleDirs.otherfolder.hasOwnProperty('othertweet2'));
    t.ok(templatizer.otherfolder.hasOwnProperty('othertweet'));
    t.ok(!templatizer.otherfolder.hasOwnProperty('othertweet2'));

    t.end();
});

test("Test altered vs unaltered mixins", function (t) {
    var users = templatizer.usersMixins({users: data.users});
    var _users = unaltered.usersMixins({users: data.users});

    t.ok(users === _users);

    t.end();
});

test("Test for valid identifiers", function (t) {
    var page404 = templatizer['404'];

    t.ok(typeof page404 === 'function');

    t.end();
});

test("Test for nested mixins", function (t) {
    var nestedMixin = templatizer.otherfolder.nestedMixin;

    t.ok(typeof nestedMixin.user_li === 'function');

    t.end();
});

test("Test that simplified templates have the same content: Issue #31", function (t) {
    var regular = templatizer['404withVars'],
        simple = templatizer['404'];
    t.ok(regular() === simple());
    t.ok(regular({value: 'test'}) !== simple());

    t.end();
});

test("Blocks", function (t) {
    var unalteredBlock = unaltered.mixinsWithBlocks();
    var unalteredWithoutBlock = unaltered.mixinsWithoutBlocks();

    var withBlock = templatizer.mixinsWithBlocks();
    var withBlockMixin = templatizer.mixinsWithBlocks.MyModal.call({
        block: function (buf) {
            buf.push('<p>some body text</p>');
        }
    }, 'foo');
    var withoutBlock = templatizer.mixinsWithoutBlocks();
    var withoutBlockMixin = templatizer.mixinsWithoutBlocks.MyModal('foo');

    t.ok(unalteredBlock === withBlock);
    t.ok(unalteredWithoutBlock === withoutBlock);
    t.ok(withBlock === withoutBlock);
    t.ok(withoutBlockMixin === withoutBlock);
    t.ok(withBlockMixin === withBlock);

    t.end();
});

test('Test mixin being called with (nested) array item argument', function (t) {
    var tmplString = templatizer.mixinArrayArg();
    var tmplString2 = unaltered.mixinArrayArg();
    var tmplString3 = templatizer.otherfolder.deepnested.mixinArrayArg();
    var tmplString4 = unaltered.otherfolder.deepnested.mixinArrayArg();

    t.ok(tmplString === tmplString2);
    t.ok(tmplString3 === tmplString4);
    t.ok(tmplString === tmplString4);

    t.end();
});

test('Mixins can be created even if uncalled in the file', function (t) {
    var ucm = templatizer.uncalledMixin;
    var drm = dontRemoveMixins.uncalledMixin;

    t.ok(typeof ucm.test === 'function');
    t.ok(typeof ucm.uncalled_test === 'undefined');
    t.ok(typeof drm.test === 'function');
    t.ok(typeof drm.uncalled_test === 'function');

    t.ok(ucm() === drm());
    t.ok(ucm.test('test', 0) === drm.test('test', 0));
    t.ok(drm.test('test', 0) === drm.uncalled_test('test', 0));

    t.end();
});

test('Mixin only', function (t) {
    var tmplString = templatizer.mixinOnly();
    var hello = templatizer.mixinOnly.hello();

    t.ok(tmplString === '');
    t.ok(hello === '<div></div>');

    t.end();
});

test('Glob produces templatizer functions', function (t) {
    t.equal(typeof glob.otherfolder.deepnested.deeptweet, 'function');
    t.equal(typeof glob.otherfolder.nestedMixin, 'function');
    t.equal(typeof glob.usersMixins, 'function');
    t.equal(glob['404'](), '<div class="page-404">404!</div>');

    t.end();
});

test('Negative Glob doesnt produce matching templatizer functions', function (t) {
    t.equal(typeof negativeglob.otherfolder.deepnested.deeptweet, 'function');
    t.equal(typeof negativeglob.otherfolder.nestedMixin, 'function');
    t.equal(typeof negativeglob.users, 'undefined');
    t.equal(typeof negativeglob.usersMixins, 'undefined');

    t.end();
});


test('Dynamic mixins can be called', function (t) {
    t.equal(typeof templatizer.dynamicMixin.test1, 'function');
    t.equal(typeof templatizer.dynamicMixin.test2, 'function');

    t.equal(typeof unaltered.dynamicMixin.test1, 'undefined');
    t.equal(typeof unaltered.dynamicMixin.test2, 'undefined');

    t.equal(templatizer.dynamicMixin({value: '1'}), '<p><span>One</span></p>');
    t.equal(unaltered.dynamicMixin({value: '1'}), '<p><span>One</span></p>');
    t.equal(templatizer.dynamicMixin({value: '2'}), '<p><span>Two</span></p>');
    t.equal(unaltered.dynamicMixin({value: '2'}), '<p><span>Two</span></p>');

    t.equal(templatizer.dynamicMixin.test1(), '<span>One</span>');
    t.equal(templatizer.dynamicMixin.test2(), '<span>Two</span>');

    t.end();
});
