var fs = require("fs"),
    path = require("path"),
    config = require("../config"),
    root_dir = config.get("root_dir") + '/';

function FileRouter (root_directory) {
	this.pathHelper = require("path");
	this.config = require("../config");
	this.fsHelper = require("fs");
	
	// Figure out root directory, default to what's in config
	this.root_directory = typeof root_directory === "string" ? root_directory : this.config.get("root_dir");
	
	if (!this.root_directory)
		throw new Error("Invalid root directory");
	
	return this;
}

FileRouter.prototype.renderDirectory = function renderDirectory (req, res, stats, directory) {
	
}

function renderDirectory (req, res, stats, directory) {
    fs.readdir(directory, function (err, files) {
        if (err)
            fileNotFound(res);
        
        // Allow for navigation back
        if (req.path !== '/')
        	files.unshift("..");

        return res.render("directory", {
            "title": req.path,
            "files": files
        });
    });
}

function renderFile (req, res, stats, file) {
    // figure out mime-type, file name, file size
    // Force download
}

function fileNotFound(req, res) {
    return res.status(404).render("404", {
    	"title": req.path,
    	"path": req.path
    });
}

exports.file = function fileRoute (req, res){
    var uri = path.normalize(req.path),
    	directory_or_file;
    
    if (uri !== req.path)
        return res.redirect(uri);
    
    directory_or_file = path.normalize(root_dir + req.path);

    fs.exists(directory_or_file, function(exists) {
        if (!exists)
            return fileNotFound(req, res);

        fs.stat(directory_or_file, function stats(err, stats) {
            if (err)
                return fileNotFound(req, res);

            if (stats.isDirectory())
                return renderDirectory(req, res, stats, directory_or_file);

            return renderFile(req, res, stats, directory_or_file);
        });
    });
};

