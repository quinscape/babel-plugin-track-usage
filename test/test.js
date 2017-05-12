var assert = require("power-assert");
var babel = require("babel-core");
var fs = require("fs");
var path = require("path");

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

function transform(relPath)
{
    return babel.transform(fs.readFileSync(path.join(__dirname, relPath)), Object.assign({}, OPTIONS, {
        filename: "/test/module.js"
    }));

}

describe("Track Usage Plugin", function ()
{
    describe("ES5 require", function ()
    {
        it("detects module functions", function ()
        {
            Data.clear();
            transform("./test-modules/mod-fn-es5.js");

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
            transform("./test-modules/member-fn-es5.js");

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

    describe("ES6 modules", function ()
    {
        it("detects module functions", function ()
        {
            Data.clear();
            transform("./test-modules/mod-fn-es6.js");

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
            transform("./test-modules/member-fn-es6.js");

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

        it("detects member functions with variable binding", function ()
        {
            Data.clear();
            transform("./test-modules/member-fn-es6-2.js");

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

        it("detects member functions with aliased binding", function ()
        {
            Data.clear();
            transform("./test-modules/member-fn-es6-alias.js");

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
});
