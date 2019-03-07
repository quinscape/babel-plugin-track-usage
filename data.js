var dataStore;

function flattenRequires(requires)
{
    var varName, module;
    var array = [];
    var added = {};

    for (varName in requires)
    {
        if (requires.hasOwnProperty(varName))
        {
            module = requires[varName];
            if (!added[module])
            {
                added[module] = true;
                array.push(module);
            }
        }
    }

    return array;
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
                    calls: e.calls
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

