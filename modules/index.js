/*
 * Files Module
 */
var path = require("path"),
    fs = require("fs"),
    Emitter = require("events").eventEmitter,
    util = require("util"),
    incompleteFiles;

/*
 * 
 * File Object
 * 
 */
exports.File = function File (path, collector, index) {
    var self = this;

    Emitter.call(this);
    this.collector = collector;
    this.index = index;
    
    path.exists(path, function (exists) {
	var index;

	// Huh?
	if (!exists)
	    self.destroy();
	
	fs.lstat(path, function (err, stats) {
	    if (err) {
		console.log(err);
		self.destroy();
	    }

	    self.stats = stats;
	    self.emit("ready");
	    
	    if (--incompleteFiles <= 0)
		self.collector.emit("ready");
	});
    });

    return this;
}

util.inherits(File, Emitter);

// Remove this file from its collector
File.prototype.destroy = function FileDestory () {
    this.collector.files.splice(this.index, 1);
};

/*
 * 
 * FileCollector Object
 * 
 */
exports.FileCollector = function FileCollector (directory) {
    var self = this;

    Emitter.call(this);
    this.files = [];

    path.exists(directory, function (exists)) {
	if (!exists)
	    throw new Error("Sorry, but that file doesn't exist.");
	
	fs.lstat(directory, function (err, stats) {
	    if (err) throw err;
	    
	    // May as well save this information
	    self.stats = stats;
	    
	    // This is a directory, and we should find the files in it
	    if(stats.isDirectory()) {
		fs.readdir(directory, function (err, files) {
		    if (err) throw err;
		    
		    i = 0;
		    len = files.length;
		    incompleteFiles = len;
		    
		    // Create the file objects that belong to this collector
		    for (; i < len; i++)
			this.files.push(new File(files[i], self, i));
		});
	    } else { // This is a file, we can just get the info on it
		self = new File(directory, false, false, stats);
	    }
	});
    });
    
    // This may or may not be a FileCollector. Sorry!
    return self;
};

util.inherits(FileCollector, Emitter);
