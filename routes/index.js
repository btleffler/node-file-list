var fs = require("fs"),
    path = require("path");

function renderDirectory (req, res, stats) {
    fs.readdir(req.path, function (err, files) {
        if (err)
            fileNotFound(res);

        res.render("directory", {
            "title": req.path,
            "files": files.unshift("..") // Allow for navigation back
        });
    });
}

function renderFile (req, res, stats) {
    // figure out mime-type, file name, file size
    // Force download
}

function fileNotFound(res) {
    res.status(404);
}

exports.file = function fileRoute (req, res){
    var uri = path.normalize(req.path);
    
    if (uri !== req.path)
        return res.redirect(uri);

    fs.exists(req.path, function(exists) {
        if (!exists)
            return fileNotFound(res);

        fs.stat(req.path, function stats(err, stats) {
            if (err)
                return fileNotFound(res);

            if (stats.isDirectory())
                return renderDirectory(req, res, stats);

            return renderFile(req, res, stats);
        });
    });
};

