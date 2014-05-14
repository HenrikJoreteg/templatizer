/* globals test, ok */

var t = require('./demo_output.js');
var data = {
    users: [{
        name: 'larry',
        url: 'http://andyet.com',
        id: 1
    }, {
        name: 'curly',
        url: 'http://andbang.com',
        id: 2
    }, {
        name: 'moe',
        url: 'http://talky.io',
        id: 3
    }]
};

module.exports = {
    start: function () {
        test("Test that templates work when browserified", function () {
            var users = t.users,
                withLocals = t.usersLocals;

            ok(users({users: data.users}) === withLocals({users: data.users}));
        });
    }
};

module.exports.start();
