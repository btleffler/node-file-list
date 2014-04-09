path = require "path"
FileCollector = require "./FileCollector.js"

class FileRouter
  constructor: (app) ->
    this.app = app
    this

  generateFileRoute: () ->
    app = this.app
    showHidden = app.get "showHiddenFiles"

    (req, res) ->
      uri = browserSafeUri = path.normalize req.path

      if path.sep != '/'
        browserSafeUri = uri.replace FileCollector.globalPathSep, '/'

      if browserSafeUri.length > 1
        browserSafeUri = browserSafeUri.replace FileCollector.terminatingPathSep, ''

      if browserSafeUri != req.path
        return res.redirect browserSafeUri

      destination = path.normalize app.get "root_directory" + req.path

      # Figure out whats going on and render accordingly
      FileCollector.init destination, app
        .on "ready", (directory) ->
          # Render a list of files in the directory
          res.render "directory", {
            title: directory.getPath true,
            files: directory.files,
            breadcrumbs: directory.getBreadCrumbs()
          }
        .on "single", (file) ->
          # Send single file to the browser
          console.log "Starting to download " + file.path
          res.sendfile file.path
        .on "notFound", (directory) ->
          # 404
          res.status(404).render "directory", {
            title: directory.getPath true,
            files: directory.files,
            error: "This is not the file you're looking for.",
            breadcrumbs: directory.getBreadCrumbs()
          }

FileRouter.init = (app) ->
  new FileRouter(app)
