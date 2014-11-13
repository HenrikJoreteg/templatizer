(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        if (typeof root{{namespace}} === 'undefined' || root{{namespace}} !== Object(root{{namespace}})) {
            root{{namespace}} = {};
        }
        root{{namespace}}.{{internalNamespace}} = factory();
    }
}(this, function () {
    {{jade}}

    var {{internalNamespace}} = {};
{{code}}
    return {{internalNamespace}};
}));
