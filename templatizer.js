var jade = require('jade');
var esprima = require('esprima');
var escodegen = require('escodegen');
var uglifyjs = require('uglify-js');
var walkdir = require('walkdir');
var path = require('path');
var _ = require('underscore');
var fs = require('fs');


function beautify(code) {
    return uglifyjs.parse(code).print_to_string({beautify: true});
}

// Epsrima/Escodegen helpers
var rIsMixin = /_mixin$/;
var isMixinCall = function (expression) {
    var sExprType = expression && expression.type,
        sCallee = expression && expression.callee,
        sCalleeName = sCallee && sCallee.name;
    return sExprType === 'CallExpression' && rIsMixin.test(sCalleeName);
};
var traverse = function (node, func, parent) {
    func(node, parent);//1
    for (var key in node) { //2
        if (node.hasOwnProperty(key)) { //3
            var child = node[key];
            if (typeof child === 'object' && child !== null) { //4
                if (Array.isArray(child)) {
                    child.forEach(function (arrayNode) { //5
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
        if (node.type === 'CallExpression' && node.callee && rIsMixin.test(node.callee.name)) {
            // transform the call to the mixin fn and namespace it on this[ns]
            parent = transformMixinCall(parent, ns);
        }
    });
};
// Will transform a jade mixin fn call to
// a call to our mixin on the parent template namespace
var transformMixinCall = function (statement, ns) {
    if (isMixinCall(statement.expression)) {
        var oldName = statement.expression.callee.name;
        var oldArgs = statement.expression.arguments;
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
        statement.expression.arguments = [{
            type: 'CallExpression',
            callee: {
                type: 'MemberExpression',
                computed: false,
                object: {
                    type: 'ThisExpression'
                },
                property: {
                    type: 'Identifier',
                    name: oldName.replace('_mixin', '')
                }
            },
            arguments: oldArgs
        }];

        // Passing in a namespace will transform the mixin to be called
        // by this[ns] instead of just this
        if (ns) {
            statement.expression.arguments[0].callee.object = {
                type: 'MemberExpression',
                computed: false,
                object: {
                    type: 'ThisExpression'
                },
                property: {
                    type: 'Identifier',
                    name: ns
                }
            };
        }
    }
    return statement;
};

module.exports = function (templateDirectory, outputFile, dontTransformMixins) {
    var folders = [];
    var templates = [];
    var isWindows = process.platform === 'win32';
    var pathSep = path.sep || (isWindows ? '\\' : '/');
    var placesToLook = [
            __dirname + '/../jade/runtime.min.js',
            __dirname + '/node_modules/jade/runtime.min.js',
            __dirname + '/jaderuntime.min.js'
        ];
    var contents = walkdir.sync(templateDirectory);
    var jadeRuntime = fs.readFileSync(_.find(placesToLook, fs.existsSync)).toString();
    var output = [
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
        var name = path.basename(file, '.jade');
        var dirString = function () {
            var dirname = path.dirname(file);
            var arr = dirname.split(pathSep);
            if (dirname === '.') return name;
            arr.push(name);
            return arr.join('.');
        }();
        var fullPath = templateDirectory + '/' + file;
        var template = beautify(jade.compile(fs.readFileSync(fullPath), {
            client: true,
            compileDebug: false,
            pretty: false,
            filename: fullPath
        }).toString());
        var ast = esprima.parse(template);
        var astBody = ast.body[0].body.body;
        var mixinOutput = '';
        var removeDeclarations = [];

        astBody.forEach(function (tree, treeI) {
            // clone the tree so as to modify in place
            var cloneTree = JSON.parse(JSON.stringify(tree)),
                type = cloneTree.type,
                declarationName = cloneTree.declarations && cloneTree.declarations[0].id.name,
                statements = [],
                fnTree = {},
                generatedMixinFn = '';

            if (type === 'VariableDeclaration' && rIsMixin.test(declarationName)) {
                // It's a mixin so we'll make our changes and mark the index for removal
                removeDeclarations.push(treeI);
                // Get mixin function from variable declaration
                fnTree = cloneTree.declarations[0].init;

                // Change to an anonymous function to be assigned later
                fnTree.type = 'FunctionDeclaration';
                fnTree.id = {
                    type: 'Identifier',
                    name: 'anonymous'
                };
                statements = fnTree.body.body;

                // Replace calls to other mixins within the file
                transformAllMixins(statements);
                
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
                    }
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
                    '// ' + name + '.jade:' + declarationName + ' compiled template',
                    'exports.' + dirString + '.' + declarationName.replace('_mixin', '') + ' = ' + generatedMixinFn + ';',
                    ''
                ].join('\n');
            }
        });

        if (removeDeclarations.length && !dontTransformMixins) {
            // Remove mixin declarations
            var len = removeDeclarations.length;
            while (len--) {
                astBody.splice(removeDeclarations[len], 1);
            }

            // Traverse and replace mixin calls with buf.push(this[ns][mixin]())
            transformAllMixins(ast, _.last(dirString.split('.')));

            // Regenerate our template function
            template = beautify(escodegen.generate(ast));
        }

        output += [
            '',
            '// ' + name + '.jade compiled template',
            'exports.' + dirString + ' = ' + template + ';',
            ''
        ].join('\n') + mixinOutput;
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
