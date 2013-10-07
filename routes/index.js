var path = require("path"),
    Files = require("../modules"),
    config = require("../config"),
    root_dir = config.root_dir;

// Parse the request path and figure out how to respond
exports.file = function fileRoute (req, res){
    var uri = path.normalize(req.path),
    	browserSafeUri = path.sep !== '/' ? uri.replace(path.sep, '/') : uri;
    
    if (browserSafeUri !== req.path)
        return res.redirect(browserSafeUri);

    // Figure out what's going on and render accordingly
    Files.FileCollector.init(path.normalize(root_dir + req.path))
    	.on("ready", function (directory) {
    	    // Render a list of files in the directory
            return res.render("directory", {
                "title": directory.getPath(),
                "files": directory.files,
                "breadcrumbs": directory.getBreadCrumbs()
            });
    	}).on("single", function (file) {
    	    // Render single file
    	}).on("notFound", function (directory_or_file) {
    	    // 404
    	    var path = directory_or_file.getPath();

    	    return res.status(404).render("404", {
    		"title": path,
    		"path": path
    	    });
    	});
};
