var path = require('path');
var bracketedName = require('./bracketedName');
var beautify = require('./beautify');

function toFileName(name) {
    return name.replace(/\./g, path.sep);
}

function toVarName(name) {
    return bracketedName(name.split('.'));
}

module.exports = function (options) {
    var fileName = toFileName(options.dir) + '.jade';
    var varName = toVarName(options.dir);

    if (options.mixinName) {
        fileName += ':' + toFileName(options.mixinName);
        varName += toVarName(options.mixinName);
    }

    return [
        '',
        '// ' + fileName + ' compiled template',
        beautify(options.rootName + varName + ' = ' + options.fn + (options.fn.toString().slice(-1) === ';' ? '' : ';')),
        ''
    ].join('\n');
};