
/*
 * GET home page.
 */

var fs = require("fs");

function renderDirectory (req, res, stats) {
  res.render("directory", {
    "title": req.path,
    "files": []
  });
}

function renderFile (req, res, stats) {
  // figure out mime-type, file name, file size
  // Force download
}

exports.file = function fileRoute (req, res){
  fs.stat(req.path, function stats(err, stats) {
    if (stats.isDirectory())
      return renderDirectory(req, res, stats);
    
    return renderFile(req, res, stats);
  });
};
