/*
 * Files Module
 */
var path = require("path"),
    fs = require("fs"),
    Emitter = require("events").eventEmitter,
    util = require("util");

function File (path) {
    Emitter.call(this);
    // Get information about the file
    // Name
    // Size
    // Created
    // Modified
    // mime-type
    return {
	
    };
}

util.inherits(File, Emitter);

exports.FileCollector = function FileCollector (directory) {
    Emitter.call(this);
    this.files = [];

    path.exists(directory, function (exists)) {
	if (!exists) throw new Error("Sorry, but " . directory . " doesn't exist.");
	
	fs.readdir(directory, function (err, files) {
	    var i = 0,
	    	len = files.length;

	    if (err) throw new Error(err);
	    
	    for (; i < len; i++)
		this.files.push(new File(files[i]));
	});
    });
};

util.inherits(FileCollector, Emitter);
