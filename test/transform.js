const babel = require("@babel/core")
const fs = require("fs")
const path = require("path")



function transform(relPath, typeScript = false, indexes = false)
{

    const servicePath = typeScript ? "./typescript/service/" : "./service/"

    const opts = {

        plugins: [
            [
                require("../src/index")(babel), {
                trackedFunctions: {
                    moduleFn: {
                        module: servicePath + "moduleFn",
                        fn: "",
                        varArgs: true
                    },
                    nonVar: {
                        module: servicePath + "nonVarMod",
                        fn: ""
                    },
                    lookup: {
                        module: servicePath + "lookup",
                        fn: "thing",
                        varArgs: true
                    },
                    nvLookup: {
                        module: servicePath + "lookup",
                        fn: "nonvar"
                    },
                    multiArg: {
                        module: servicePath + "multi",
                        fn: ""
                    },
                    multiVarArg: {
                        module: servicePath + "multi",
                        fn: "multiVar",
                        varArgs: 2
                    },
                    multiVarArgIdent: {
                        module: servicePath + "multi",
                        fn: "multiIdent",
                        varArgs: 2,
                        allowIdentifier: true
                    },
                    ctor: {
                        module: servicePath + "ctor",
                        fn: "MyConstructor"
                    },
                    contextTarget: {
                        module: servicePath + "contextTarget",
                        fn: "contextTarget",
                        captureContext: "parent.id.name"
                    },
                    arrayContextTarget: {
                        module: servicePath + "contextTarget",
                        fn: "arrayContextTarget",
                        captureContext: ["parent.id.name", "parent.left.name"]
                    },
                    objectContextTarget: {
                        module: servicePath + "contextTarget",
                        fn: "objectContextTarget",
                        captureContext: {
                            type: "parent.type",
                            name: "parent.parent.id.name"
                        }
                    }
                },
                indexes,
                debug: false,
                sourceRoot: "test-modules/"
            }
            ]
        ]
    }

    if (typeScript)
    {
        opts.presets = ["@babel/preset-typescript"];
    }


    return babel.transform(fs.readFileSync(path.join(__dirname, relPath)), Object.assign({}, opts, {
        filename: relPath
    }));

}

module.exports = transform
