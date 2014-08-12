# templatizer.js

Simple solution for compiling jade templates into vanilla JS functions for blazin' fast client-side use.

## What is this?

Client-side templating is overly complicated, ultimately what you *actually* want is a function you can call from your JS that puts your data in a template. Why should I have to send a bunch of strings with Mustaches `{{}}` or other silly stuff for the client to parse? Ultimately, all I want is a function that I can call with some variable to render the string I want.

So, the question is, what's a sane way to get to that point? Enter [jade](http://jade-lang.com). Simple, intuitive templating, and happens to be what I use on the server anyway. So... Jade has some awesome stuff for compiling templates into functions. I just built templatizer to make it easy to turn a folder full of jade templates into a CommonJS module that exports all the template functions by whatever their file name.

## Is it faster?
From my tests it's 6 to 10 times faster than mustache.js with ICanHaz.

## How do I use it?

1. `npm install templatizer`
1. Write all your templates as individual jade files in a folder in your project.
1. Somewhere in your build process do this:

```js
var templatizer = require('templatizer');

// pass in the template directory and what you want to
// save the output file as. That's it!
templatizer(__dirname + '/templates', __dirname + '/demo_output.js', options);
```

So a folder like this

```
/clienttemplates
   user.jade
   app.jade
   /myfolder
     nestedTemplate.jade
```

Compiles down to a JS file that looks something like this:

```js
// here's about 1.6k worth of utils that jade uses to DRY up the template code a bit.
// Includes some basic shims for Object.keys, etc.
var jade=function(exports){ ... }

// a function built from the `user.jade` file
// that takes your data and returns a string.
exports.user = function () {}

// built from the `app.jade` file
exports.app = function () {} // the function

// folders become nested objects so
// myfolder/nestedTemplate.jade becomes
exports.myfolder.nestedTemplate = function () {} // the template function

// etc. etc
```

The awesome thing is... there are no external dependencies because they're just functions at this point. Crazy fast, SO MUCH WIN!!!!

### Options

The third parameter passed to `templatizer` is an options object.

#### `namespace` (string, default `window`)

If you are using templatizer as a global in the browser (without node, requirejs, browserify, or something similar) by default it will attach itself to `window`. Using `namespace` you can attach it to a different global object. For example:

```js
templatizer(templatesDir, 'templates.js', {
    namespace: 'app'
});
```

```html
<script>var app = {};</script>
<script src="templates.js"></script>
<script>
  // Templates will be available on app.templatizer
  document.body.innerHTML = app.templatizer.body();
</script>
```

#### `jade` (object, default `{}`)

`jade` is an object which will be passed directly to `jade.compile()`. See the [Jade API documentation](http://jade-lang.com/api/) for what options are available.

Here's an example where we set the Jade `compileDebug` option to `true`.

```js
templatizer(templatesDir, outputFile, {
    // Options
    jade: {
        compileDebug: true
    }
});
```

### Mixin Support

Jade has a feature called `mixins` which when compiled get treated as function declarations within the compiled function. Templatizer pulls these out of the compiled function and places them on the namespace of the parent function. For example:

```jade
// users.jade
ul
    each user in users
        mixin user(user)

mixin user(user)
    // Jade mixin content
```

Templatizer will compile this as

```js
// Compiled fn from file
exports.users = function () {}

// Compiled mixin fn
exports.users.user = function (user) {}
```

This is helpful as it allows you to call `users()` to create your list and then `users.user()` to render just a single item in the list.

## CLI

Templatizer comes with a bin script to use from makefiles/package.json scripts/etc, it works like this:

```
$ templatizer -d path/to/templates -o /path/to/output/templates.js
```

## Tests

Run `npm test` to run the tests (you'll need phantomjs installed). You can also run the tests in your browser with `npm run browser-test` and going to [http://localhost:3003](http://localhost:3003).

## Changelog

- v0.2.9 [diff](https://github.com/henrikjoreteg/templatizer/compare/v0.2.8...v0.2.9) - Adding path normalize to avoid issues if passing in paths like `/thing/../otherfolder`.

## License

MIT

## Contributors

- Aaron McCall [github profile](https://github.com/aaronmccall)
- Luke Karrys [github profile](https://github.com/lukekarrys)

If you think this is cool, you should follow me on twitter: [@HenrikJoreteg](http://twitter.com/henrikjoreteg)
