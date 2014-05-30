var esprima = require('esprima');
var escodegen = require('escodegen');
var tmplName = require('./templateName');


module.exports = function (func, name) {
    var ast = esprima.parse(func);
    ast.body[0].id.name = tmplName(name);
    return escodegen.generate(ast);
};
