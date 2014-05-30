var templatizer = require('../templatizer');
var path = require('path');
var tmplPath = path.resolve(__dirname, '../templates');
var tmplPath2 = path.resolve(__dirname, '../templates2');


templatizer(tmplPath, path.resolve(__dirname, '../test/demo_output_no_mixins.js'), {dontTransformMixins: true});
templatizer([tmplPath, tmplPath2], path.resolve(__dirname, '../test/demo_output_multiple_dirs.js'));
templatizer(tmplPath, path.resolve(__dirname, '../test/demo_output.js'));
