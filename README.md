# templatizer.js

[![Build Status](https://travis-ci.org/HenrikJoreteg/templatizer.png?branch=master)](https://travis-ci.org/HenrikJoreteg/templatizer)

[![NPM](https://nodei.co/npm/templatizer.png?downloads=true)](https://nodei.co/npm/templatizer/)

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

### Glob Paths

The directory path can also be a [glob](https://github.com/isaacs/node-glob) instead that can be used to match `*.jade` files across multiple directories. For example:

```js
templatizer(__dirname + '/app/**/*.jade', __dirname + '/templates.js');
```

### Options

The third parameter passed to `templatizer` is an options object.

#### `namespace` (object, optional)

If you are using templatizer as a global in the browser (without requirejs, browserify, or something similar) by default your templates will be available at `window.templatizer`. Using `namespace` you can attach it to a different global object or rename the property it attaches to.

#### `namespace.parent` (string, default `window`)

This is the name of the object where you want to attach your templates.

#### `namespace.defineParent` (boolean, default `false`)

If this option is `true` and `namespace.parent` does not exist, it will be created. By default if `namespace.parent` does not exist, templatizer will throw an error like this: `templatizer: window.app does not exist or is not an object`.

#### `namespace.name` (string, default `templatizer`)

This is the name of the property on `namespace.parent` where your templates will be attached.

#### Shorthand

If all you want is to attach the `templatizer` object to an already created global variable, then you can just make `namespace` the name of the object where it will attach:


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

#### `dontRemoveMixins` (boolean, default false)

By default `jade` will not compile any mixins which aren't being called from the file they were created in. This is usually a very good thing, since keeps file sizes down. But in some cases (especially when using the [mixin support](#mixin-support) functionality), you may want to create mixins and call them from other places in your code or other files. Setting this option to `true` will keep all mixins in the compiled source.

#### `inlineJadeRuntime` (boolean, default true)

By default the jade runtime will be included into the generated template javascript file. In order minimize the file size you can set this parameter to false. Instead a `jade` module is expected as amdDependency parameter. Otherwise an error will be thrown.

#### `amdDependencies` (array, default [])

An array of AMD module dependencies you want to pass in to the generated templates javascript file. 

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

#### `globOptions` (object, default `{}`)

`globOptions` will be passed directly to `node-glob`. See the [API docs](https://github.com/isaacs/node-glob#options) for available options.

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
