var test = require('tape');
var path = require('path');
var fs = require('fs');
var rimraf = require('rimraf');
var mkdir = require('mkdirp');
var templatizer = require('../templatizer');
var async = require('async');

var i = function (name, glob) {
    return path.resolve(__dirname, name || 'templates') + (glob ? '/*.jade' : '');
};

var o = function (name) {
    return path.resolve(__dirname, 'builtTemplates', name + '.js');
};

rimraf.sync(path.resolve(__dirname, 'builtTemplates'));
mkdir.sync(path.resolve(__dirname, 'builtTemplates'));

test('Can build with just input', function (t) {
    // Just input
    templatizer(i(), function (err, templates) {
        t.notOk(err);
        t.ok(!!templates);
        t.ok(typeof templates === 'string');
        t.ok(templates.length > 0);
        t.ok(templates.indexOf('jade_debug.unshift') === -1);
        t.end();
    });
});

test('Can build to a file', function (t) {
    var name = Math.random().toString().slice(2);
    templatizer(i(), o(name), function (err, templates) {
        var templatesFromFile = fs.readFileSync(o(name), 'utf-8');
        t.notOk(err);
        t.ok(fs.existsSync(o(name)));
        t.ok(templates === templatesFromFile);
        t.ok(templates.indexOf('jade_debug.unshift') === -1);
        t.end();
    });
});

test('Works with options', function (t) {
    templatizer(i(), {jade: {compileDebug: true}}, function (err, templates) {
        t.notOk(err);
        t.ok(!!templates);
        t.ok(typeof templates === 'string');
        t.ok(templates.length > 0);
        t.ok(templates.indexOf('jade_debug.unshift') > -1);
        t.end();
    });
});

test('Can build to a file with options', function (t) {
    var name = Math.random().toString().slice(2);
    templatizer(i(), o(name), {jade: {compileDebug: true}}, function (err, templates) {
        var templatesFromFile = fs.readFileSync(o(name), 'utf-8');
        t.notOk(err);
        t.ok(!!templates);
        t.ok(typeof templates === 'string');
        t.ok(templates.length > 0);
        t.ok(templates.indexOf('jade_debug.unshift') > -1);
        t.ok(templates === templatesFromFile);
        t.end();
    });
});

test('Error callback is invoked when the jade template contains syntax errors', function (t) {
    var name = Math.random().toString().slice(2);
    templatizer(i('invalidTemplates'), o(name), {jade: {compileDebug: true}}, function (err, templates) {
        t.ok(err);
        t.notOk(!!templates);
        t.end();
    });
});

// These are required for the browser test
test('Built other options without errors', function (t) {
    async.each([
        [i(), o('templates'), {transformMixins: true}],
        [[i(), i('templates2')], o('multiple_dirs')],
        [i('templates', true), o('glob')],
        [i(), o('no_mixins')],
        [i('templates', true), o('negativeglob'), {globOptions: {ignore: ['**/users*']}}],
    ], function (args, cb) {
        templatizer.apply(null, [].concat(args).concat(function (err, templates) {
            t.notOk(err);
            t.ok(!!templates);
            t.ok(typeof templates === 'string');
            t.ok(templates.length > 0);
            cb(err);
        }));
    }, function (err) {
        t.notOk(err);
        t.end();
    });
});
