/*
 * Files Module
 */
var path = require("path"),
    fs = require("fs");

function file (path) {
    // Get information about the file
    // Name
    // Size
    // Created
    // Modified
    // mime-type
    return {
	
    };
}

exports.fileCollector = function fileCollector (directory) {
    path.exists(directory, function (exists)) {
	if (!exists) throw new Error("Sorry, but " . directory . " doesn't exist.");
	
	fs.readdir(directory, function (err, files) {
	    var i = 0,
	    	len = files.length;

	    if (err) throw new Error(err);
	    
	    for (; i < len; i++)
		files[i] = new File(files[i]);
	});
    });
};