/*
 * Files Module
 */
var path = require("path"),
    fs = require("fs"),
    Emitter = require("events").eventEmitter,
    util = require("util"),
    incompleteFiles;

function File (path, collector, index) {
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

exports.FileCollector = function FileCollector (directory) {
    var self = this;

    Emitter.call(this);
    this.files = [];

    path.exists(directory, function (exists)) {
	if (!exists)
	    throw new Error("Sorry, but " . directory . " doesn't exist.");
	
	fs.readdir(directory, function (err, files) {
	    if (err) throw err;
	    
	    i = 0;
	    len = files.length;
	    incompleteFiles = len;
	    
	    for (; i < len; i++)
		this.files.push(new File(files[i], self, i));
	});
    });
};

util.inherits(FileCollector, Emitter);
