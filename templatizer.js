var jade = require('jade'),
    uglifyjs = require('uglify-js'),
    walkdir = require('walkdir'),
    path = require('path'),
    _ = require('underscore'),
    fs = require('fs');

function beautify(code) {
    return uglifyjs.parse(code).print_to_string({beautify: true});
}

module.exports = function (templateDirectory, outputFile, watch) {
    var folders = [],
        templates = [],
        isWindows = process.platform === 'win32',
        pathSep = path.sep || (isWindows ? '\\' : '/'),
        placesToLook = [
            __dirname + '/../jade/runtime.min.js',
            __dirname + '/node_modules/jade/runtime.min.js',
            __dirname + '/jaderuntime.min.js'
        ],
        contents = walkdir.sync(templateDirectory),
        jadeRuntime = fs.readFileSync(_.find(placesToLook, fs.existsSync)).toString(),
        output = [
            '(function () {',
            'var root = this, exports = {};',
            '',
            '// The jade runtime:',
            'var jade = exports.' + jadeRuntime,
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
        output += '\nexports.' + arr.join('.') + ' = {};';
    });
    output += '\n';

    templates.forEach(function (file) {
        var name = path.basename(file, '.jade'),
            dirString = function () {
                var dirname = path.dirname(file),
                    arr = dirname.split(pathSep);
                if (dirname === '.') return name;
                arr.push(name);
                return arr.join('.');
            }(),
            fullPath = templateDirectory + '/' + file,
            template = beautify(jade.compile(fs.readFileSync(fullPath), {client: true, compileDebug: false, pretty: false, filename: fullPath}).toString());

        output += [
            '',
            '// ' + name + '.jade compiled template',
            'exports.' + dirString + ' = ' + template + ';',
            ''
        ].join('\n');
    });

    output += [
        '\n',
        '// attach to window or export with commonJS',
        'if (typeof module !== "undefined" && typeof module.exports !== "undefined") {',
        '    module.exports = exports;',
        '} else if (typeof define === "function" && define.amd) {',
        '    define(exports);',
        '} else {',
        '    root.templatizer = exports;',
        '}',
        '',
        '})();'
    ].join('\n');

    if (outputFile) fs.writeFileSync(outputFile, output);

    return output;
};
