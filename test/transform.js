const babel = require("@babel/core")
const fs = require("fs")
const path = require("path")

const OPTIONS = {

    plugins: [
        [
            require("../src/index")(babel), {
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
                multiVarArgIdent: {
                    module: "./service/multi",
                    fn: "multiIdent",
                    varArgs: 2,
                    allowIdentifier: true
                }
            },
            debug: false,
            sourceRoot: "test-modules/"
        }
        ]
    ]
}


function transform(relPath)
{
    return babel.transform(fs.readFileSync(path.join(__dirname, relPath)), Object.assign({}, OPTIONS, {
        filename: relPath
    }));

}

module.exports = transform
