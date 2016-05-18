var nodeJsPath = require("path");

var Data = require("../data");

module.exports = function (t) {

    t = t.types;

    function recordCall(data, node, memberCall)
    {
        var record, callee = node.callee;

        var array = memberCall ? data._config.trackedByVar[callee.object.name] : data._config.trackedByVar[callee.name];
        for (var i = 0; i < array.length; i++)
        {
            var e = array[i];
            var tf = data._config.trackedFunctions[e.name];


            if ( (memberCall && tf.fn) || (!memberCall && !tf.fn))
            {
                if (data._config.debug)
                {
                    console.log("Tracking ", node)
                }

                if (!tf.fn || e.expr(callee))
                {
                    var varArgs = tf.varArgs;
                    if (node.arguments.length == 1 || (varArgs && node.arguments.length >= 1))
                    {
                        record = data.callsMap[e.name];
                        if (!record)
                        {
                            record = {};
                            data.callsMap[e.name] = record;
                        }
                        var value = staticEval(node.arguments[0]);

                        //console.log("EVAL", node.arguments[0] , " => ", value);

                        if (value !== undefined)
                        {
                            if (data._config.debug)
                            {
                                console.log("Record '" + value + "' for " + e.name);
                            }
                            record[value] = true;
                        }
                        else if (data._config.debug)
                        {
                            console.log("Value evaluated to undefined");
                        }
                    }
                    else if (data._config.debug)
                    {
                        console.log("Number of arguments doesn't match");
                    }
                }
            }
        }
    }

    function staticEval(node)
    {
        if (t.isLiteral(node))
        {
            return node.value;
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

    return {
        visitor: {
            "Program": {
                enter: function (path, state)
                {
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

                    var data = Data.get().usages["./" + module] = {
                        module: module,
                        requiresMap: {},
                        callsMap: {}
                    };

                    var lookup = {};

                    var trackedFunctions = pluginOpts.trackedFunctions;
                    for (var name in trackedFunctions)
                    {
                        if (trackedFunctions.hasOwnProperty(name))
                        {
                            var tf = trackedFunctions[name];
                            var array = lookup[tf.module];
                            if (!array)
                            {
                                array = [name];
                                lookup[tf.module] = array;
                            }
                            else
                            {
                                array.push(name);
                            }
                        }
                    }

                    data._config = {
                        trackedFunctions: trackedFunctions,
                        debug: !!pluginOpts.debug,
                        moduleLookup: lookup,
                        trackedByVar: {},
                        hasMemberCall: {},
                        hasModuleCall: {}
                    };

                    if (state.opts.debug)
                    {
                        console.log("Analysing './" + module + "'");
                    }
                },
                exit: function (path, state)
                {
                    var module = getRelativeModuleName(path.hub.file.opts);
                    if (!module)
                    {
                        return;
                    }

                    var data = Data.get().usages["./" + module];

                    var reqArray = [];
                    for (var varName in data.requiresMap)
                    {
                        if (data.requiresMap.hasOwnProperty(varName))
                        {
                            reqArray.push(data.requiresMap[varName]);
                        }
                    }

                    var calls = {};
                    for (var def in data.callsMap)
                    {
                        if (data.callsMap.hasOwnProperty(def))
                        {
                            var array = [];
                            var map = data.callsMap[def];
                            for (var name in map)
                            {
                                if (map.hasOwnProperty(name))
                                {
                                    array.push(name);
                                }
                            }

                            calls[def] = array;
                        }
                    }

                    data.requires = reqArray;
                    data.calls = calls;

                    delete data.callsMap;
                    delete data.requiresMap;
                    delete data._config;
                }
            },
            "AssignmentExpression|VariableDeclarator": function (path, state)
            {
                //dir("state", state);

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
                var data = Data.get().usages["./" + module];

                var nodeIsAssignment = t.isAssignmentExpression(node);
                var nodeIsVariableDeclarator = t.isVariableDeclarator(node);
                if (nodeIsAssignment)
                {
                    left = node.left;
                    right = node.right;
                }
                else if (nodeIsVariableDeclarator)
                {
                    left = node.id;
                    right = node.init;
                }

                if (t.isIdentifier(left) && isRequire(right))
                {
                    var required = right.arguments[0].value;

                    if (required[0] === ".")
                    {
                        // resolve relative module ("/../" to go back from the view to its directory)
                        required = "./" + nodeJsPath.normalize(module + "/../" + required)
                    }
                    data.requiresMap[left.name] = required;

                    var array = data._config && data._config.moduleLookup[required];
                    if (array)
                    {
                        // copy tracked function association to local variable

                        var out = new Array(array.length);

                        for (var i = 0; i < array.length; i++)
                        {
                            var expr = null, name = array[i];
                            var tf = data._config.trackedFunctions[name];
                            var fn = tf.fn;
                            if (fn)
                            {
                                data._config.hasMemberCall[left.name] = true;
                            }
                            else
                            {
                                data._config.hasModuleCall[left.name] = true;
                            }

                            out[i] = {
                                name: name,
                                expr: !!fn && t.buildMatchMemberExpression( left.name + "." + fn)
                            };
                        }

                        data._config.trackedByVar[left.name] = out;

                        if (state.opts.debug)
                        {
                            console.log("Tracked module '" + required + "' assigned to variable " + left.name)
                        }
                    }
                }
            },
            "CallExpression": function (path, state)
            {
                var node = path.node;

                var module = getRelativeModuleName(path.hub.file.opts);
                if (!module)
                {
                    return;
                }
                var data = Data.get().usages["./" + module];

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
                    recordCall(data, node, false);
                }
                else {
                    if (t.isMemberExpression(callee) && t.isIdentifier(callee.object) && data._config.hasMemberCall[callee.object.name])
                    {
                        if (state.opts.debug)
                        {
                            console.log("Member call for variable " + callee.object.name + "");
                        }
                        recordCall(data, node, true);
                    }
                }
            }
        }
    };
};

