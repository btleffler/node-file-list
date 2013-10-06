var pathLib = require("path"),
    fs = require("fs"),
    Emitter = require("events").EventEmitter,
    util = require("util"),
    filesize = require("filesize"),
    config = require("../config"),
    root_dir = config.root_dir,
    incompleteFiles;

/*
 * 
 * File Object
 * 
 */
var File = function File (path, collector, index, stats) {
    var self = this;

    Emitter.call(this);

    this.collector = collector;
    this.index = index;
    this.path = path;
    this.name = pathLib.basename(path);
    this.extension = pathLib.extname(this.name);
    this.stats = stats;
    
    function finish() {
	self.emit("ready", self);
	
	if (--incompleteFiles <= 0)
	    self.collector.emit("ready", self.collector);
    }
    
    fs.exists(path, function (exists) {
	// Huh?
	if (!exists) {
	    self.destroy();
	    return;
	}
	
	if (self.stats)
	    finish();
	else {
	    fs.stat(path, function (err, stats) {
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
};

File.init = function initFile (path, collector, index, stats) {
    return new File(path, collector, index, stats);
};

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

File.prototype.getPath = function fileGetPath () {
    return this.path.replace(root_dir, '');
}

exports.File = File;

/*
 * 
 * FileCollector Object
 * 
 */
var FileCollector = function FileCollector (directory) {
    var self = this;

    Emitter.call(this);
    this.files = [];
    this.path = directory;

    fs.exists(directory, function (exists) {
	if (!exists) {
	    self.emit("notFound", self);
	    return;
	}
	
	fs.stat(directory, function (err, stats) {
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
			self.files.push(new File(directory + pathLib.sep + files[i], self, i));
		});
	    } else { // This is a file, we can just get the info on it
		self.file = new File(directory, self, 0, stats);
		self.files = [ self.file ];
		self.emit("single", self.file);
	    }
	});
    });

    return self;
};

FileCollector.init = function initFileCollector(directory) {
    return new FileCollector(directory);
};

util.inherits(FileCollector, Emitter);

FileCollector.prototype.getPath = function fileCollectorGetPath () {
    return this.path.replace(root_dir, '');
};

FileCollector.prototype.getBreadCrumbs = function getBreadCrumbs () {
    var self = this,
    	path = this.getPath(),
    	parts, i, len, part, lastPart;
    
    function getBreadCrumb (part) {
	var name = part || pathLib.sep;
	return {
	    "name": name,
	    "path": path.substring(0, path.indexOf(name) + name.length)
	};
    }
    
    // Special case
    if (path === pathLib.sep) {
	return {
	    "parts": [],
	    "lastPart": getBreadCrumb(pathLib.sep)
	};
    }
    
    parts = path.split(pathLib.sep);
    i = 0;
    lastPart = parts.pop();
    len = parts.length;
    
    // Get the bread crumbs before where we are right now
    for (; i < len; i++)
	parts[i] = getBreadCrumb(parts[i]);
    
    return { "parts": parts, "lastPart": getBreadCrumb(lastPart) };
};

exports.FileCollector = FileCollector;
