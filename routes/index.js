var fs = require("fs"),
    path = require("path"),
    config = require("../config"),
    root_dir = config.get("root_dir") + '/';

function getBreadCrumbs (path) {
    var parts = path.split(/[\\\/]/),
    	i = 0,
    	len = parts.length,
    	part;
    
    for (; i < len; i++) {
	part = {};
	part.name = parts[i] || '/';

	if (part.name !== '/')
	    part.path = path.substring(0, path.indexOf(parts[i]) + parts[i].length);
	else
	    part.path = '/';

	parts[i] = part;
    }
    
    console.log(parts);
    
    return parts;
}

function renderDirectory (req, res, stats, directory) {
    fs.readdir(directory, function (err, files) {
        if (err)
            fileNotFound(res);

        return res.render("directory", {
            "title": req.path,
            "files": files,
            "breadcrumbs": getBreadCrumbs(req.path)
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

// Parse the request path and figure out how to respond
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
