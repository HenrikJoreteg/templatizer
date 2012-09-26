var templatizer = require('./templatizer'),
    colors = require('colors'),
    yetify = require('yetify');

// build our demo file
templatizer(__dirname + '/templates', __dirname + '/demo_output.js');
console.log('\nTemplatizer Demo'.bold);
console.log('1.'.grey + ' built: demo_output.js');
console.log('2.'.grey + ' now reading in generated file');
var templates = require('./demo_output');
console.log('3.'.grey + ' rendering users.jade template to html:');
console.log(templates.users({users: ['larry', 'curly', 'moe']}).green + '\n');
console.log('4.'.grey + ' rendering a deeply nested template: otherfolder.deep2.deeptweet');
console.log(templates.otherfolder.deep2.deeptweet({tweet: 'hello, templatizer!'}).green + '\n');


console.log('templatizer.js'.bold + ' was made with love by ' + yetify.logo() + ' for you!' + ' <3'.red + '\n');