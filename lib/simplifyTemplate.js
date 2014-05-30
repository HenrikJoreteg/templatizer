var esprima = require('esprima');
var escodegen = require('escodegen');


module.exports = function (func) {
    var ast = esprima.parse(func);

    var funcRoot = ast.body[0].body.body;
    if (funcRoot.length === 5) {
        // determine if there are only the buf declaration, the push of one string and then the return of the buf.join
        var simpleString = '';
        var cnt = 0;

        funcRoot.forEach(function (node, i) {
            // check for buf declare
            if (i === 0 && node.type === "VariableDeclaration" && node.declarations[0].id.name === "buf" &&
                (node.declarations[0].init.elements instanceof Array && node.declarations[0].init.elements.length === 0)) {
                cnt++;
            }

            // check for jade_mixins declare
            if (i === 1 && node.type === "VariableDeclaration" && node.declarations[0].id.name === "jade_mixins" &&
                (node.declarations[0].init.type === 'ObjectExpression' && node.declarations[0].init.properties.length === 0)) {
                cnt++;
            }

            // check for jade_interp declare
            if (i === 2 && node.type === "VariableDeclaration" && node.declarations[0].id.name === "jade_interp" &&
                (node.declarations[0].init === null)) {
                cnt++;
            }

            // check for single string push
            if (i === 3 && node.type === "ExpressionStatement" && node.expression.callee.object.name === "buf" &&
                node.expression.arguments.length === 1 && node.expression.arguments[0].type === "Literal") {
                // save the simple string
                simpleString = node.expression.arguments[0].value;
                cnt++;
            }

            // check for buf join
            if (i === 4 && node.type === "ReturnStatement" && node.argument.callee.object.name === "buf" &&
                node.argument.callee.property.name === "join" && node.argument.arguments.length === 1  && node.argument.arguments[0].value === '') {
                cnt++;
            }
        });

        // All the conditions were met, it's a simple template
        if (cnt === 5) {
            // replace the funcRoot with a simple return;
            var simpleRoot = [{
                type: 'ReturnStatement',
                argument: {
                    type: 'Literal',
                    value: simpleString
                }
            }];
            ast.body[0].body.body = simpleRoot;

            //remove function parameter
            ast.body[0].params = [];
        }
    }

    return escodegen.generate(ast);
};