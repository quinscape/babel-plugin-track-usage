var fs = require("fs");
var TrackUsage = require("babel-plugin-track-usage/data");


/**
 * Creates a new instance of the TrackUsagePlugin which is a webpack plugin for
 * babel-plugin-track-usage.
 *
 * It is necessary to write out the collected usage data into a JSON file.
 *
 * @param options
 * @constructor
 */
function TrackUsagePlugin(options)
{
    if (typeof options.output !== "string")
    {
        throw new Error("Need output option.");
    }

    // console.log("OPTIONS", JSON.stringify(options, null, 2));
    this.options = options;
}

TrackUsagePlugin.prototype.apply = function (compiler)
{
    var output = this.options.output;

    compiler.hooks.afterEmit.tap("track-usage-plugin", compilation =>
    {
        var usageData = TrackUsage.get();
        fs.writeFileSync(output, JSON.stringify(usageData), "utf-8");
    });
};

module.exports = TrackUsagePlugin;
