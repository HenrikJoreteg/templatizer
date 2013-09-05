/* globals test, ok, templatizer */

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

var outerHTML = function ($el) {
    return $('<div>').append($el.clone()).html();
};

test("Test mixins", function () {
    var $users = $(templatizer.users({users: data.users}));
    var $user1 = $users.find('li').eq(0);
    var user_li = templatizer.users.user_li(data.users[0]);
    var user_a = templatizer.users.user_a(data.users[0]);

    console.log(outerHTML($user1))
    console.log(user_li)
    console.log(outerHTML($user1) == user_li)

    ok($user1.html() === user_a, "Passed!");
    ok(outerHTML($user1) === user_li, "Passed!");
});