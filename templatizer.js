var jade = require('jade');
var beautify = require('./lib/beautify');
var jadeAst = require('./lib/jade-ast');
var walkdir = require('walkdir');
var path = require('path');
var _ = require('underscore');
var fs = require('fs');


module.exports = function (templateDirectories, outputFile, dontTransformMixins) {
    if (typeof templateDirectories === "string") {
        templateDirectories = [templateDirectories];
    }
    var parentObjName = 'exports'; // This is just to use in multiple places
    var folders = [];
    var templates = [];
    var _readTemplates = [];
    var isWindows = process.platform === 'win32';
    var pathSep = path.sep || (isWindows ? '\\' : '/');
    var placesToLook = [
            __dirname + '/../jade/runtime.min.js',
            __dirname + '/node_modules/jade/runtime.min.js',
            __dirname + '/jaderuntime.min.js'
        ];

    var jadeRuntime = fs.readFileSync(_.find(placesToLook, fs.existsSync)).toString();
    var output = [
        '(function () {',
        'var root = this, ' + parentObjName + ' = {};',
        '',
        '// The jade runtime:',
        'var jade = ' + parentObjName + '.' + jadeRuntime,
        ''
    ].join('\n');

    templateDirectories.forEach(function (templateDirectory) {
        var contents = walkdir.sync(templateDirectory);

        contents.forEach(function (file) {
            var item = file.replace(templateDirectory, '').slice(1);
            if (path.extname(item) === '' && path.basename(item).charAt(0) !== '.') {
                if (folders.indexOf(item) === -1) folders.push(item);
            } else if (path.extname(item) === '.jade') {
                // Currently will ignore same path jade files from multiple template dirs
                if (_readTemplates.indexOf(item) === -1) {
                    _readTemplates.push(item);
                    templates.push(templateDirectory + '/' + item);
                }
            }
        });

        folders = _.sortBy(folders, function (folder) {
            var arr = folder.split(pathSep);
            return arr.length;
        });
    });

    output += '\n// create our folder objects';
    folders.forEach(function (folder) {
        var arr = folder.split(pathSep);
        output += '\n' + parentObjName + '.' + arr.join('.') + ' = {};';
    });
    output += '\n';

    templates.forEach(function (item) {
        var name = path.basename(item, '.jade');
        var dirString = function () {
            var itemTemplateDir = _.find(templateDirectories, function (templateDirectory) {
                return item.indexOf(templateDirectory + '/') === 0;
            });
            var dirname = path.dirname(item).replace(itemTemplateDir, '');
            if (dirname === '.') return name;
            var arr = dirname.split(pathSep);
            arr.push(name);
            return _.compact(arr).join('.');
        }();
        var mixinOutput = '';
        var template = beautify(jade.compile(fs.readFileSync(item, 'utf-8'), {
            client: true,
            compileDebug: false,
            pretty: false,
            filename: item
        }).toString());
        var astResult = jadeAst.getMixins({
            template: template,
            templateName: name,
            dirString: dirString,
            parentObjName: parentObjName
        });

        mixinOutput = astResult.mixins;
        if (!dontTransformMixins) template = astResult.template;

        output += [
            '',
            '// ' + name + '.jade compiled template',
            parentObjName + '.' + dirString + ' = ' + template + ';',
            ''
        ].join('\n') + mixinOutput;
    });

    output += [
        '\n',
        '// attach to window or export with commonJS',
        'if (typeof module !== "undefined" && typeof module.exports !== "undefined") {',
        '    module.exports = ' + parentObjName + ';',
        '} else if (typeof define === "function" && define.amd) {',
        '    define(' + parentObjName + ');',
        '} else {',
        '    root.templatizer = ' + parentObjName + ';',
        '}',
        '',
        '})();'
    ].join('\n');

    if (outputFile) fs.writeFileSync(outputFile, output);

    return output;
};
