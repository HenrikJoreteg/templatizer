var jade = require('jade'),
    uglifyjs = require('uglify-js'),
    findit = require('findit'),
    path = require('path'),
    _ = require('underscore'),
    fs = require('fs');

function beautify(code) {
    var ast = uglifyjs.parser.parse(code);
    return uglifyjs.uglify.gen_code(ast, {beautify: true});
}

module.exports = function (templateDirectory, outputFile, watch) {
    // first we want to add the runtime code we need
    // we var scope it so it doesn't create a global
    var jadeRuntime, output, item, i, l, contents, folders = [], templates = [];

    var isWindows = process.platform === 'win32';
    var pathSep = path.sep || (isWindows ? '\\' : '/');

    try {
        jadeRuntime = fs.readFileSync(__dirname + '/../jade/runtime.min.js');
    } catch (e) {
        jadeRuntime = fs.readFileSync(__dirname + '/node_modules/jade/runtime.min.js');
    }
    
    contents = findit.sync(templateDirectory);

    
    output = [
        '(function () {',
        'var root = this, exports = {};',
        '',
        '// The jade runtime:',
        'var ' + jadeRuntime,
        ''
    ].join('\n');

    for (i = 0, l = contents.length; i < l; i++) {
        item = contents[i].replace(templateDirectory, '').slice(1);
        if (path.extname(item) === '' && item.charAt(0) !== '.') {
            folders.push(item);
        } else if (path.extname(item) === '.jade') {
            templates.push(item);
        }
    }

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
            template = beautify(jade.compile(fs.readFileSync(fullPath), {client: true, compileDebug: false, pretty: true, filename: fullPath}).toString());

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
        'if (typeof module !== "undefined") {',
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
