var esprima = require('esprima');
var escodegen = require('escodegen');
var falafel = require('falafel');
var namedTemplateFn = require('./namedTemplateFn');
var bracketedName = require('./bracketedName');


module.exports.renameFunc = function (func, name) {
    var ast = esprima.parse(func);
    ast.body[0].id.name = tmplName(name);
    return escodegen.generate(ast);
};


module.exports.simplifyTemplate = function (func) {
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


function bufDeclartion(name) {
    return {
        "type": "VariableDeclarator",
        "id": {
            "type": "Identifier",
            "name": name || "buf"
        },
        "init": {
            "type": "ArrayExpression",
            "elements": []
        }
    };
}

function returnBuf(name) {
    return {
        "type": "ReturnStatement",
        "argument": {
            "type": "CallExpression",
            "callee": {
                "type": "MemberExpression",
                "computed": false,
                "object": {
                    "type": "Identifier",
                    "name": name || "buf"
                },
                "property": {
                    "type": "Identifier",
                    "name": "join"
                }
            },
            "arguments": [
                {
                    "type": "Literal",
                    "value": "",
                    "raw": "\"\""
                }
            ]
        }
    };
}

function tmplName(name) {
    return 'tmpl_' + name.replace(/[^A-Za-z0-9]/g, '_');
}

function transformMixinCalls(node, options) {
    var mixinName;
    var newCall;

    // Check all fn calls to see if they are mixins
    if (
        node.type === 'ExpressionStatement' &&
        node.expression.type === 'CallExpression' &&
        node.expression.callee &&
        node.expression.callee.object &&
        (
            node.expression.callee.object.name === 'jade_mixins' ||
            (
                node.expression.callee.object.object &&
                node.expression.callee.object.object.name === 'jade_mixins'
            )
        )
    ) {
        mixinName = node.expression.callee.property.value || node.expression.callee.object.property.value;

        // Call the function from templatizer and its path
        // Also send the func return val to the buffer array
        newCall = 'buf.push(' + options.rootName + bracketedName(options.dir.split('.').concat(mixinName));
        newCall = node.source().replace(/^jade_mixins\[.*\]([\s\S]*);$/gm, newCall + '$1);');

        // TODO: use codegen to add buf to block
        // Use the buf that is scoped to the mixin for the block
        newCall = newCall.replace('block: function () {', 'block: function (buf) {');

        node.update(newCall);
    }
}

function findAndReplaceMixin(node, options) {
    var mixinName;
    var mixinStatements;
    var mixin = '';

    // Check all assignments to see if they are mixins
    if (
        node.type === 'ExpressionStatement' &&
        node.expression.type === 'AssignmentExpression' &&
        node.expression.left &&
        node.expression.left.object &&
        node.expression.left.object.name === 'jade_mixins'
    ) {
        mixinName = node.expression.left.property.value;
        mixinStatements = node.expression.right.body.body;

        // Add buffer array to variable declarations
        mixinStatements[0].declarations.push(bufDeclartion());

        // Return the buffer joined as a string from the function
        mixinStatements.push(returnBuf());

        // Update the node
        node.expression.update(escodegen.generate(node.expression));

        // Make the mixin a named function declaration
        node.expression.right.type = 'FunctionDeclaration';
        node.expression.right.id = {
            "type": "Identifier",
            "name": tmplName(options.dir + '_' + mixinName)
        };

        // Traverse newly updated mixin functions for calls to other mixins
        mixin = falafel(escodegen.generate(node.expression.right), function (node) {
            transformMixinCalls(node, options);
        }).toString();

        // TODO: use codegen to add buf to block
        // Use the buf scoped to the mixin for each block
        mixin = mixin.replace(/block && block\(\);/g, 'block && block(buf);'),

        // Add a commented and named function to be returned
        mixin = namedTemplateFn({
            fn: mixin,
            rootName: options.rootName,
            dir: options.dir,
            mixinName: mixinName
        });

        // Remove the previous creation of the mixin function
        node.update('');
    }

    return mixin;
}

module.exports.falafel = function (options) {
    var mixins = [];

    var template = falafel(options.template, function (node) {
        var mixin = findAndReplaceMixin(node, options);
        if (mixin) mixins.push(mixin);
        transformMixinCalls(node, options);
    });

    return {
        template: template,
        mixins: mixins
    };
};

