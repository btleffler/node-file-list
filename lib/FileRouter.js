var Path = require("path"),
  FileCollector = require("./FileCollector.js"),
  FileRouter;

module.exports = FileRouter = function FileRouter (app) {
  this.app = app;

  return this;
};

FileRouter.prototype.generateFileRoute = function generateFileRoute () {
  var app = this.app,
    showHidden = app.get("showHiddenFiles");

  return function (req, res) {
    var uri = Path.normalize(req.path),
      browserSafeUri, destination;

    // Handle windows file paths
    if (Path.sep !== '/') {
      browserSafeUri = uri.replace(FileCollector.globalPathSep, '/');
    } else {
      browserSafeUri = uri;
    }

    // Make sure we don't have a trailing path separator
    if (browserSafeUri.length > 1) {
      browserSafeUri = browserSafeUri.replace(
        FileCollector.terminatingPathSep,
        ''
      );
    }

    if (browserSafeUri !== req.path) {
      return res.redirect(browserSafeUri);
    }

    destination = Path.normalize(app.get("root_directory") + req.path);

    // Figure out what's going on and render accordingly
    FileCollector.init(destination, app).on("ready", function (directory) {
        // Render a list of files in the directory
        return res.render("directory", {
          "title": directory.getPath(true),
          "files": directory.files,
          "breadcrumbs": directory.getBreadCrumbs()
        });
      }).on("single", function (file) {
        // Render single file
        console.log("Starting to download: " + file.path);

        return res.sendFile(file.path, {
          "dotfiles": showHidden ? "allow" : "ignore"
        });
      }).on("notFound", function(directory) {
        // 404
        return res.status(404).render("directory", {
          "title": directory.getPath(true),
          "files": directory.files,
          "error": "This is not the file you're looking for.",
          "breadcrumbs": directory.getBreadCrumbs()
        });
      });
  };
};

FileRouter.init = function fileRouterInit(app) {
  return new FileRouter(app);
};
