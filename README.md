Track Usage Plugin
==================

This is an experimental babel plugin that tracks the usage of a set of configured modules.

Usage
-----

```
npm install --save-dev babel-plugin-track-usage
```

The module will recognize requires of the configured modules in the transpiled babel modules and will collect
statically analyzable calls to the declared functions.
 

Plugin Configuration
--------------------

In your *.babelrc* (or equivalent):

```
    ["track-usage", {
        trackedFunctions: {
            i18n:  {
                module: "./service/i18n",
                fn: "",
                varArgs: true
            }
        },
        debug: false
    }]
```

The plugin options object needs a key *"trackedFunctions"* that contains function definitions for every function to be tracked.

The name needs to be unique and does not matter (results will show up under this name in the resulting JSON).

The *"module"* prop is a module location relative to babel sourceRoot. 

The *"fn"* prop is either empty if the module is called as function itself or fn contains the name of the method to invoke on the module.

If the *"varArgs"* prop is set to true, the method can have additional parameters to the first statically analyzable one.

All methods calls are identified by their first parameter, which needs to be a javascript literal at this point.

The *"debug"* plugin option causes the extraction process to log debugging information if set to true.

the *"sourceRoot"* plugin option allows to have all relative module paths relative to that dir

The source root option cannot start with "./" but will lead to all local modules having a "./" prefix
to umambiguously distinguish them from NPM dependency modules which are listed as requires but are
not analyzed themselves. The sourceRoot option should end in a "/".

Access Usage Data
-----------------

```
    var usageData = require("babel-plugin-track-usage/data").get()
```

can be used to access the collected data will contain a "usages" prop with one prop per analzyed module 

```
{ 
    "usages": {
        "./components/Grid": {
            "module": "components/Grid",
            "requires": [ "react", "classnames", "./service/i18n"],
            "calls": {
                "i18n": ["No Rows"]
            }
        }
    }
}

```

The "module" prop repeats the module name (without leading "./").


The "requires" prop contains a array of modules required by this module. The module name will be absolute for modules 
required out of node_modules and again relative to source root for relative requires. This is exactly the format of the 
keys of the "usages" map. This can be used to track transitive call dependencies.

The calls prop contains a mapping from the configured logical names of our methods to an array first argument values 
that are called in the module.

# Example with Webpack

The module "./webpack/track-usage-plugin.js" contains a simple webpack plugin to store 
the collected data in a JSON file. 

## Configuring the example webpack plugin
```javascript
var path = require("path");

var TrackUsagePlugin = require("babel-plugin-track-usage/webpack/track-usage-plugin");

module.exports = {
    // ... rest of webpack config...
    plugins: [
        new TrackUsagePlugin({
            output: path.join(__dirname, "src/main/base/resources/js/track-usage.json")
        })
    ]
};

```

The babel plugin config is as such for my project

```
    [
        "track-usage",
        {
            "sourceRoot" : "src/main/js/",
            "trackedFunctions": {
                "i18n": {
                    "module": "./service/i18n",
                    "fn": "",
                    "varArgs": true
                }
            },
            "debug": false
        }
    ]

```
