require([ "amdtemplates", "module1" ], function(templates, module1) {
	var result = templates["amdtemplate"]();
	test("require additional amd dependency", function() {
		ok(result.contains(module1.value))
	});
})
