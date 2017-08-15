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
    sourceRoot: "./test-modules/"
};

function transform(relPath)
{
    return babel.transform(fs.readFileSync(path.join(__dirname, relPath)), Object.assign({}, OPTIONS, {
        filename: relPath
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
            assert(usages['./mod-fn-es5'].module === "mod-fn-es5");
            assert(usages['./mod-fn-es5'].requires[0] === "./service/moduleFn");
            assert(usages['./mod-fn-es5'].requires[1] === "./service/nonVarMod");

            assert(usages['./mod-fn-es5'].calls.moduleFn.length === 2);
            assert(usages['./mod-fn-es5'].calls.moduleFn[0] === "Foo");
            assert(usages['./mod-fn-es5'].calls.moduleFn[1] === "NotIgnored");

            assert(usages['./mod-fn-es5'].calls.nonVar.length === 1);
            assert(usages['./mod-fn-es5'].calls.nonVar[0] === "A");
        });

        it("detects member functions", function ()
        {
            Data.clear();
            transform("./test-modules/member-fn-es5.js");

            var usages = Data.get().usages;
            //console.log(JSON.stringify(usages, null, 2));

            assert(usages['./member-fn-es5'].module === "member-fn-es5");
            assert(usages['./member-fn-es5'].requires[0] === "./service/lookup");
            assert(usages['./member-fn-es5'].calls.lookup.length === 2);
            assert(usages['./member-fn-es5'].calls.lookup[0] === "Bar");
            assert(usages['./member-fn-es5'].calls.lookup[1] === "Present");

            assert(usages['./member-fn-es5'].calls.nvLookup.length === 1);
            assert(usages['./member-fn-es5'].calls.nvLookup[0] === "A");
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
            assert(usages['./mod-fn-es6'].module === "mod-fn-es6");
            assert(usages['./mod-fn-es6'].requires[0] === "./service/moduleFn");
            assert(usages['./mod-fn-es6'].requires[1] === "./service/nonVarMod");

            assert(usages['./mod-fn-es6'].calls.moduleFn.length === 2);
            assert(usages['./mod-fn-es6'].calls.moduleFn[0] === "Foo");
            assert(usages['./mod-fn-es6'].calls.moduleFn[1] === "NotIgnored");

            assert(usages['./mod-fn-es6'].calls.nonVar.length === 1);
            assert(usages['./mod-fn-es6'].calls.nonVar[0] === "A");
        });

        it("detects member functions", function ()
        {
            Data.clear();
            transform("./test-modules/member-fn-es6.js");

            var usages = Data.get().usages;
            //console.log(JSON.stringify(usages, null, 2));

            assert(usages['./member-fn-es6'].module === "member-fn-es6");
            assert(usages['./member-fn-es6'].requires[0] === "./service/lookup");
            assert(usages['./member-fn-es6'].calls.lookup.length === 2);
            assert(usages['./member-fn-es6'].calls.lookup[0] === "Bar");
            assert(usages['./member-fn-es6'].calls.lookup[1] === "Present");

            assert(usages['./member-fn-es6'].calls.nvLookup.length === 1);
            assert(usages['./member-fn-es6'].calls.nvLookup[0] === "A");
        })

        it("detects member functions with variable binding", function ()
        {
            Data.clear();
            transform("./test-modules/member-fn-es6-2.js");

            var usages = Data.get().usages;
            //console.log(JSON.stringify(usages, null, 2));

            assert(usages['./member-fn-es6-2'].module === "member-fn-es6-2");
            assert(usages['./member-fn-es6-2'].requires[0] === "./service/lookup");
            assert(usages['./member-fn-es6-2'].calls.lookup.length === 2);
            assert(usages['./member-fn-es6-2'].calls.lookup[0] === "Bar");
            assert(usages['./member-fn-es6-2'].calls.lookup[1] === "Present");

            assert(usages['./member-fn-es6-2'].calls.nvLookup.length === 1);
            assert(usages['./member-fn-es6-2'].calls.nvLookup[0] === "A");
        })

        it("detects member functions with aliased binding", function ()
        {
            Data.clear();
            transform("./test-modules/member-fn-es6-alias.js");

            var usages = Data.get().usages;
            //console.log(JSON.stringify(usages, null, 2));

            assert(usages['./member-fn-es6-alias'].module === "member-fn-es6-alias");
            assert(usages['./member-fn-es6-alias'].requires[0] === "./service/lookup");
            assert(usages['./member-fn-es6-alias'].calls.lookup.length === 2);
            assert(usages['./member-fn-es6-alias'].calls.lookup[0] === "Bar");
            assert(usages['./member-fn-es6-alias'].calls.lookup[1] === "Present");

            assert(usages['./member-fn-es6-alias'].calls.nvLookup.length === 1);
            assert(usages['./member-fn-es6-alias'].calls.nvLookup[0] === "A");
        })

    });

    it("supports sub directories", function ()
    {
        Data.clear();
        transform("./test-modules/sub/mod-fn-es6.js");

        var usages = Data.get().usages;
        //console.log(JSON.stringify(usages, null, 2));
        assert(usages['./sub/mod-fn-es6'].module === "sub/mod-fn-es6");
        assert(usages['./sub/mod-fn-es6'].requires[0] === "./service/moduleFn");
        assert(usages['./sub/mod-fn-es6'].requires[1] === "./service/nonVarMod");

        assert(usages['./sub/mod-fn-es6'].calls.moduleFn.length === 2);
        assert(usages['./sub/mod-fn-es6'].calls.moduleFn[0] === "Foo");
        assert(usages['./sub/mod-fn-es6'].calls.moduleFn[1] === "NotIgnored");

        assert(usages['./sub/mod-fn-es6'].calls.nonVar.length === 1);
        assert(usages['./sub/mod-fn-es6'].calls.nonVar[0] === "A");
    });

});
