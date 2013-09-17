var templatizer = require('../templatizer'),
    path = require('path');


templatizer(path.resolve(__dirname, '../templates'), path.resolve(__dirname, '../test/demo_output_no_mixins.js'), true);
templatizer(path.resolve(__dirname, '../templates'), path.resolve(__dirname, '../demo_output.js'));