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
                },
                multiArg: {
                    module: "./service/multi",
                    fn: ""
                },
                multiVarArg: {
                    module: "./service/multi",
                    fn: "multiVar",
                    varArgs: 2
                },
                multiVarArg2: {
                    module: "./service/multi2",
                    fn: "multiVar2",
                    varArgs: 2
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
    // reset collected data before each test
    beforeEach(function(){ Data.clear() });

    describe("ES5 require", function ()
    {
        it("detects module functions", function ()
        {

            transform("./test-modules/mod-fn-es5.js");

            var usages = Data.get().usages;
            //console.log(JSON.stringify(usages, null, 2));
            assert(usages['./mod-fn-es5'].module === "mod-fn-es5");
            assert(usages['./mod-fn-es5'].requires[0] === "./service/moduleFn");
            assert(usages['./mod-fn-es5'].requires[1] === "./service/nonVarMod");

            assert(usages['./mod-fn-es5'].calls.moduleFn.length === 2);
            assert(usages['./mod-fn-es5'].calls.moduleFn[0][0] === "Foo");
            assert(usages['./mod-fn-es5'].calls.moduleFn[1][0] === "NotIgnored");

            assert(usages['./mod-fn-es5'].calls.nonVar.length === 1);
            assert(usages['./mod-fn-es5'].calls.nonVar[0][0] === "A");
        });

        it("detects member functions", function ()
        {

            transform("./test-modules/member-fn-es5.js");

            var usages = Data.get().usages;
            //console.log(JSON.stringify(usages, null, 2));

            assert(usages['./member-fn-es5'].module === "member-fn-es5");
            assert(usages['./member-fn-es5'].requires[0] === "./service/lookup");
            assert(usages['./member-fn-es5'].calls.lookup.length === 2);
            assert(usages['./member-fn-es5'].calls.lookup[0][0] === "Bar");
            assert(usages['./member-fn-es5'].calls.lookup[1][0] === "Present");

            assert(usages['./member-fn-es5'].calls.nvLookup.length === 1);
            assert(usages['./member-fn-es5'].calls.nvLookup[0][0] === "A");
        })

    });

    describe("ES6 modules", function ()
    {
        it("detects module functions", function ()
        {

            transform("./test-modules/mod-fn-es6.js");

            var usages = Data.get().usages;
            //console.log(JSON.stringify(usages, null, 2));
            assert(usages['./mod-fn-es6'].module === "mod-fn-es6");
            assert(usages['./mod-fn-es6'].requires[0] === "./service/moduleFn");
            assert(usages['./mod-fn-es6'].requires[1] === "./service/nonVarMod");

            assert(usages['./mod-fn-es6'].calls.moduleFn.length === 2);
            assert(usages['./mod-fn-es6'].calls.moduleFn[0][0] === "Foo");
            assert(usages['./mod-fn-es6'].calls.moduleFn[1][0] === "NotIgnored");

            assert(usages['./mod-fn-es6'].calls.nonVar.length === 1);
            assert(usages['./mod-fn-es6'].calls.nonVar[0][0] === "A");
        });

        it("detects member functions", function ()
        {

            transform("./test-modules/member-fn-es6.js");

            var usages = Data.get().usages;
            //console.log(JSON.stringify(usages, null, 2));

            assert(usages['./member-fn-es6'].module === "member-fn-es6");
            assert(usages['./member-fn-es6'].requires[0] === "./service/lookup");
            assert(usages['./member-fn-es6'].calls.lookup.length === 2);
            assert(usages['./member-fn-es6'].calls.lookup[0][0] === "Bar");
            assert(usages['./member-fn-es6'].calls.lookup[1][0] === "Present");

            assert(usages['./member-fn-es6'].calls.nvLookup.length === 1);
            assert(usages['./member-fn-es6'].calls.nvLookup[0][0] === "A");
        })

        it("detects member functions with variable binding", function ()
        {

            transform("./test-modules/member-fn-es6-2.js");

            var usages = Data.get().usages;
            //console.log(JSON.stringify(usages, null, 2));

            assert(usages['./member-fn-es6-2'].module === "member-fn-es6-2");
            assert(usages['./member-fn-es6-2'].requires[0] === "./service/lookup");
            assert(usages['./member-fn-es6-2'].calls.lookup.length === 2);
            assert(usages['./member-fn-es6-2'].calls.lookup[0][0] === "Bar");
            assert(usages['./member-fn-es6-2'].calls.lookup[1][0] === "Present");

            assert(usages['./member-fn-es6-2'].calls.nvLookup.length === 1);
            assert(usages['./member-fn-es6-2'].calls.nvLookup[0][0] === "A");
        })

        it("detects member functions with aliased binding", function ()
        {

            transform("./test-modules/member-fn-es6-alias.js");

            var usages = Data.get().usages;
            //console.log(JSON.stringify(usages, null, 2));

            assert(usages['./member-fn-es6-alias'].module === "member-fn-es6-alias");
            assert(usages['./member-fn-es6-alias'].requires[0] === "./service/lookup");
            assert(usages['./member-fn-es6-alias'].calls.lookup.length === 2);
            assert(usages['./member-fn-es6-alias'].calls.lookup[0][0] === "Bar");
            assert(usages['./member-fn-es6-alias'].calls.lookup[1][0] === "Present");

            assert(usages['./member-fn-es6-alias'].calls.nvLookup.length === 1);
            assert(usages['./member-fn-es6-alias'].calls.nvLookup[0][0] === "A");
        })

        it("detects multiple arguments", function ()
        {

            transform("./test-modules/multi.js");


            var usages = Data.get().usages;

            assert.deepEqual(usages['./multi'].calls.multiArg, [
                [
                    "Foo",
                    1
                ],
                [
                    "Bar",
                    "xxx",
                    2
                ],
                [
                    "Baz",
                    {
                        baz: 3,
                        "name": "Bazi",
                        obj: {
                            complex: true
                        }
                    }
                ]
            ]);

            assert.deepEqual(usages['./multi'].calls.multiVarArg, [
                [
                    "Qux",
                    "Quux"
                ]
            ]);

            assert.deepEqual(usages['./multi'].calls.multiVarArg2, [
                [
                    "Bla",
                    "Fasel"
                ]
            ]);


            //console.log(JSON.stringify(usages, null, 2));

        })

    });

    it("supports sub directories", function ()
    {

        transform("./test-modules/sub/mod-fn-es6.js");

        var usages = Data.get().usages;
        //console.log(JSON.stringify(usages, null, 2));
        assert(usages['./sub/mod-fn-es6'].module === "sub/mod-fn-es6");
        assert(usages['./sub/mod-fn-es6'].requires[0] === "./service/moduleFn");
        assert(usages['./sub/mod-fn-es6'].requires[1] === "./service/nonVarMod");

        assert(usages['./sub/mod-fn-es6'].calls.moduleFn.length === 2);
        assert(usages['./sub/mod-fn-es6'].calls.moduleFn[0][0] === "Foo");
        assert(usages['./sub/mod-fn-es6'].calls.moduleFn[1][0] === "NotIgnored");

        assert(usages['./sub/mod-fn-es6'].calls.nonVar.length === 1);
        assert(usages['./sub/mod-fn-es6'].calls.nonVar[0][0] === "A");
    });

    it("supports template literals", function ()
    {
        transform("./test-modules/member-fn-es6-template.js");

        var usages = Data.get().usages;
        console.log(JSON.stringify(usages, null, 2));

        assert(usages['./member-fn-es6-template'].module === "member-fn-es6-template");
        assert(usages['./member-fn-es6-template'].requires[0] === "./service/lookup");
        assert(usages['./member-fn-es6-template'].calls.lookup.length === 1);

        //console.log(JSON.stringify(usages['./member-fn-es6-template'].calls.lookup[0]));
        assert(usages['./member-fn-es6-template'].calls.lookup[0][0] === "\n    Bar\n");
    })

    it("does not support template literals with expressions", function ()
    {
        assert.throws(
            function() { transform("./test-modules/member-fn-es6-template2.js") },
            /Extracted template literals can't contain expressions/
        );
    })

});
