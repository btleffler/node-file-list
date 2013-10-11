var path = require("path"),
    Files = require("../modules"),
    config = require("../config"),
    root_dir = config.root_dir;

// Parse the request path and figure out how to respond
exports.file = function fileRoute (req, res){
    var uri = path.normalize(req.path),
    	browserSafeUri;
    
    // Handle windows file paths
    if (path.sep !== '/')
    	browserSafeUri = uri.replace(config.globalPathSepExp, '/');
    else
    	browserSafeUri = uri;

    // Make sure we don't have a trailing path separator
    if (browserSafeUri.length > 1)
	browserSafeUri = browserSafeUri.replace(config.pathSepExp, '');

    if (browserSafeUri !== req.path)
        return res.redirect(browserSafeUri);

    // Figure out what's going on and render accordingly
    Files.FileCollector.init(path.normalize(root_dir + req.path))
    	.on("ready", function (directory) {
    	    // Render a list of files in the directory
            return res.render("directory", {
                "title": directory.getPath(true),
                "files": directory.files,
                "breadcrumbs": directory.getBreadCrumbs()
            });
    	}).on("single", function (file) {
    	    // Render single file
    	    console.log("Starting to download: " + file.path);
    	    return res.sendfile(file.path);
    	}).on("notFound", function (directory) {
    	    // 404
    	    return res.status(404).render("directory", {
                "title": directory.getPath(true),
                "files": directory.files,
                "error": "This is not the file you're looking for.",
                "breadcrumbs": directory.getBreadCrumbs()
            });
    	});
};
