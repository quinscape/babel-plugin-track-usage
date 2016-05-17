var dataStore = {
};

module.exports = {
    clear: function ()
    {
        dataStore = {};

    },
    get: function()
    {
        return dataStore;
    }
};
