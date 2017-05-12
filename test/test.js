var assert = require("power-assert");
var babel = require("babel-core");

var Data = require("../data");

var OPTIONS = {

    plugins: [
        [require("../src/index")(babel), {
            trackedFunctions: {
                moduleFn: {
                    module: "./service/moduleFn",
                    fn: "",
                    varArgs: true
                },
                nonVar: {
                    module: "./service/nonVarMod",
                    fn: ""
                },
                lookup: {
                    module: "./service/lookup",
                    fn: "thing",
                    varArgs: true
                },
                nvLookup: {
                    module: "./service/lookup",
                    fn: "nonvar"
                }
            },
            debug: false
        }]
    ],
    sourceRoot: "/test/"
};

describe("Track Usage Plugin", function ()
{
    it("detects module functions", function ()
    {
        Data.clear();
        var out = babel.transform("var moduleFn = require('./service/moduleFn'); var nonvar = require('./service/nonVarMod'); var a=123; var b=moduleFn('Foo'); var c = nonvar('A'); var d = nonvar('Ignored', 1); var e = moduleFn('NotIgnored', 2);", Object.assign({}, OPTIONS, {
            filename: "/test/module.js"
        }));

        var usages = Data.get().usages;
        //console.log(JSON.stringify(usages, null, 2));
        assert(usages['./module'].module === "module");
        assert(usages['./module'].requires[0] === "./service/moduleFn");
        assert(usages['./module'].requires[1] === "./service/nonVarMod");

        assert(usages['./module'].calls.moduleFn.length === 2);
        assert(usages['./module'].calls.moduleFn[0] === "Foo");
        assert(usages['./module'].calls.moduleFn[1] === "NotIgnored");

        assert(usages['./module'].calls.nonVar.length === 1);
        assert(usages['./module'].calls.nonVar[0] === "A");
    });

    it("detects member functions", function ()
    {
        Data.clear();
        var out = babel.transform("var lookup = require('./service/lookup'); var a=123; var b=lookup.thing('Bar'); var c = lookup.thing('Present', 3); var d = lookup.nonvar('A'); var e = lookup.nonvar('Ignored',4)", Object.assign({}, OPTIONS, {
            filename: "/test/module.js"
        }));

        var usages = Data.get().usages;
        //console.log(JSON.stringify(usages, null, 2));

        assert(usages['./module'].module === "module");
        assert(usages['./module'].requires[0] === "./service/lookup");
        assert(usages['./module'].calls.lookup.length === 2);
        assert(usages['./module'].calls.lookup[0] === "Bar");
        assert(usages['./module'].calls.lookup[1] === "Present");

        assert(usages['./module'].calls.nvLookup.length === 1);
        assert(usages['./module'].calls.nvLookup[0] === "A");
    })

});
