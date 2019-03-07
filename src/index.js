var nodeJsPath = require("path");
var fs = require("fs");
//var dump = require("./dump");
var deepEqual = require("deep-equal");

var Data = require("../data");

function strip(path, sourceRoot)
{
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

module.exports = function (t) {

    t = t.types;

    function insert(set, value)
    {
        for (var i = 0; i < set.length; i++)
        {
            var v = set[i];
            if (deepEqual(v, value))
            {
                return;
            }
        }

        set.push(value);
    }

    function recordCall(data, node, memberCall, importedFnCall)
    {
        var record, callee = node.callee;

        var array = memberCall ? data._config.trackedByVar[callee.object.name] : data._config.trackedByVar[callee.name];
        for (var i = 0; i < array.length; i++)
        {
            var e = array[i];
            var tf = data._config.trackedFunctions[e.name];

            if ((memberCall && tf.fn) || (!memberCall && !tf.fn) || (!memberCall && importedFnCall && tf.fn))
            {
                if (data._config.debug)
                {
                    console.log("Tracking ", node)
                }

                if (!tf.fn || importedFnCall || e.expr(callee))
                {
                    var args = node.arguments;
                    var varArgs = tf.varArgs;

                    var argsEnd = Math.min(
                        args.length,
                        varArgs ? (
                            typeof varArgs === "number" && varArgs > 0 ? varArgs : 1
                        ) : Infinity
                    );

                    // if (node.arguments.length === 1 || (varArgs && node.arguments.length >= 1))
                    // {
                    record = data.calls[e.name];
                    if (!record)
                    {
                        record = [];
                        data.calls[e.name] = record;
                    }

                    var values = [];


                    var allEvaluated = true;
                    for (var j = 0; j < argsEnd; j++)
                    {
                        var evaluated = staticEval(
                            args[j]
                        );
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

                    if (values.length > 0 && allEvaluated)
                    {
                        if (data._config.debug)
                        {
                            console.log("Record '" + values + "' for " + e.name);
                        }
                        insert(record, values);
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

    function staticEval(node)
    {
        if (t.isTemplateLiteral(node))
        {
            if (node.expressions.length > 0)
            {
                throw new Error("Extracted template literals can't contain expressions");
            }

            return node.quasis[0].value.raw;
        }
        else if (t.isLiteral(node))
        {
            return node.value;
        }
        else if (t.isObjectExpression(node))
        {
            var properties = node.properties;
            var out = {};
            for (var i = 0; i < properties.length; i++)
            {
                var key, value, property = properties[i];
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

                var evaluatedValue = staticEval(property.value);

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
        return undefined;
    }

    /**
     * The normal filenameRelative seems not to be updated with our setup, so we find the relative
     * path ourselves with the sourceRoot option being set.
     * @param opts
     */
    function getRelativeModuleName(opts)
    {
        var root = opts.sourceRoot;
        if (!root)
        {
            return null;
        }
        var len = root.length;
        var fullWithExtension = opts.filename.substring(root[len - 1] === nodeJsPath.sep ? len : len + 1);

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
        var args = node.arguments;
        if (args.length !== 1)
        {
            return false;
        }

        // first node arg is not an object
        var first = args[0];
        return t.isLiteral(first);
    }

    function trackVar(data, state, varName, modulePath, importedName, module)
    {
        var pluginOpts = state.opts;

        if (modulePath[0] === ".")
        {
            // resolve relative module ("/../" to go back from the view to its directory)

            var relRequired = strip(nodeJsPath.normalize(module + "/../" + modulePath), pluginOpts.sourceRoot);

            if (!relRequired)
            {
                return;
            }

            modulePath = "./" + relRequired;
        }
        data.requires[varName] = modulePath;

        var array = data._config && data._config.moduleLookup[modulePath];
        if (array)
        {
            // copy tracked function association to local variable

            var out = [];

            for (var i = 0; i < array.length; i++)
            {
                var name = array[i];
                var tf = data._config.trackedFunctions[name];
                var fn = tf.fn;
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

                var pluginOpts = state.opts;
                var module = getRelativeModuleName(path.hub.file.opts);
                if (!module)
                {
                    if (state.opts.debug)
                    {
                        console.log("No source root, ignoring everything");
                    }
                    return;
                }

                var relative = strip(module, pluginOpts.sourceRoot);

                if (!relative)
                {
                    return;
                }

                var data = Data._internal()["./" + relative] = {
                    module: module,
                    requires: {},
                    calls: {}
                };

                var moduleLookup = {};

                var trackedFunctions = pluginOpts.trackedFunctions;
                for (var name in trackedFunctions)
                {
                    if (trackedFunctions.hasOwnProperty(name))
                    {
                        var tf = trackedFunctions[name];
                        var array = moduleLookup[tf.module];
                        if (!array)
                        {
                            array = [name];
                            moduleLookup[tf.module] = array;
                        } else
                        {
                            array.push(name);
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
                    console.log("Analy  sing './" + module + "'");
                }
            },
            "AssignmentExpression|VariableDeclarator": function (path, state) {
                //dir("state", state);
                var pluginOpts = state.opts;
                var node = path.node;
                var scope = path.scope;
                if (scope.parent)
                {
                    // we only want to examine the root scope
                    return;
                }

                var left, right;

                var module = getRelativeModuleName(path.hub.file.opts);
                if (!module)
                {
                    return;
                }

                var relative = strip(module, pluginOpts.sourceRoot);

                if (!relative)
                {
                    return;
                }
                var data = Data._internal()["./" + relative];

                var nodeIsAssignment = t.isAssignmentExpression(node);
                var nodeIsVariableDeclarator = t.isVariableDeclarator(node);
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
            "CallExpression": function (path, state) {
                var pluginOpts = state.opts;
                var node = path.node;

                var module = getRelativeModuleName(path.hub.file.opts);
                if (!module)
                {
                    return;
                }
                var relative = strip(module, pluginOpts.sourceRoot);

                if (!relative)
                {
                    return;
                }
                var data = Data._internal()["./" + relative];

                var callee = node.callee;

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
                    recordCall(data, node, false, false);
                } else if (t.isIdentifier(callee) && data._config.isMemberCall[callee.name])
                {
                    if (state.opts.debug)
                    {
                        console.log("Imported member call for variable " + callee.name + "");
                    }
                    recordCall(data, node, false, true);
                } else if (t.isMemberExpression(callee) && t.isIdentifier(
                    callee.object) && data._config.hasMemberCall[callee.object.name])
                {
                    if (state.opts.debug)
                    {
                        console.log("Member call for variable " + callee.object.name + "");
                    }
                    recordCall(data, node, true, false);
                }
            },
            "ImportDeclaration": function (path, state) {
                var i, node = path.node, specifier;
                var pluginOpts = state.opts;

                var module = getRelativeModuleName(path.hub.file.opts);
                if (!module)
                {
                    return;
                }

                var relative = strip(module, pluginOpts.sourceRoot);

                if (!relative)
                {
                    return;
                }
                var data = Data._internal()["./" + relative];

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

