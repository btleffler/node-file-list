/**
 * Module dependencies.
 */

var express = require("express"),
    app = express(),
    http = require("http"),
    path = require("path"),
    FileCollector = require("./FileCollector.js"),
    FileRouter = require("./FileRouter.js");

// all environments
app.set("views", __dirname + "/views");
app.set("view engine", "jade");
app.use(express.logger("dev"));
app.use(app.router);

// development only
if ("development" == app.get("env")) {
    app.use(express.errorHandler());
}

function startServer(root_dir, port, showHiddenFiles) {
    root_dir = typeof root_dir === "string" ? root_dir : process.cwd();
    root_dir = root_dir.replace(FileCollector.terminatingPathSep, '');

    app.set("root_directory", root_dir);
    app.set("port", port || process.env.PORT || 3000);
    app.set("showHiddenFiles", showHiddenFiles === true);

    // Only one route, so simple
    app.get('*', FileRouter.init(app).generateFileRoute());

    var server = http.createServer(app).listen(app.get("port"), function(){
        console.log("File-list server listening on port " + app.get("port"));
    });

    return {
        "app": app,
        "server": server
    };
}

// Run the server unless we're being require()'d
if (require.main === module)
    startServer();
else
    exports.cli = { "startServer": startServer };
