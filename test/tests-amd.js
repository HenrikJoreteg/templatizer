require([ "builtTemplates/amdtemplates", "module1" ], function(templates, module1) {
    debugger;
	var result = templates["amdtemplate"]();
	test("require additional amd dependency", function() {
		ok(result.contains(module1.value))
	});
})
