/* globals test, ok, window */
/* jshint unused:false */

var dontRemoveMixins = {};
var unaltered = {};
var multipleDirs = {};
var glob = {};
var app = { nested: {}, isBoolean: true };

var globalError1 = 'templatizer: window["app"]["isBoolean"] does not exist or is not an object';
var globalError2 = 'templatizer: window["app"]["nonExistant"] does not exist or is not an object';
var globalErrorCount = 0;
var qUnitGlobalError = window.onerror;

window.onerror = function (errorMsg, url, lineNumber, columnNumber, err) {
    globalErrorCount++;

    var isExpected = (err.message === globalError1 || err.message === globalError2);

    test('global error ' + globalErrorCount, function () {
        ok(isExpected);
    });

    // If we expect the error ignore it (by returning true)
    // Otherwise pass it to qunits global handler
    return isExpected || qUnitGlobalError.apply(window, arguments);
};