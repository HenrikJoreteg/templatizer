(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([{{amdModuleDependencies}}], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof root{{namespace}} === 'undefined' || root{{namespace}} !== Object(root{{namespace}})) {
        throw new Error('{{internalNamespace}}: window{{namespace}} does not exist or is not an object');
    } else {
        root{{namespace}}.{{internalNamespace}} = factory();
    }
}(this, function ({{amdDependencies}}) {
    {{jade}} 

    var {{internalNamespace}} = {};
{{code}}
    return {{internalNamespace}};
}));