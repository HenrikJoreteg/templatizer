(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([{{amdModuleDependencies}}], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
{{checkParent}}
        root{{namespace}}.{{internalNamespace}} = factory();
    }
}(this, function ({{amdDependencies}}) {
    {{jade}} 

    var {{internalNamespace}} = {};
{{code}}
    return {{internalNamespace}};
}));
