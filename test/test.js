const assert = require("power-assert")
const Data = require("../data")
const transform = require("./transform");

describe("Track Usage Plugin", function ()
{
    // reset collected data before each test
    beforeEach(function(){ Data.clear() });

    describe("ES5 require", function ()
    {
        it("detects module functions", function ()
        {

            transform("./test-modules/mod-fn-es5.js");

            const usages = Data.get().usages
            //console.log(JSON.stringify(usages, null, 2));
            assert(usages['./mod-fn-es5'].requires[0] === "./service/moduleFn");
            assert(usages['./mod-fn-es5'].requires[1] === "./service/nonVarMod");

            assert.deepEqual(
                usages['./mod-fn-es5'].calls.moduleFn,
                [
                    ["Foo"],
                    ["NotIgnored"]
                ]
            );
            assert.deepEqual(
                usages['./mod-fn-es5'].calls.nonVar,
                [
                    ["A"]
                ]
            );

        });

        it("detects member functions", function ()
        {

            transform("./test-modules/member-fn-es5.js");

            const usages = Data.get().usages
            //console.log(JSON.stringify(usages, null, 2));

            assert(usages['./member-fn-es5'].requires[0] === "./service/lookup");
            assert.deepEqual(
                usages['./member-fn-es5'].calls.lookup,
                [
                    ["Bar"],
                    ["Present"]
                ]
            );

            assert.deepEqual(
                usages['./member-fn-es5'].calls.nvLookup,
                [
                    ["A"]
                ]
            );
        })

    });

    describe("ES6 modules", function ()
    {
        it("detects module functions", function ()
        {

            transform("./test-modules/mod-fn-es6.js");

            const usages = Data.get().usages
            //console.log(JSON.stringify(usages, null, 2));
            assert(usages['./mod-fn-es6'].requires[0] === "./service/moduleFn");
            assert(usages['./mod-fn-es6'].requires[1] === "./service/nonVarMod");

            assert.deepEqual(
                usages['./mod-fn-es6'].calls.moduleFn,
                [
                    ["Foo"],
                    ["NotIgnored"]
                ]
            );
            assert.deepEqual(
                usages['./mod-fn-es6'].calls.nonVar,
                [
                    ["A"],
                    ["A","B"],
                ]
            );
        });

        it("detects member functions", function ()
        {

            transform("./test-modules/member-fn-es6.js");

            const usages = Data.get().usages
            //console.log(JSON.stringify(usages, null, 2));

            assert(usages['./member-fn-es6'].requires[0] === "./service/lookup");

            assert.deepEqual(
                usages['./member-fn-es6'].calls.lookup,
                [
                    ["Bar"],
                    ["Present"]
                ]
            );

            assert.deepEqual(
                usages['./member-fn-es6'].calls.nvLookup,
                [
                    ["A"]
                ]
            );
        });

        it("detects member functions with variable binding", function ()
        {

            transform("./test-modules/member-fn-es6-2.js");

            const usages = Data.get().usages
            //console.log(JSON.stringify(usages, null, 2));

            assert(usages['./member-fn-es6-2'].requires[0] === "./service/lookup");
            assert.deepEqual(
                usages['./member-fn-es6-2'].calls.lookup,
                [
                    ["Bar"],
                    ["Present"]
                ]
            );
            assert.deepEqual(
                usages['./member-fn-es6-2'].calls.nvLookup,
                [
                    ["A"]
                ]
            );
        });

        it("detects member functions with aliased binding", function ()
        {

            transform("./test-modules/member-fn-es6-alias.js");

            const usages = Data.get().usages
            //console.log(JSON.stringify(usages, null, 2));

            assert(usages['./member-fn-es6-alias'].requires[0] === "./service/lookup");
            assert.deepEqual(
                usages['./member-fn-es6-alias'].calls.lookup,
                [
                    ["Bar"],
                    ["Present"]
                ]
            );
            assert.deepEqual(
                usages['./member-fn-es6-alias'].calls.nvLookup,
                [
                    ["A"]
                ]
            );
        })

        it("detects multiple arguments", function ()
        {

            transform("./test-modules/multi.js");

            const usages = Data.get().usages
            //console.log(JSON.stringify(usages, null, 2));

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
                ],
                [],
                [
                    "Blubb",
                    {
                        values: [
                            "A",
                            "B",
                            "C"
                        ]
                    }
                ],
                [
                    'JustArray', ["1", "2", "3"]
                ],
                [
                    'Blafusel', { value: null}
                ]

            ]);

            assert.deepEqual(usages['./multi'].calls.multiVarArg, [
                [
                    "Qux",
                    "Quux"
                ]
                // no entry for "const g = multiVar('Ignored',  'Not Literal' + 5);"
            ]);

        })

        it("supports identifiers", function ()
        {

            transform("./test-modules/multi.js");

            const usages = Data.get().usages
            //console.log(JSON.stringify(usages, null, 2));
            assert.deepEqual(usages['./multi'].calls.multiVarArgIdent, [
                [
                    { __identifier: "MyIdent" }, { value: "abc"}
                ]
            ]);
        })

    });

    it("supports sub directories", function ()
    {

        transform("./test-modules/sub/mod-fn-es6.js");

        const usages = Data.get().usages
        //console.log(JSON.stringify(usages, null, 2));
        assert(usages['./sub/mod-fn-es6'].requires[0] === "./service/moduleFn");
        assert(usages['./sub/mod-fn-es6'].requires[1] === "./service/nonVarMod");

        assert.deepEqual(
            usages['./sub/mod-fn-es6'].calls.moduleFn,
            [
                ["Foo"],
                ["NotIgnored"]
            ]
        );

        assert.deepEqual(
            usages['./sub/mod-fn-es6'].calls.nonVar,
            [
                ["A"]
            ]
        );
    });

    it("supports template literals", function ()
    {
        transform("./test-modules/member-fn-es6-template.js");

        const usages = Data.get().usages
        //console.log(JSON.stringify(usages, null, 2));

        assert(usages['./member-fn-es6-template'].requires[0] === "./service/lookup");

        assert.deepEqual(
            usages['./member-fn-es6-template'].calls.lookup,
            [
                [
                    "\n    Bar\n"
                ]
            ]
        );
    });

    it("does not support template literals with expressions", function ()
    {
        assert.throws(
            function() { transform("./test-modules/member-fn-es6-template2.js") },
            /Extracted template literals can't contain expressions/
        );
    })

});
