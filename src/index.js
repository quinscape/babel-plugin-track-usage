const nodeJsPath = require("path")
const fs = require("fs")
//var dump = require("./dump");
const deepEqual = require("deep-equal")

const Data = require("../data")

const SLASH_RE = new RegExp("\\" + nodeJsPath.sep, "g")

const FAILED = "__FAILED__";

function strip(path, sourceRoot)
{
    if (nodeJsPath.sep !== "/")
    {
        path = path.replace( SLASH_RE, "/")
    }

    //console.log("STRIP", path, sourceRoot);

    if (sourceRoot)
    {
        if (path.indexOf(sourceRoot) !== 0)
        {
            return null;
        }

        return path.substring(sourceRoot.length);
    }
    return path;
}


function evalRule(path, parts)
{
    let current = path;
    let isPath = true;
    let last = parts.length - 1;
    for (let i = 0; i <= last; i++)
    {
        const part = parts[i]
        if (isPath && part === "parent")
        {
            current = current.parentPath
        }
        else
        {
            if (isPath)
            {
                current = current.node[part];
            }
            else
            {
                current = current[part];
            }

            if ( i < last && (!current || typeof current !== "object") )
            {
                return FAILED;
            }
            isPath = false;
        }
    }

    return isPath ? current.node : current
}

const preparedContextSym = Symbol("PreparedContext");

function prepareContext(tf, rules)
{

    const existing = tf[preparedContextSym];
    if (existing)
    {
        //console.log("REUSE", rules)
        return existing
    }
    //console.log("PREPARE", rules)

    let preparedRules, isArray = false;
    if (typeof rules === "string")
    {
        preparedRules = rules.split(".")
    }
    else if (Array.isArray(rules))
    {
        isArray = true;
        let arrayRules = []
        for (let i = 0; i < rules.length; i++)
        {
            const rule = rules[i]

            if (typeof rule !== "string")
            {
                throw new Error("Invalid context rule: " + rule)
            }

            arrayRules.push(rule.split("."))
        }

        preparedRules = arrayRules
    }
    else if (rules && typeof rules === "object")
    {
        let objectRules = {}
        for (let key in rules)
        {
            if (rules.hasOwnProperty(key))
            {
                let rule = rules[key]

                if (typeof rule !== "string")
                {
                    throw new Error("Invalid context rule: " + rule)
                }

                objectRules[key] = rule.split(".")
            }
        }
        
        preparedRules = objectRules
    }
    else
    {
        throw new Error("Invalid context rule: " + rules)
    }

    const result = [preparedRules, isArray]
    tf[preparedContextSym] =  result;
    return result;
}


function captureContext(path, tf)
{
    const [rules, wasArray] = prepareContext(tf, tf.captureContext)

    if (Array.isArray(rules))
    {
        if (!wasArray)
        {
            return evalRule(path, rules)
        }
        else
        {
            let context = []
            for (let i = 0; i < rules.length; i++)
            {
                context.push(evalRule(path,rules[i]))
            }
            return context
        }
    }
    else if (rules && typeof rules === "object")
    {
        let context = {}
        for (let key in rules)
        {
            if (rules.hasOwnProperty(key))
            {
                context[key] = evalRule(path, rules[key])
            }
        }
        return context
    }
}


module.exports = function (t) {

    t = t.types;

    function insert(set, indexes, value, loc, contexts, ctx)
    {
        for (let i = 0; i < set.length; i++)
        {
            const v = set[i]
            if (deepEqual(v, value))
            {
                return;
            }
        }

        set.push(value);
        if (indexes)
        {
            indexes.push(loc)
        }
        if (contexts)
        {
            contexts.push(ctx)
        }
    }

    function recordCall(data, path, pluginOpts, memberCall, importedFnCall)
    {
        const node = path.node
        let record, indexRecord, contextRecord
        const callee = node.callee

        const array = memberCall ?
            data._config.trackedByVar[callee.object.name] :
            data._config.trackedByVar[callee.name]
        for (let i = 0; i < array.length; i++)
        {
            const e = array[i]
            const tf = data._config.trackedFunctions[e.name]

            if ((memberCall && tf.fn) || (!memberCall && !tf.fn) || (!memberCall && importedFnCall && tf.fn))
            {
                if (data._config.debug)
                {
                    console.log("Tracking ", node)
                }

                if (!tf.fn || importedFnCall || e.expr(callee))
                {
                    const args = node.arguments
                    const varArgs = tf.varArgs

                    const argsEnd = Math.min(
                        args.length,
                        varArgs ? (
                            typeof varArgs === "number" && varArgs > 0 ? varArgs : 1
                        ) : Infinity
                    )

                    // if (node.arguments.length === 1 || (varArgs && node.arguments.length >= 1))
                    // {
                    record = data.calls[e.name];
                    indexRecord = pluginOpts.indexes && data.indexes[e.name];
                    contextRecord = tf.captureContext && data.contexts[e.name];
                    if (!record)
                    {
                        record = [];
                        data.calls[e.name] = record;

                        if (pluginOpts.indexes)
                        {
                            indexRecord = []
                            data.indexes[e.name] = indexRecord;
                        }
                        if (tf.captureContext)
                        {
                            contextRecord = []
                            data.contexts[e.name] = contextRecord;
                        }
                    }

                    const values = []

                    let allEvaluated = true
                    for (let j = 0; j < argsEnd; j++)
                    {
                        const evaluated = staticEval(
                            args[j],
                            tf.allowIdentifier
                        )
                        if (evaluated === undefined)
                        {
                            allEvaluated = false;
                            break;
                        }

                        values.push(
                            evaluated
                        );
                    }

                    //console.log("EVAL", node.arguments , " => ", values);

                    if (allEvaluated)
                    {
                        if (data._config.debug)
                        {
                            console.log("Record '" + values + "' for " + e.name);
                        }
                        insert(
                            record,
                            indexRecord,
                            values,
                            [node.start, node.end],
                            contextRecord,
                            contextRecord && captureContext(path, tf)
                        );
                    }
                    else if (data._config.debug)
                    {
                        console.log("Value evaluated to undefined");
                    }
                    // }
                    // else if (data._config.debug)
                    // {
                    //     console.log("Number of arguments doesn't match");
                    // }
                }
            }
        }
    }

    function staticEval(node, allowIdentifier)
    {
        let i, out, evaluatedValue

        if (t.isTemplateLiteral(node))
        {
            if (node.expressions.length > 0)
            {
                throw new Error("Extracted template literals can't contain expressions");
            }

            return node.quasis[0].value.raw;
        }
        else if (t.isNullLiteral(node))
        {
            return null;
        }
        else if (t.isLiteral(node))
        {
            return node.value;
        }
        else if (t.isArrayExpression(node))
        {
            const elements = node.elements
            out = new Array(elements.length);
            for (i = 0; i < elements.length; i++)
            {
                evaluatedValue = staticEval(elements[i], allowIdentifier);

                if (evaluatedValue !== undefined)
                {
                    out[i] = evaluatedValue;
                }
                else
                {
                    // non-literal array element -> bail
                    return undefined;
                }
            }
            return out;
        }
        else if (t.isObjectExpression(node))
        {
            const properties = node.properties
            out = {};
            for (i = 0; i < properties.length; i++)
            {
                let key
                const property = properties[i]
                if (t.isLiteral(property.key))
                {
                    key = property.key.value;
                }
                else if (t.isIdentifier(property.key))
                {
                    key = property.key.name;
                }
                else
                {
                    // computed property -> bail
                    return undefined;
                }

                evaluatedValue = staticEval(property.value, allowIdentifier);

                if (evaluatedValue !== undefined)
                {
                    out[key] = evaluatedValue;
                }
                else
                {
                    // non-literal value -> bail
                    return undefined;
                }
            }
            return out;
        }
        else if (allowIdentifier && t.isIdentifier(node))
        {
            return { __identifier: node.name };
        }

        return undefined;
    }

    /**
     * The normal filenameRelative seems not to be updated with our setup, so we find the relative
     * path ourselves with the sourceRoot option being set.
     * @param opts
     */
    function getRelativeModuleName(opts)
    {
        //console.log("getRelativeModuleName", opts.sourceRoot);

        const root = opts.root || opts.sourceRoot
        if (!root)
        {
            return null;
        }
        const len = root.length
        const fullWithExtension = opts.filename.substring(root[len - 1] === nodeJsPath.sep ? len : len + 1)

        return fullWithExtension.substring(0, fullWithExtension.lastIndexOf("."));
    }

    /**
     * Returns true if the given node is a call expression for require
     *
     * @param node
     * @returns {boolean}
     */
    function isRequire(node)
    {
        if (!node || !t.isCallExpression(node))
        {
            return false;
        }

        if (node.callee.type !== "Identifier" || node.callee.name !== "require")
        {
            return false;
        }

        // no call arguments
        const args = node.arguments
        if (args.length !== 1)
        {
            return false;
        }

        // first node arg is not an object
        const first = args[0]
        return t.isLiteral(first);
    }

    function trackVar(data, state, varName, modulePath, importedName, module)
    {
        const pluginOpts = state.opts

        if (modulePath[0] === ".")
        {
            // resolve relative module ("/../" to go back from the view to its directory)

            const relRequired = strip(nodeJsPath.normalize(module + "/../" + modulePath), pluginOpts.sourceRoot)

            if (!relRequired)
            {
                return;
            }

            modulePath = "./" + relRequired;
        }
        data.requires[varName] = modulePath;

        const array = data._config && data._config.moduleLookup[modulePath]
        if (array)
        {
            // copy tracked function association to local variable

            const out = []

            for (let i = 0; i < array.length; i++)
            {
                const name = array[i]
                const tf = data._config.trackedFunctions[name]
                const fn = tf.fn
                if (fn)
                {
                    if (importedName)
                    {
                        if (importedName === fn)
                        {
                            data._config.isMemberCall[varName] = true;
                        } else
                        {
                            continue;
                        }
                    } else
                    {
                        data._config.hasMemberCall[varName] = true;
                    }

                } else
                {
                    if (!importedName)
                    {
                        data._config.hasModuleCall[varName] = true;
                    } else
                    {
                        continue;
                    }
                }

                out.push({
                    name: name,
                    fn: importedName,
                    expr: !!fn && !importedName && t.buildMatchMemberExpression(varName + "." + fn)
                });
            }

            data._config.trackedByVar[varName] = out;

            if (state.opts.debug)
            {
                console.log("Tracked module '" + modulePath + "' assigned to variable " + varName)
            }
        }
    };
    return {
        visitor: {
            "Program": function (path, state) {
                //dump(path.node);

                const pluginOpts = state.opts
                const module = getRelativeModuleName(path.hub.file.opts)
                if (!module)
                {
                    if (state.opts.debug)
                    {
                        console.log("No source root, ignoring everything");
                    }
                    return;
                }

                const relative = strip(module, pluginOpts.sourceRoot)

                if (!relative)
                {
                    return;
                }

                const data = Data._internal()["./" + relative] = {
                    //module: module,
                    requires: {},
                    calls: {}
                }

                if (pluginOpts.indexes)
                {
                    data.indexes = {};
                }

                const moduleLookup = {}

                let contextUsed = false;
                const trackedFunctions = pluginOpts.trackedFunctions
                for (let name in trackedFunctions)
                {
                    if (trackedFunctions.hasOwnProperty(name))
                    {
                        const tf = trackedFunctions[name]
                        let array = moduleLookup[tf.module]
                        if (!array)
                        {
                            array = [name];
                            moduleLookup[tf.module] = array;
                        } else
                        {
                            array.push(name);
                        }

                        if (tf.captureContext && !data.contexts)
                        {
                            data.contexts = {};
                        }
                    }
                }



                data._config = {
                    trackedFunctions: trackedFunctions,
                    debug: !!pluginOpts.debug,
                    moduleLookup: moduleLookup,
                    trackedByVar: {},
                    hasMemberCall: {},
                    isMemberCall: {},
                    hasModuleCall: {}
                };

                if (state.opts.debug)
                {
                    console.log("Analysing './" + module + "'");
                }
            },
            "AssignmentExpression|VariableDeclarator": function (path, state) {
                //dir("state", state);
                const pluginOpts = state.opts
                const node = path.node
                const scope = path.scope
                if (scope.parent)
                {
                    // we only want to examine the root scope
                    return;
                }

                let left, right

                const module = getRelativeModuleName(path.hub.file.opts)
                if (!module)
                {
                    return;
                }

                const relative = strip(module, pluginOpts.sourceRoot)

                if (!relative)
                {
                    return;
                }
                const data = Data._internal()["./" + relative]

                const nodeIsAssignment = t.isAssignmentExpression(node)
                const nodeIsVariableDeclarator = t.isVariableDeclarator(node)
                if (nodeIsAssignment)
                {
                    left = node.left;
                    right = node.right;
                } else if (nodeIsVariableDeclarator)
                {
                    left = node.id;
                    right = node.init;
                }

                if (t.isIdentifier(left) && isRequire(right))
                {
                    trackVar(data, state, left.name, right.arguments[0].value, null, module);
                }
            },
            "CallExpression|NewExpression": function (path, state) {
                const pluginOpts = state.opts
                const node = path.node

                if (!path.hub)
                {
                    return;
                }

                const module = getRelativeModuleName(path.hub.file.opts)
                if (!module)
                {
                    return;
                }
                const relative = strip(module, pluginOpts.sourceRoot)

                if (!relative)
                {
                    return;
                }
                const data = Data._internal()["./" + relative]

                const callee = node.callee

                if (!data._config)
                {
                    return;
                }

                if (t.isIdentifier(callee) && data._config.hasModuleCall[callee.name])
                {
                    if (state.opts.debug)
                    {
                        console.log("Module call for variable " + callee.name + "");
                    }
                    recordCall(data, path, pluginOpts, false, false);
                } else if (t.isIdentifier(callee) && data._config.isMemberCall[callee.name])
                {
                    if (state.opts.debug)
                    {
                        console.log("Imported member call for variable " + callee.name + "");
                    }
                    recordCall(data, path, pluginOpts, false, true);
                } else if (t.isMemberExpression(callee) && t.isIdentifier(
                    callee.object) && data._config.hasMemberCall[callee.object.name])
                {
                    if (state.opts.debug)
                    {
                        console.log("Member call for variable " + callee.object.name + "");
                    }
                    recordCall(data, path, pluginOpts, true, false);
                }
            },
            "ImportDeclaration": function (path, state) {
                let i
                const node = path.node
                let specifier
                const pluginOpts = state.opts

                const module = getRelativeModuleName(path.hub.file.opts)
                if (!module)
                {
                    return;
                }

                const relative = strip(module, pluginOpts.sourceRoot)

                if (!relative)
                {
                    return;
                }
                const data = Data._internal()["./" + relative]

                for (i = 0; i < node.specifiers.length; i++)
                {
                    specifier = node.specifiers[i];

                    if (t.isImportDefaultSpecifier(specifier))
                    {
                        trackVar(data, state, specifier.local.name, node.source.value, null, module);
                    } else if (t.isImportSpecifier(specifier))
                    {
                        trackVar(data, state, specifier.local.name, node.source.value, specifier.imported.name, module);

                        //console.log(specifier.imported, specifier.local);
                    }
                }
            }
        }
    };
};

