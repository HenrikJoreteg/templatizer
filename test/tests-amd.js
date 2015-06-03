/* globals test, ok */


require([ "builtTemplates/amdtemplates.js", "module1" ], function(templates, module1) {
    var result = templates.amdtemplate();
    test("require additional amd dependency", function() {
        ok(result.indexOf(module1.value) > -1);
    });
});
