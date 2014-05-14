var esprima = require('esprima');
var escodegen = require('escodegen');
var falafel = require('falafel');
var namedTemplateFn = require('./namedTemplateFn');
var safeName = require('./safeName');


module.exports.renameFunc = function (func, name) {
    var ast = esprima.parse(func);
    ast.body[0].id.name = 'tmpl_' + name.replace(/[^A-Za-z0-9]/g, '_');
    return escodegen.generate(ast);
};


module.exports.simplifyTemplate = function (func) {
    var ast = esprima.parse(func);

    var funcRoot = ast.body[0].body.body;
    if (funcRoot.length === 5) {
        //determine if there are only the buf declaration, the push of one string and then the return of the buf.join
        var simpleString = '';
        var cnt = 0;

        try {
            funcRoot.forEach(function (node, i) {
                /* check for buf declare */
                if (i === 0 && node.type === "VariableDeclaration" && node.declarations[0].id.name === "buf" &&
                    (node.declarations[0].init.elements instanceof Array && node.declarations[0].init.elements.length === 0)) {
                    cnt++;
                }

                /* check for jade_mixins declare */
                if (i === 1 && node.type === "VariableDeclaration" && node.declarations[0].id.name === "jade_mixins" &&
                    (node.declarations[0].init.type === 'ObjectExpression' && node.declarations[0].init.properties.length === 0)) {
                    cnt++;
                }

                /* check for jade_interp declare */
                if (i === 2 && node.type === "VariableDeclaration" && node.declarations[0].id.name === "jade_interp" &&
                    (node.declarations[0].init === null)) {
                    cnt++;
                }

                /* check for single string push */
                if (i === 3 && node.type === "ExpressionStatement" && node.expression.callee.object.name === "buf" &&
                    node.expression.arguments.length === 1 && node.expression.arguments[0].type === "Literal") {
                    /* save the simple string */
                    simpleString = node.expression.arguments[0].value;
                    cnt++;
                }

                /* check for buf join */
                if (i === 4 && node.type === "ReturnStatement" && node.argument.callee.object.name === "buf" &&
                    node.argument.callee.property.name === "join" && node.argument.arguments.length === 1  && node.argument.arguments[0].value === '') {
                    cnt++;
                }

            });

        } catch (e) {}

        // All the conditions were met, it's a simple template
        if (cnt === 5) {
            //replace the funcRoot with a simple return;
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


module.exports.falafel = function (options) {
    var mixins = [];
    var template = falafel(options.template, function (node) {
        var mixinName;
        var args;

        // Check all assignments to see if they are mixins
        if (
            node.type === 'ExpressionStatement' &&
            node.expression.type === 'AssignmentExpression' &&
            node.expression.left &&
            node.expression.left.object &&
            node.expression.left.object.name === 'jade_mixins'
        ) {
            mixinName = node.expression.left.property.value;
            node.expression.left.update('__REPLACE_THIS__');
            mixins.push(namedTemplateFn({
                fn: node.source().replace('__REPLACE_THIS__ = ', ''),
                rootName: options.rootName,
                dir: options.dir,
                mixinName: mixinName
            }));
            node.update('');
        }

        // Check all fn calls to see if they are mixins
        // TODO: check for .call
        else if (
            node.type === 'ExpressionStatement' &&
            node.expression.type === 'CallExpression' &&
            node.expression.callee &&
            node.expression.callee.object &&
            node.expression.callee.object.name === 'jade_mixins'
        ) {
            mixinName = node.expression.callee.property.value;
            args = node.expression.arguments.map(function (a) { return a.name; }).join(',');
            node.update('buf.push(' + options.rootName + safeName(options.dir.split('.').concat(mixinName)) + '(' + args + '));');
        }
    });

    return {
        template: template,
        mixins: mixins
    };
};

