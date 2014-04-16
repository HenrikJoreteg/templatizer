var esprima = require('esprima');
var escodegen = require('escodegen');
var beautify = require('./beautify');
var _ = require('underscore');

// Traverse an AST with access to the node and
// the parent node during traversal
var traverse = function (node, func, parent) {
    func(node, parent);
    for (var key in node) {
        if (node.hasOwnProperty(key)) {
            var child = node[key];
            if (typeof child === 'object' && child !== null) {
                if (Array.isArray(child)) {
                    child.forEach(function (arrayNode) {
                        traverse(arrayNode, func, node);
                    });
                } else {
                    traverse(child, func, node); //6
                }
            }
        }
    }
};

// Will traverse all mixin calls in a tree
// and transform all of them
var transformAllMixins = function (tree, ns) {
    traverse(tree, function (node, parent) {
        if (node.type === 'CallExpression' && node.callee &&
            node.callee.type === 'MemberExpression' &&
            node.callee.object.name === 'jade_mixins') {

            // transform the call to the mixin fn and namespace it on this[ns]
            parent = transformMixinCall(parent, ns);
        }
    });
};


// Will transform a jade mixin fn call to
// a call to our mixin on the parent template namespace
var transformMixinCall = function (statement, ns) {
    // Property name of 'jade_mixins' is our mixin name
    var newName = statement.expression.callee.property.value;
    var oldArgs = statement.expression.arguments;
    var newCallee;

    // Make the mixin call as an argument to buf.push
    statement.expression.callee = {
        type: 'MemberExpression',
        computed: false,
        object: {
            type: 'Identifier',
            name: 'buf'
        },
        property: {
            type: 'Identifier',
            name: 'push'
        }
    };

    // Add our altered mixin name to our ns array
    ns = ns.split('.').concat(newName);

    // Loop through and build the namespaced callee
    for (var i = 1, l = ns.length; i < l; i++) {
        newCallee = JSON.stringify({
            type: 'MemberExpression',
            computed: false,
            object: i === 1 ? {
                type: 'Identifier',
                name: ns[i - 1]
            } : JSON.parse(newCallee),
            property: {
                type: 'Identifier',
                name: ns[i]
            }
        });
    }

    // Add namespaced callee as the argument
    statement.expression.arguments = [
        {
            type: 'CallExpression',
            callee: JSON.parse(newCallee),
            arguments: oldArgs
        }
    ];

    return statement;
};

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

module.exports.getMixins = function (options) {
    var ast = esprima.parse(options.template);
    var dirString = options.dirString;
    var parentObjName = options.parentObjName;
    var name = options.templateName;
    var astBody = ast.body[0].body.body;
    var mixinOutput = '';
    var outputTemplate = options.template;

    astBody.forEach(function (tree, treeI) {
        // clone the tree so as to modify in place
        var cloneTree = JSON.parse(JSON.stringify(tree)),
            type = cloneTree.type,
            declarationName = cloneTree.declarations && cloneTree.declarations[0].id.name,
            statements = [],
            fnTree = {},
            generatedMixinFn = '';

        var removeDeclarations = [];

        if (type === 'ExpressionStatement' &&
            cloneTree.expression.type === 'CallExpression' &&
            cloneTree.expression.callee.type === 'FunctionExpression') {

            cloneTree.expression.callee.body.body.forEach(function (expr, exprI) {
                var mixinName;
                if (expr.type === 'ExpressionStatement' &&
                    expr.expression.type === 'AssignmentExpression' &&
                    expr.expression.left.object.name === 'jade_mixins') {

                    removeDeclarations.push(exprI);
                    mixinName = expr.expression.left.property.value;

                    // Get mixin function from variable declaration
                    fnTree = expr.expression.right;

                    // Change to an anonymous function to be assigned later
                    fnTree.type = 'FunctionDeclaration';
                    fnTree.id = {
                        type: 'Identifier',
                        name: 'tmpl_' + dirString.replace(/[^A-Za-z0-9]/g, '_') + '_' + mixinName
                    };
                    statements = fnTree.body.body;

                    // Replace calls to other mixins within the file
                    transformAllMixins(statements, parentObjName + '.' + dirString);

                    // Add a variable declaration for the buf array
                    // since that was previously handled by jade
                    statements[0].declarations.push({
                        type: 'VariableDeclarator',
                        id: {
                            type: 'Identifier',
                            name: 'buf'
                        },
                        init: {
                            type: 'ArrayExpression',
                            elements: []
                        },
                    },
                    {
                        type: 'VariableDeclarator',
                        id: {
                            type: 'Identifier',
                            name: 'jade_interp'
                        },
                        init: null
                    });
                    // return the buf array
                    statements.push({
                        type: 'ReturnStatement',
                        argument: {
                            type: 'CallExpression',
                            callee: {
                                type: 'MemberExpression',
                                computed: false,
                                object: {
                                    type: 'Identifier',
                                    name: 'buf'
                                },
                                property: {
                                    type: 'Identifier',
                                    name: 'join'
                                }
                            },
                            arguments: [
                                {
                                    type: 'Literal',
                                    value: '',
                                    raw: '""'
                                }
                            ]
                        }
                    });

                    // Generate fn and store until it can be added to output after main fn
                    generatedMixinFn = beautify(escodegen.generate(fnTree));
                    mixinOutput += [
                        '',
                        '// ' + dirString.replace(/\./g, '/') + '.jade:' + mixinName + ' compiled template',
                        '' + parentObjName + '["' + dirString.replace(/\./g, '"]["') + '"]["' + mixinName.replace(/\./g, '"]["') + '"] = ' + generatedMixinFn + ';',
                        ''
                    ].join('\n');
                }
            });
        }

        if (removeDeclarations.length) {
            // Remove mixin declarations
            var len = removeDeclarations.length;
            while (len--) {
                tree.expression.callee.body.body.splice(removeDeclarations[len], 1);
            }

            removeDeclarations = [];
        }

    });

    // We actually found mixins
    if (mixinOutput) {
        // Traverse and replace mixin calls with buf.push(exports[dirString][mixin]())
        transformAllMixins(ast, parentObjName + '.' + dirString);

        // Regenerate our template function
        outputTemplate = beautify(escodegen.generate(ast));
    }

    return {mixins: mixinOutput, template: outputTemplate};
};
