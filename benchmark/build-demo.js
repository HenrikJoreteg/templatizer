var templatizer = require('../templatizer');
var path = require('path');
var tmplPath = path.resolve(__dirname, '../templates');
var tmplPath2 = path.resolve(__dirname, '../templates2');


templatizer(tmplPath, path.resolve(__dirname, '../test/demo_output_no_mixins.js'), {
    dontTransformMixins: true,
    namespace: 'unaltered'
});

templatizer([tmplPath, tmplPath2], path.resolve(__dirname, '../test/demo_output_multiple_dirs.js'), {
    namespace: 'multipleDirs'
});

templatizer(tmplPath, path.resolve(__dirname, '../test/demo_output_namespaced.js'), {
    namespace: 'app.nested'
});

templatizer(tmplPath, path.resolve(__dirname, '../test/demo_output_bad_namespaced.js'), {
    namespace: 'app.nonExistant'
});

templatizer(tmplPath, path.resolve(__dirname, '../test/demo_output_bad_namespaced2.js'), {
    namespace: 'app.isBoolean'
});

templatizer(tmplPath, path.resolve(__dirname, '../test/demo_output.js'));
