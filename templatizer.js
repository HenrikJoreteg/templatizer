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

module.exports = function (templateDirectory, outputFile) {
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
        var ast = esprima.parse(template).body[0].body.body;
        var mixinOutput = '';

        ast.forEach(function (tree) {
            var type = tree.type,
                declarationName = tree.declarations && tree.declarations[0].id.name,
                statements = [],
                fnTree = {},
                generatedMixinFn = '';

            if (type === 'VariableDeclaration' && /_mixin$/.test(declarationName)) {
                // Get mixin function from variable declaration
                fnTree = tree.declarations[0].init;

                // Change to an anonymous function to be assigned later
                fnTree.type = 'FunctionDeclaration';
                fnTree.id = {
                    type: 'Identifier',
                    name: 'anonymous'
                };
                statements = fnTree.body.body;

                // Replace calls to other mixins within the file
                statements.forEach(function (statement, i) {
                    var sType = statement.type,
                        sExpr = statement.expression,
                        sExprType = sExpr && sExpr.type,
                        sCallee = sExpr && sExpr.callee,
                        sArgs = sExpr && sExpr.arguments,
                        sCalleeName = sCallee && sCallee.name;

                    if (sType === 'ExpressionStatement' && sExprType === 'CallExpression' && /_mixin$/.test(sCalleeName)) {
                        statements[i].expression.callee = {
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
                        statements[i].expression.arguments = [{
                            type: 'CallExpression',
                            callee: {
                                type: 'MemberExpression',
                                computed: false,
                                object: {
                                    type: 'ThisExpression'
                                },
                                property: {
                                    type: 'Identifier',
                                    name: sCalleeName.replace('_mixin', '')
                                }
                            },
                            arguments: sArgs
                        }];
                    }

                });
                
                // Add a variable declaration and return statement for the buffer
                // since its no longer supplied by jade
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
