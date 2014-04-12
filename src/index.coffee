express = require "express"
app = express()
http = require "http"
path = require "path"
FileCollector = require "./FileCollector.js"
FileRouter = require "./FileRouter.js"

# all environments
app.set "views", __dirname + "/views"
app.set "view engine", "jade"
app.use express.logger("dev")
app.use app.router

# development only
if "development" == app.get "env"
  app.use(express.errorHandler())

start = (root_dir = process.cwd(), port = 3000, showHiddenFiles = false) ->
  root_dir = root_dir.replace FileCollector.terminatingPathSep, ''

  app.set "root_directory", root_dir
  app.set "port", port
  app.set "showHiddenFiles", showHiddenFiles

  # Only one route, so simple
  app.get '*', FileRouter.init(app).generateFileRoute()

  server = http.createServer(app).listen app.get("port"), () ->
    console.log "File-list server listening on port " + app.get "port"

  {
    "app": app,
    "server": server
  }

# Run the server unless we're being require()'d
if require.main == module
  start()
else
  exports.cli = { "startServer": start }
