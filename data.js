var dataStore;

function flattenRequires(requires)
{
    var array = [];

    for (var varName in requires)
    {
        if (requires.hasOwnProperty(varName))
        {
            var r = requires[varName];
            if (array.indexOf(r) < 0)
            {
                array.push(r);
            }
        }
    }

    return array;
}

function flattenCalls(calls)
{
    var out = {};
    for (var name in calls)
    {
        if (calls.hasOwnProperty(name))
        {
            var array = [];
            var map = calls[name];
            for (var arg in map)
            {
                if (map.hasOwnProperty(arg))
                {
                    array.push(arg);
                }
            }

            out[name] = array;
        }
    }

    return out;
}
var DataStore = {
    _internal: function ()
    {
        return dataStore.usages;
    },

    clear: function ()
    {
        dataStore = {
            usages : {

            }
        };
    },
    get: function()
    {
        var usages = dataStore.usages;
        var cleaned = {};
        for (var module in usages)
        {
            if (usages.hasOwnProperty(module))
            {
                var e = usages[module];

                cleaned[module] = {
                    module: e.module,
                    requires: flattenRequires(e.requires),
                    calls: flattenCalls(e.calls)
                }

            }
        }

        return {
            usages: cleaned
        };
    }
};

DataStore.clear();

module.exports = DataStore;

