var jade = require('jade'),
    uglifyjs = require('uglify-js'),
    fs = require('fs');

function beautify(code) {
    var ast = uglifyjs.parser.parse(code);
    return uglifyjs.uglify.gen_code(ast, {beautify: true});
}

module.exports = function (templateDirectory, outputFile, watch) {
    // first we want to add the runtime code we need
    // we var scope it so it doesn't create a global
    var output = [
        '(function () {',
        'var root = this, exports = {};',
        '',
        '// The jade runtime:',
        'var ' + fs.readFileSync(__dirname + '/node_modules/jade/runtime.min.js'),
        ''
    ].join('\n');

    // loop through all our templates
    fs.readdirSync(templateDirectory).forEach(function (file) {
        var split = file.split('.'),
            name = split[0],
            ext = split[1],
            template,
            filename = templateDirectory + '/' + file;        
        if (ext === 'jade') {
            template = beautify(jade.compile(fs.readFileSync(filename), {client: true, compileDebug: false, pretty: true, filename: filename}).toString());
            output += [
                '',
                '// ' + file + ' compiled:',
                'exports.' + name + ' = ' + template + ';',
                ''
            ].join('\n');
        }
    });

    output += [
        '\n',
        '// attach to windor or export with commonJS',
        'if (typeof exports !== "undefined") {',
        '    module.exports = exports;',
        '} else {',
        '    root.templatizer = exports;',
        '}',
        '',
        '})();'
    ].join('\n');

    if (outputFile) fs.writeFileSync(outputFile, output);

    return output;
};