/**
 * Module dependencies.
 */

var Express = require("express"),
  Http = require("http"),
  FileCollector = require("./FileCollector.js"),
  FileRouter = require("./FileRouter.js"),
  Morgan = require("morgan"),
  app = Express();

// all environments
app.set("views", __dirname + "/views");
app.set("view engine", "jade");
app.use(Morgan("combined"));

function startServer(root_dir, port, showHiddenFiles) {
  root_dir = typeof root_dir === "string" ? root_dir : process.cwd();
  root_dir = root_dir.replace(FileCollector.terminatingPathSep, '');

  if (root_dir === '.') {
    root_dir = process.cwd();
  }

  app.set("root_directory", root_dir);
  app.set("port", port || process.env.PORT || 3000);
  app.set("showHiddenFiles", showHiddenFiles === true);

  // Only one route, so simple
  app.get('*', FileRouter.init(app).generateFileRoute());

  // development only
  if ("development" == app.get("env")) {
    app.use(require("errorhandler")());
  }

  var server = Http.createServer(app).listen(app.get("port"), function(){
    console.log("File-list server listening on port " + app.get("port"));
  });

  return {
    "app": app,
    "server": server
  };
}

// Run the server unless we're being require()'d
if (require.main === module) {
  startServer();
} else {
  exports.cli = { "startServer": startServer };
}
