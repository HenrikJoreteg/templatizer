var jade = require('jade'),
    fs = require('fs');


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
            template;        
        if (ext === 'jade') {
            template = jade.compile(fs.readFileSync(templateDirectory + '/' + file), {client: true, compileDebug: false, pretty: true}).toString();
            output += [
                '',
                '// ' + file + ' compiled:',
                'exports.' + name + '=' + template
            ].join('\n');
        }
    });

    output += [
        '\n',
        '// attach to windor or export with commonJS',
        'if (typeof exports !== "undefined") {',
        '\tmodule.exports = exports;',
        '} else {',
        '\troot.templatizer = exports;',
        '}',
        '',
        '})();'
    ].join('\n');

    if (outputFile) fs.writeFileSync(outputFile, output);

    return output;
};