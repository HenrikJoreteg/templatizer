var templatizer = require('./templatizer'),
    colors = require('colors'),
    yetify = require('yetify'),
    fs = require('fs'),
    ich = require('./icanhaz');

// test setup
var data = {users: ['larry', 'curly', 'moe']};
var ITERATIONS = 100000;
var i = ITERATIONS;

// build our demo file
templatizer(__dirname + '/templates', __dirname + '/demo_output.js');
console.log('\nSetting up templatizer'.bold);
console.log('1.'.grey + ' built: demo_output.js');
console.log('2.'.grey + ' now reading in generated file');
var templates = require('./demo_output');

console.log('3.'.grey + ' running templatizer version ' + ITERATIONS + ' times.');
console.time('templatizer');
while (i--) {
    templates.users(data);    
}
console.timeEnd('templatizer');


console.log('\nSetting up icanhaz'.bold);
ich.addTemplate('users', fs.readFileSync(__dirname + '/templates/users.html', 'utf-8'));
console.log('1.'.grey + ' icanhaz added: templates/users.html');
console.log('2.'.grey + ' Running ICanHaz version ' + ITERATIONS + ' times.');

i = ITERATIONS;
console.time('icanhaz');
while (i--) {
    ich.users(data, true);    
}
console.timeEnd('icanhaz');

console.log('\n\ntemplatizer.js'.bold + ' was made with love by ' + yetify.logo() + ' for you!' + ' <3'.red + '\n');