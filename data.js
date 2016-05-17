var dataStore;

var DataStore = {
    clear: function ()
    {
        dataStore = {
            usages : {

            }
        };
    },
    get: function()
    {
        return dataStore;
    }
};

DataStore.clear();

module.exports = DataStore;

