var jade = require('jade');
var beautify = require('./lib/beautify');
var simplifyTemplate = require('./lib/simplifyTemplate');
var transformMixins = require('./lib/transformMixins');
var renameJadeFn = require('./lib/renameJadeFn');
var walkdir = require('walkdir');
var path = require('path');
var _ = require('underscore');
var fs = require('fs');
var uglifyjs = require('uglify-js');
var namedTemplateFn = require('./lib/namedTemplateFn');
var bracketedName = require('./lib/bracketedName');


module.exports = function (templateDirectories, outputFile, options) {
    options || (options = {});

    _.defaults(options, {
        dontTransformMixins: false,
        jade: {},
        ignoreExtends: []
    });

    if (typeof templateDirectories === "string") {
        templateDirectories = [templateDirectories];
    }
    var rootName = 'templatizer';
    var folders = [];
    var templates = [];
    var _readTemplates = [];
    var isWindows = process.platform === 'win32';
    var pathSep = path.sep || (isWindows ? '\\' : '/');
    var pathSepRegExp = /\/|\\/g;

    // Find jade runtime and create minified code
    // where it is assigned to the variable jade
    var placesToLook = [
        __dirname + '/node_modules/jade/lib/runtime.js',
        __dirname + '/jaderuntime.js'
    ];
    var jadeRuntime = fs.readFileSync(_.find(placesToLook, fs.existsSync)).toString();
    var wrappedJade = uglifyjs.minify('var jade = (function(){var exports={};' + jadeRuntime + 'return exports;})();', {fromString: true}).code;

    var outputTemplate = fs.readFileSync(__dirname + '/output_template.js').toString();
    var output = '';

    var jadeCompileOptions = {
        client: true,
        compileDebug: false,
        pretty: false
    };
    _.extend(jadeCompileOptions, options.jade);

    templateDirectories = _.map(templateDirectories, function (templateDirectory) {
        return templateDirectory.replace(pathSepRegExp, pathSep);
    });

    templateDirectories.forEach(function (templateDirectory) {
        if (!fs.existsSync(templateDirectory)) {
            throw new Error('Template directory ' + templateDirectory + ' does not exist.');
        }

        walkdir.sync(templateDirectory).forEach(function (file) {
            var item = file.replace(path.resolve(templateDirectory), '').slice(1);
            if (path.extname(item) === '' && path.basename(item).charAt(0) !== '.') {
                if (folders.indexOf(item) === -1) folders.push(item);
            } else if (path.extname(item) === '.jade') {
                // Throw an err if we are about to override a template
                if (_readTemplates.indexOf(item) > -1) {
                    throw new Error(item + ' from ' + templateDirectory + pathSep + item + ' already exists in ' + templates[_readTemplates.indexOf(item)]);
                }
                _readTemplates.push(item);
                templates.push(templateDirectory + pathSep + item);
            }
        });

        folders = _.sortBy(folders, function (folder) {
            var arr = folder.split(pathSep);
            return arr.length;
        });
    });

    output += folders.map(function (folder) {
        return rootName + bracketedName(folder.split(pathSep)) + ' = {};';
    }).join('\n') + '\n';

    var ignoreExtendsRegex = "extends (";
    var ignoreExtends = [];
    options.ignoreExtends.forEach(function(item) {
        ignoreExtends.push(item.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"));
    });
    ignoreExtendsRegex = new RegExp(ignoreExtendsRegex + ignoreExtends.join("|") + ")");

    templates.forEach(function (item) {
        var name = path.basename(item, '.jade');
        var dirString = function () {
            var itemTemplateDir = _.find(templateDirectories, function (templateDirectory) {
                return item.indexOf(templateDirectory + pathSep) === 0;
            });
            var dirname = path.dirname(item).replace(itemTemplateDir, '');
            if (dirname === '.') return name;
            dirname += '.' + name;
            return dirname.substring(1).replace(pathSepRegExp, '.');
        }();

        jadeCompileOptions.filename = item;
        var file = fs.readFileSync(item, 'utf-8');

        if (ignoreExtends.length >= 1) {
            file = file.split(/(\r\n|\r|\n)/);
            var newFile = [];

            file.forEach(function(line) {
                if (line.search(ignoreExtendsRegex) == -1) newFile.push(line);
            });

            file = newFile.join("\n");
        }


        var template = beautify(jade.compileClient(file, jadeCompileOptions).toString());

        template = renameJadeFn(template, dirString);
        template = simplifyTemplate(template);

        var mixins = [];
        if (!options.dontTransformMixins) {
            var astResult = transformMixins({
                template: template,
                name: name,
                dir: dirString,
                rootName: rootName
            });
            mixins = astResult.mixins;
            template = astResult.template;
        }

        output += namedTemplateFn({
            dir: dirString,
            rootName: rootName,
            fn: template
        });

        output += mixins.join('\n');
    });

    var indentOutput = output.split('\n').map(function (l) { return l ? '    ' + l : l; }).join('\n');
    var finalOutput = outputTemplate
        .replace('{{jade}}', wrappedJade)
        .replace('{{code}}', indentOutput);

    if (outputFile) fs.writeFileSync(outputFile, finalOutput);

    return finalOutput;
};
