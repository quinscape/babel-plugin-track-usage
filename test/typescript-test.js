const assert = require("power-assert")
const Data = require("../data")
const transform = require("./transform")

describe("Track Usage Plugin (Typescript)", function ()
{
    // reset collected data before each test
    beforeEach(function(){ Data.clear() });

    it("detects module functions", function ()
    {

        transform("./test-modules/typescript/mod-fn.ts", true);

        const usages = Data.get().usages
        //console.log(JSON.stringify(usages, null, 2));
        assert(usages['./typescript/mod-fn'].requires[0] === "./typescript/service/moduleFn");
        assert(usages['./typescript/mod-fn'].requires[1] === "./typescript/service/nonVarMod");

        assert.deepEqual(
            usages['./typescript/mod-fn'].calls.moduleFn,
            [
                ["Foo"],
                ["NotIgnored"]
            ]
        );
        assert.deepEqual(
            usages['./typescript/mod-fn'].calls.nonVar,
            [
                ["A"],
                ["A", "B"]
            ]
        );

    });

    it("detects member functions", function ()
    {

        transform("./test-modules/typescript/member-fn.ts", true);

        const usages = Data.get().usages
        //console.log(JSON.stringify(usages, null, 2));

        assert(usages['./typescript/member-fn'].requires[0] === "./typescript/service/lookup");
        assert.deepEqual(
            usages['./typescript/member-fn'].calls.lookup,
            [
                ["Bar"],
                ["Present"]
            ]
        );

        assert.deepEqual(
            usages['./typescript/member-fn'].calls.nvLookup,
            [
                ["A"]
            ]
        );
    })

    it("detects member functions as named imports", function ()
    {
        transform("./test-modules/typescript/member-fn-2.ts", true);

        const usages = Data.get().usages
        //console.log(JSON.stringify(usages, null, 2));

        assert(usages['./typescript/member-fn-2'].requires[0] === "./typescript/service/lookup");
        assert.deepEqual(
            usages['./typescript/member-fn-2'].calls.lookup,
            [
                ["Bar"],
                ["Present"]
            ]
        );
        assert.deepEqual(
            usages['./typescript/member-fn-2'].calls.nvLookup,
            [
                ["A"]
            ]
        );
    })

    it("detects member functions with aliased import", function ()
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

        transform("./test-modules/typescript/multi.ts", true);

        const usages = Data.get().usages

        //console.log(JSON.stringify(usages, null, 2));
        assert.deepEqual(usages['./typescript/multi'].calls.multiArg, [
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

        assert.deepEqual(usages['./typescript/multi'].calls.multiVarArg, [
            [
                "Qux",
                "Quux"
            ]
            // no entry for "const g = multiVar('Ignored',  'Not Literal' + 5);"
        ]);
    })

    it("detects supports identifiers", function ()
    {

        transform("./test-modules/typescript/multi.ts", true);

        const usages = Data.get().usages

        //console.log(JSON.stringify(usages, null, 2));

        assert.deepEqual(usages['./typescript/multi'].calls.multiVarArgIdent, [
            [
                { __identifier: "MyIdent" }, { value: "abc"}
            ]
        ]);
    })


    it("supports template literals", function ()
    {
        transform("./test-modules/typescript/member-fn-template.ts", true);

        const usages = Data.get().usages
        //console.log(JSON.stringify(usages, null, 2));

        assert(usages['./typescript/member-fn-template'].requires[0] === "./typescript/service/lookup");

        assert.deepEqual(
            usages['./typescript/member-fn-template'].calls.lookup,
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
            function() { transform("./test-modules/typescript/member-fn-template2.ts", true) },
            /Extracted template literals can't contain expressions/
        );
    })


    it("does detect constructor calls", function ()
    {
        transform("./test-modules/typescript/ctor.ts", true);

        const usages = Data.get().usages
        //console.log(JSON.stringify(usages, null, 2));

        assert.deepEqual(usages['./typescript/ctor'].calls.ctor, [
            [
                "CTOR NAME",
            ]
        ]);

    })


});
