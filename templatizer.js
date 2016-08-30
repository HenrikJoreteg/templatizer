var jade = require('jade');
var async = require('async');
var beautify = require('./lib/beautify');
var simplifyTemplate = require('./lib/simplifyTemplate');
var transformMixins = require('./lib/transformMixins');
var renameJadeFn = require('./lib/renameJadeFn');
var walkdir = require('walkdir');
var path = require('path');
var util = require('util');
var _ = require('lodash');
var fs = require('fs');
var glob = require('glob');
var minimatch = require('minimatch');
var namedTemplateFn = require('./lib/namedTemplateFn');
var bracketedName = require('./lib/bracketedName');

// Setting dynamicMixins to true will result in
// all mixins being written to the file
function DynamicMixinsCompiler() {
    jade.Compiler.apply(this, arguments);
    this.dynamicMixins = true;
}
util.inherits(DynamicMixinsCompiler, jade.Compiler);

// Our internal namespace
var NAMESPACE = 'templatizer';

module.exports = function (input, output, options, done) {
    var args = arguments;

    if (args.length === 3) {
        // input, output, done
        if (_.isString(args[1]) && _.isFunction(args[2])) {
            done = args[2];
            options = null;
        }
        // input, options, done
        else if (_.isObject(args[1]) && _.isFunction(args[2])) {
            done = args[2];
            options = args[1];
            output = null;
        }
    } else if (arguments.length === 2) {
        // input, done
        if (_.isFunction(args[1])) {
            done = args[1];
            options = null;
            output = null;
        }
        // input, options
        else if (_.isObject(args[1])) {
            options = args[1];
            done = null;
            output = null;
        }
    }

    // Default values for done and options so we dont error
    done || (done = function (err, compiledOutput) {
        if (err) {
            throw err;
        } else {
            process.stdout.write(compiledOutput);
        }
    });
    options || (options = {});

    _.defaults(options, {
        transformMixins: false,
        jade: {},
        globOptions: {}
    });

    var isWindows = process.platform === 'win32';
    var pathSep = path.sep || (isWindows ? '\\' : '/');
    var pathSepRegExp = /\/|\\/g;
    var jadeCompileOptions = _.extend({
        client: true,
        compileDebug: false,
        pretty: false
    }, options.jade);
    async.waterfall([
        function (cb) {
            if (typeof input === "string") {
                glob(input, options.globOptions, cb);
            } else {
                cb(null, input);
            }
        },
        function (matches, cb) {
            var directories = _.chain(matches)
                .map(function (templateDirectory) {
                    if (path.extname(templateDirectory).length > 1) {
                        // Remove filename and ext
                        return path.dirname(templateDirectory).replace(pathSepRegExp, pathSep);
                    }
                    return templateDirectory.replace(pathSepRegExp, pathSep);
                })
                .uniq()
                .value();

            if (!directories || directories.length === 0) {
                return cb(new Error(input + ' did not match anything existing'));
            }

            async.each(directories, function (dir, dirDone) {
                fs.exists(dir, function (exists) {
                    if (!exists) {
                        dirDone(new Error('Template directory ' + dir + ' does not exist.'));
                    } else {
                        dirDone(null);
                    }
                });
            }, function (err) {
                cb(err, err ? null : directories);
            });
        },
        function (directories, cb) {
            var folders = [];
            var templates = [];
            var _readTemplates = [];
            var conflicts = [];
            async.each(directories, function (dir, dirDone) {
                var files = [];
                var walker = walkdir(dir);
                walker.on('path', function (file) {
                    files.push(file);
                });

                walker.on('end', function () {
                    files.sort();
                    async.each(files, function (file, done) {

                        var item = file.replace(path.resolve(dir), '').slice(1);
                        // Skip hidden files
                        if (item.charAt(0) === '.' || item.indexOf(pathSep + '.') !== -1) {
                            return done();
                        }

                        // Skip files not matching the initial globbing pattern
                        if (options.globOptions.ignore) {
                            var match = function (ignorePattern) {
                                return minimatch(file, ignorePattern);
                            };
                            if (options.globOptions.ignore.some(match)) {
                                return done();
                            }
                        }

                        if (path.extname(item) === '' && path.basename(item).charAt(0) !== '.') {
                            if (folders.indexOf(item) === -1) folders.push(item);
                        } else if (path.extname(item) === '.jade') {
                            // Store an err if we are about to override a template
                            if (_readTemplates.indexOf(item) > -1) {
                                conflicts.push(item + ' from ' + dir + pathSep + item + ' already exists in ' + templates[_readTemplates.indexOf(item)]);
                            } else {
                                _readTemplates.push(item);
                                templates.push(dir + pathSep + item);
                            }
                        }
                        done();
                    }, function (err) {
                        if (err) { return dirDone(err); }
                        if (conflicts.length) {
                            dirDone(new Error(conflicts.join(', ')));
                        } else {
                            dirDone(null);
                        }
                    });
                });
            }, function (err) {
                cb(err, { templates: templates, folders: folders, directories: directories });
            });
        },
        function (results, cb) {
            var directories = results.directories;
            var folders = results.folders;
            var templates = results.templates;
            var compiledOutput = _.sortBy(folders, function (folder) {
                var arr = folder.split(pathSep);
                return arr.length;
            }).map(function (folder) {
                return NAMESPACE + bracketedName(folder.split(pathSep)) + ' = {};';
            }).join('\n') + '\n';
            async.eachSeries(templates, function (item, readDone) {
                fs.readFile(item, { encoding: 'utf-8' }, function (err, rawTemplate) {
                    if (err) {
                        readDone(err);
                    } else {
                        var name = path.basename(item, '.jade');
                        var dirString = function () {
                            var itemTemplateDir = _.find(directories, function (templateDirectory) {
                                return item.indexOf(templateDirectory + pathSep) === 0;
                            });
                            var dirname = path.dirname(item).replace(itemTemplateDir, '');
                            if (dirname === '.') return name;
                            dirname += '.' + name;
                            return dirname.substring(1).replace(pathSepRegExp, '.');
                        } ();

                        // If we are transforming mixins then use the dynamic
                        // compiler so unused mixins are never removed
                        if (options.transformMixins) {
                            jadeCompileOptions.compiler = DynamicMixinsCompiler;
                        }
                        jadeCompileOptions.filename = item;

                        var compiledTemplate;
                        try {
                            compiledTemplate = jade.compileClient(rawTemplate, jadeCompileOptions);
                        } catch (e) {
                            cb(e);
                            return;
                        }
                        var template = beautify(compiledTemplate.toString());
                        template = renameJadeFn(template, dirString);
                        template = simplifyTemplate(template);

                        var mixins = [];
                        if (options.transformMixins) {
                            var astResult = transformMixins({
                                template: template,
                                name: name,
                                dir: dirString,
                                rootName: NAMESPACE
                            });
                            mixins = astResult.mixins;
                            template = astResult.template;
                        }

                        compiledOutput += namedTemplateFn({
                            dir: dirString,
                            rootName: NAMESPACE,
                            fn: template
                        });

                        compiledOutput += mixins.join('\n');

                        readDone(null);
                    }
                });
            }, function (err) {
                cb(err, compiledOutput);
            });
        }
    ],
        function (err, compiledOutput) {
            if (err) {
                done(err);
            } else {
                var commonJSOutput = "var jade = require('@lukekarrys/jade-runtime');\n\n" +
                    "var " + NAMESPACE + " = {};\n\n" +
                    compiledOutput + "\n\n" +
                    "module.exports = " + NAMESPACE + ";\n";

                if (output) {
                    fs.writeFile(output, commonJSOutput, function (fileErr) {
                        done(fileErr, fileErr ? null : commonJSOutput);
                    });
                } else {
                    done(null, commonJSOutput);
                }
            }
        });
};
