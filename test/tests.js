/* globals test, ok, templatizer, unaltered, multipleDirs, app, _, globalErrorCount */

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

test("Test mixins", function () {
    var users = templatizer.usersMixins({users: data.users});
    var user_li = templatizer.usersMixins.user_li(data.users[0], 0);
    var user_a = templatizer.usersMixins.user_a(data.users[0], 0);
    
    var _users = '<ul>';
    for (var i = 0, m = data.users.length; i < m; i++) {
        _users += templatizer.usersMixins.user_li(data.users[i], i);
    }
    _users += '</ul>';

    ok(users === _users);
    ok(users.indexOf(user_li) > -1);
    ok(users.indexOf(user_a) > -1);
    ok(user_li.indexOf(user_a) > -1);
});

test("Test calling templates with different context", function () {
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

    ok(users === _users);
    ok(users.indexOf(user_li) > -1);
    ok(users.indexOf(user_a) > -1);
    ok(user_li.indexOf(user_a) > -1);
});

test("Test multiple dirs", function () {
    ok(multipleDirs.templatizer.hasOwnProperty('test'));
    ok(!templatizer.hasOwnProperty('test'));

    ok(multipleDirs.templatizer.otherfolder.hasOwnProperty('othertweet'));
    ok(multipleDirs.templatizer.otherfolder.hasOwnProperty('othertweet2'));
    ok(templatizer.otherfolder.hasOwnProperty('othertweet'));
    ok(!templatizer.otherfolder.hasOwnProperty('othertweet2'));
});

test("Test altered vs unaltered mixins", function () {
    var users = templatizer.usersMixins({users: data.users});
    var _users = unaltered.templatizer.usersMixins({users: data.users});

    ok(users === _users);
});

test("Test for valid identifiers", function () {
    var page404 = templatizer['404'];

    ok(typeof page404 === 'function');
});

test("Test for nested mixins", function () {
    var nestedMixin = templatizer.otherfolder.nestedMixin;

    ok(typeof nestedMixin.user_li === 'function');
});

test("Test that simplified templates have the same content: Issue #31", function () {
    var regular = templatizer['404withVars'],
        simple = templatizer['404'];

    ok(regular() === simple());
    ok(regular({content: 'test'}) !== simple());
});

test("Test that templates work with jade global option", function () {
    var users = templatizer.users,
        underscoreUsers = templatizer.underscoreUsers;

    ok(users({users: data.users}) === underscoreUsers({users: data.users}));
});

test("Blocks", function () {
    var unalteredBlock = unaltered.templatizer.mixinsWithBlocks();
    var unalteredWithoutBlock = unaltered.templatizer.mixinsWithoutBlocks();

    var withBlock = templatizer.mixinsWithBlocks();
    var withBlockMixin = templatizer.mixinsWithBlocks.MyModal.call({
        block: function (buf) {
            buf.push('<p>some body text</p>');
        }
    }, 'foo');
    var withoutBlock = templatizer.mixinsWithoutBlocks();
    var withoutBlockMixin = templatizer.mixinsWithoutBlocks.MyModal('foo');

    ok(unalteredBlock === withBlock);
    ok(unalteredWithoutBlock === withoutBlock);
    ok(withBlock === withoutBlock);
    ok(withoutBlockMixin === withoutBlock);
    ok(withBlockMixin === withBlock);
});

test("Namespaces", function () {
    ok(_.isObject(app));
    ok(_.isObject(app.nested));
    ok(_.isObject(app.nested.templatizer));
});

test('Global error count', function () {
    ok(typeof app.isBoolean === 'boolean');
    ok(typeof app.nonExistant === 'undefined');
    ok(globalErrorCount === 2);
});

test('Test mixin being called with (nested) array item argument', function () {
    var tmplString = templatizer.mixinArrayArg();
    var tmplString2 = unaltered.templatizer.mixinArrayArg();
    var tmplString3 = templatizer.otherfolder.deepnested.mixinArrayArg();
    var tmplString4 = unaltered.templatizer.otherfolder.deepnested.mixinArrayArg();

    ok(tmplString === tmplString2);
    ok(tmplString3 === tmplString4);
    ok(tmplString === tmplString4);
});

test('Mixin only', function () {
    var tmplString = templatizer.mixinOnly();
    var mixinString = templatizer.mixinOnly.hello();

    ok(tmplString === '');
    ok(mixinString === '<div></div>');
});
