var templatizer = require('./templatizer');
var path = require('path');
var outputPath = path.resolve(__dirname, 'test/builtTemplates');
var tmplPath = path.resolve(__dirname, 'test/templates');
var tmplPath2 = path.resolve(__dirname, 'test/templates2');


templatizer(tmplPath, path.resolve(outputPath, 'no_mixins.js'), {
    dontTransformMixins: true,
    namespace: 'unaltered'
});

templatizer([tmplPath, tmplPath2], path.resolve(outputPath, 'multiple_dirs.js'), {
    namespace: 'multipleDirs'
});

templatizer(tmplPath, path.resolve(outputPath, 'namespaced.js'), {
    namespace: 'app.nested'
});

templatizer(tmplPath, path.resolve(outputPath, 'bad_namespaced.js'), {
    namespace: 'app.nonExistant'
});

templatizer(tmplPath, path.resolve(outputPath, 'bad_namespaced2.js'), {
    namespace: 'app.isBoolean'
});

templatizer(tmplPath, path.resolve(outputPath, 'dont_remove_mixins.js'), {
    namespace: 'dontRemoveMixins',
    dontRemoveMixins: true
});

templatizer(tmplPath, path.resolve(outputPath, 'templates.js'));
