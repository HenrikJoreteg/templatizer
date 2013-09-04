var templatizer = require('../templatizer');

// build our demo file
templatizer(__dirname + '/templates', __dirname + '/demo_output.js', {beautify: true});