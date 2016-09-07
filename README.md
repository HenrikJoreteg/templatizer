# templatizer.js

[![Build Status](https://travis-ci.org/HenrikJoreteg/templatizer.png?branch=master)](https://travis-ci.org/HenrikJoreteg/templatizer)

[![NPM](https://nodei.co/npm/templatizer.png?downloads=true)](https://nodei.co/npm/templatizer/)

Simple solution for compiling jade templates into vanilla JS functions for blazin' fast client-side use.

**If you're looking for something that works with [`pug`](https://pugjs.org/api/getting-started.html), check out [`puglatizer`](https://github.com/happilymarrieddad/puglatizer).**

**v2 has been released. See the [changelog](#changelog) for breaking changes.**

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

// pass in the template directory and what you want to save the output file as
templatizer(
  __dirname + '/templates',
  __dirname + '/output.js',
  options, // Optional
  function (err, templates) { console.log(err || 'Success!') }
);
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
var jade = require('jade-runtime') // This is a peerDependency

var templates = {};

// a function built from the `user.jade` file
// that takes your data and returns a string.
templates.user = function () {}

// built from the `app.jade` file
templates.app = function () {} // the function

// folders become nested objects so
// myfolder/nestedTemplate.jade becomes
templates.myFolder = {};
templates.myfolder.nestedTemplate = function () {} // the template function

module.exports = templates;
```

The awesome thing is... they're just functions at this point. Crazy fast, SO MUCH WIN!!!!

## Dependencies

`templatizer` has `jade-runtime` as a `peerDependency`. In npm 3.x.x peerDependencies will no longer be installed by default.

When this happens, you'll want to run the following `npm install jade-runtime` to install it yourself.

**Note: the currently published [`jade-runtime`](https://www.npmjs.com/package/jade-runtime) only works with the upcoming `jade@2.x.y` release. For now `templatizer` uses an npm publically scoped module that is a copy of the current runtime [`@lukekarrys/jade-runtime`](https://www.npmjs.com/package/@lukekarrys/jade-runtime). This will be changed once jade@2.x.y is released.**

## API

```js
templatizer(
  templatesDirectory,
  outputFile?,
  options?,
  function (err, templates) {}
)
```

### templatesDirectory (string or array, required)

A string or an array of paths to look for templates.

The path can also be a [glob](https://github.com/isaacs/node-glob) instead that can be used to match `*.jade` files across multiple directories. For example:

```js
templatizer(__dirname + '/app/**/*.jade', ...);
```

### outputFile (string)

Optionally build the compiled templates to a file. The output will be a CommonJS module. If you don't build to a file, you'll want to supply a callback to do something else with the compiled templates.

### Options (object)

##### `jade` (object, default `{}`)

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

##### `globOptions` (object, default `{}`)

`globOptions` will be passed directly to `node-glob`. See the [API docs](https://github.com/isaacs/node-glob#options) for available options.

##### `transformMixins` (boolean, default false)

Set this to `true` to turn on `mixin` AST transformations.

Jade has a feature called `mixins` which when compiled get treated as function declarations within the compiled function. Templatizer can pull these out of the compiled function and place them on the namespace of the parent function. For example:

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

### Callback (function)

If the last parameter is a function, it will be treated as a callback. The callback will always have the signature `function (err, templates) {}`. Use this to respond to errors or to do something else with the source of the compiled templates file.

This can be helpful if you don't want to write the compiled templates directly to a file, and you want to make modifications first. 

### Argument order

Both the `outputFile` string and `options` object are optional.

```js
// Use just the callback to do something else with your templates
// besides write them to a file
templatizer(templatesDir, function (err, templates) { });

// Build to a file and do something in the callback
templatizer(templatesDir, outputFile, function (err, templates) { });

// Use only with options
templatizer(templatesDir, { /* options */ }, function (err, templates) { });

// Use with options and outputFile
templatizer(templatesDir, outputFile, { /* options */ }, function (err, templates) { });
```

## Passing client side data to templates

Simply pass in data objects to make those variables available within the template:
```js
templatizer.Template({ title: ..., description: ...});
```

Using jade's [`&attributes(attributes)`](http://jade-lang.com/reference/attributes/#and-attributes) syntax:
```js
templatizer.Template.call({ attributes:{ class: ..., value: ...}} , data);
templatizer.Template.apply({ attributes:{ class: ..., value: ...}} , [data]);
```

## CLI

Templatizer comes with a bin script to use from makefiles/package.json scripts/etc, it works like this:

```
$ templatizer -d path/to/templates -o /path/to/output/templates.js
```

## Tests

Run `npm test` to run the tests (you'll need phantomjs installed). You can also run the tests in your browser with `npm start` and going to [http://localhost:3003](http://localhost:3003).

## Changelog

- 2.0.3
  - Return err from callback on jade compile errors ([#94](https://github.com/HenrikJoreteg/templatizer/pull/94) [@klausbayrhammer](https://github.com/klausbayrhammer))

- 2.0.2
  - Use publically scoped runtime from [`@lukekarrys/jade-runtime`](https://www.npmjs.com/package/@lukekarrys/jade-runtime)

- 2.0.0 Breaking Changes:
  - **Async API** Pass a callback as the last parameter with the signature `function (err, templates) {}` to know when compilation is complete.
  - **Compiled templates are no longer UMD.** The compiled templates are now only a CommonJS module. Global and AMD support have been removed. If you want to consume this file as an AMD module or global, you'll need to do that as part of a build step in your project. Try the [`require.js` conversion tool](http://requirejs.org/docs/commonjs.html#autoconversion) or [`amd-wrap`](https://www.npmjs.com/package/amd-wrap) for AMD compatibility or [creating a standalone build with `browserify`](http://www.forbeslindesay.co.uk/post/46324645400/standalone-browserify-builds) for global builds.
  - **`jade-runtime` is no longer inlined.** `jade-runtime` is now installed as a `peerDependency` and required from the compiled templates file.
  - **`namespace` options have been removed.** Since the compiled templates no longer have the option to attach to a global variable, the `namespace` options are no longer relevant.
  - **Mixin transformation is now off by default.** Mixin transformation can be turned back on by using the option `transformMixins: true`. Also, the dynamic mixin compiler is no automatically turned on if opting-in to mixin transformation.

## License

MIT

## Contributors

- Aaron McCall [github profile](https://github.com/aaronmccall)
- Luke Karrys [github profile](https://github.com/lukekarrys)

If you think this is cool, you should follow me on twitter: [@HenrikJoreteg](http://twitter.com/henrikjoreteg)
