/*
 * Files Module
 */
var path = require("path"),
    fs = require("fs"),
    Emitter = require("events").eventEmitter,
    util = require("util"),
    filesize = require("filesize");
    incompleteFiles;

/*
 * 
 * File Object
 * 
 */
exports.File = function File (path, collector, index, stats) {
    var self = this;

    Emitter.call(this);

    this.collector = collector;
    this.index = index;
    this.path = path;
    this.name = path.basename(path);
    this.extension = path.extname(this.name);
    this.stats = stats;
    
    function finish() {
	self.emit("ready");
	
	if (--incompleteFiles <= 0)
	    self.collector.emit("ready");
    }
    
    path.exists(path, function (exists) {
	// Huh?
	if (!exists)
	    self.destroy();
	
	if (self.stats)
	    finish();
	else {
	    fs.lstat(path, function (err, stats) {
		if (err) {
		    console.log(err);
		    self.destroy();
		}

		self.stats = stats;
		finish();
	    });
	}
    });

    return this;
}

util.inherits(File, Emitter);

// Remove this file from its collector
File.prototype.destroy = function FileDestory () {
    this.collector.files.splice(this.index, 1);
};

File.prototype.isBlockDevice = function isBlockDevice() {
    return this.stats.isBlockDevice();
}

File.prototype.isCharacterDevice = function isCharacterDevice() {
    return this.stats.isCharacterDevice();
}

File.prototype.isSymbolicLink = function isSymbolicLink() {
    return this.stats.isSymbolicLink();
}

File.prototype.isFIFO = function isFIFO() {
    return this.stats.isFIFO();
}

File.prototype.isSocket = function isSocket() {
    return this.stats.isSocket();
}

File.prototype.size = function fileSize () {
    return filesize(this.stats.size);
}

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
		self.file = new File(directory, self, 0, stats);
		self.files = [ self.file ];
		self.emit("single");
	    }
	});
    });

    return self;
};

util.inherits(FileCollector, Emitter);
