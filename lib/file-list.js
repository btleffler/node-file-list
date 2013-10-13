
/**
 * Module dependencies.
 */

var express = require('express');
var app = express();
var http = require('http');
var path = require('path');
var config = require('./config').config;

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.logger('dev'));
app.use(app.router);

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

function startServer(root) {
    root = root || config.get("root_dir");
    var routes = require('./routes')(root);
    app.set("root_directory", root);

    app.get('*', routes.file);

    var server = http.createServer(app).listen(app.get('port'), function(){
        console.log('File-list server listening on port ' + app.get('port'));
    });
    
    return {
        "app": app,
        "server": server
    }
}

// Run the server unless we're being require()'d
if (require.main === module)
    startServer();
else
    exports.cli = { "startServer": startServer };
