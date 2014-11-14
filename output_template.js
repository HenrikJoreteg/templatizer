(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
{{checkParent}}
        root{{namespace}}.{{internalNamespace}} = factory();
    }
}(this, function () {
    {{jade}}

    var {{internalNamespace}} = {};
{{code}}
    return {{internalNamespace}};
}));
