var jade = require('jade');
var beautify = require('./lib/beautify');
var jadeAst = require('./lib/jade-ast');
var walkdir = require('walkdir');
var path = require('path');
var _ = require('underscore');
var fs = require('fs');


module.exports = function (templateDirectory, outputFile, dontTransformMixins) {
    var parentObjName = 'exports'; // This is just to use in multiple places
    var folders = [];
    var templates = [];
    var isWindows = process.platform === 'win32';
    var pathSep = path.sep || (isWindows ? '\\' : '/');
    var placesToLook = [
            __dirname + '/../jade/runtime.min.js',
            __dirname + '/node_modules/jade/runtime.min.js',
            __dirname + '/jaderuntime.min.js'
        ];
    var contents = walkdir.sync(templateDirectory);
    var jadeRuntime = fs.readFileSync(_.find(placesToLook, fs.existsSync)).toString();
    var output = [
        '(function () {',
        'var root = this, ' + parentObjName + ' = {};',
        '',
        '// The jade runtime:',
        'var jade = ' + parentObjName + '.' + jadeRuntime,
        ''
    ].join('\n');

    contents.forEach(function (file) {
        var item = file.replace(templateDirectory, '').slice(1);
        if (path.extname(item) === '' && path.basename(item).charAt(0) !== '.') {
            folders.push(item);
        } else if (path.extname(item) === '.jade') {
            templates.push(item);
        }
    });

    folders = _.sortBy(folders, function (folder) {
        var arr = folder.split(pathSep);
        return arr.length;
    });

    output += '\n// create our folder objects';
    folders.forEach(function (folder) {
        var arr = folder.split(pathSep);
        output += '\n' + parentObjName + '.' + arr.join('.') + ' = {};';
    });
    output += '\n';

    templates.forEach(function (file) {
        var name = path.basename(file, '.jade');
        var dirString = function () {
            var dirname = path.dirname(file);
            var arr = dirname.split(pathSep);
            if (dirname === '.') return name;
            arr.push(name);
            return arr.join('.');
        }();
        var fullPath = templateDirectory + '/' + file;
        var template = beautify(jade.compile(fs.readFileSync(fullPath), {
            client: true,
            compileDebug: false,
            pretty: false,
            filename: fullPath
        }).toString());
        var astResult = jadeAst.getMixins({
            template: template,
            templateName: name,
            dirString: dirString,
            parentObjName: parentObjName
        });
        var mixinOutput = astResult.mixins;

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
