var pathLib = require("path"),
    fs = require("fs"),
    Emitter = require("events").EventEmitter,
    util = require("util"),
    filesize = require("filesize"),
    terminatingPathSepExp = /[\\\/]$/,
    globalPathSepExp = /[\\\/]/g,
    incompleteFiles, File, FileCollector;

/*
 *
 * File Object
 *
 */
File = function File (path, collector, index, stats) {
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

        if (incompleteFiles !== false) {
            if (--incompleteFiles <= 0)
                self.collector.emit("ready", self.collector);
        }
    }

    fs.exists(path, function (exists) {
        // Huh?
        if (!exists) {
            self.destroy();
            finish();
            console.log("Something is wrong with this. " + path);
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
};

File.prototype.isCharacterDevice = function isCharacterDevice() {
    return this.stats.isCharacterDevice();
};

File.prototype.isSymbolicLink = function isSymbolicLink() {
    return this.stats.isSymbolicLink();
};

File.prototype.isFIFO = function isFIFO() {
    return this.stats.isFIFO();
};

File.prototype.isSocket = function isSocket() {
    return this.stats.isSocket();
};

File.prototype.size = function fileSize () {
    return filesize(this.stats.size, 2, false);
};

File.prototype.date = function fileDate() {
    if (this.timeObject)
        return this.timeObject;

    var mtime = this.stats.mtime;
    this.timeObject = {};
    this.timeObject.time = mtime.toLocaleTimeString();
    this.timeObject.date = mtime.toLocaleDateString();

    return this.timeObject;
};

File.prototype.getPath = function fileGetPath (browserSep) {
    browserSep = typeof browserSep === "undefined" ? false : browserSep;
    return this.collector.makeSafePath(this.path, browserSep);
};

/*
 * I hate this, and I feel like there has to be a better way. I freely admit
 * that I'm not an expert on file extensions.
 */
File.prototype.bootstrapIcon = function fileBootstrapIcon () {
    var iconClass = "hdd", // Default
        text = [ ".txt", ".doc", ".docx", ".rtf", ".pdf" ],
        archive = [ ".zip", ".rar", ".7z", ".dmg", ".gz" ],
        image = [ ".jpg", ".jpeg", ".png", ".gif", ".bmp" ],
        sound = [ ".mp3", ".wav", ".ape", ".flac", ".mp4", ".midi" ],
        video = [ ".avi", ".mkv", ".mov", ".hdmov", ".mpeg" ],
        extension = this.extension;

    if (extension === '')
        iconClass = "folder-open";
    else if (-1 !== text.indexOf(extension))
        iconClass = "align-justify";
    else if (-1 !== archive.indexOf(extension))
        iconClass = "compressed";
    else if (-1 !== image.indexOf(extension))
        iconClass = "picture";
    else if (-1 !== sound.indexOf(extension))
        iconClass = "music";
    else if (-1 !== video.indexOf(extension))
        iconClass = "film";

    return "glyphicon-" + iconClass;
};

/*
 *
 * FileCollector Object
 *
 */
module.exports = FileCollector = function FileCollector (directory, app) {
    var self = this,
        showHidden;

    Emitter.call(this);
    this.files = [];
    this.path = directory = decodeURI(directory);
    this.app = app;

    showHidden = app.get("showHiddenFiles");

    fs.exists(directory, function (exists) {
        if (!exists) {
            self.emit("notFound", self);
            return;
        }

        fs.stat(directory, function (err, stats) {
            if (err) throw err;

            // May as well save this information
            self.stats = stats;

            // Make sure we can send the correct paths to the File objects
            if (stats.isDirectory() && !directory.match(terminatingPathSepExp))
                directory += pathLib.sep;

            // This is a directory, and we should find the files in it
            if(stats.isDirectory()) {
                fs.readdir(directory, function (err, files) {
                    if (err) throw err;

                    i = 0;
                    len = files.length;
                    incompleteFiles = len;

                    // Create the file objects that belong to this collector
                    if (len) {
                        for (; i < len; i++) {
                            // Hide hidden files in unix unless we want to show them
                            if (files[i].charAt(0) !== '.' || showHidden) {
                                self.files.push(new File(directory + files[i], self, i));
                            } else {
                                if (--incompleteFiles <= 0)
                                    self.emit("ready", self);
                            }
                        }
                    } else
                        self.emit("ready", self);
                });
            } else { // This is a file, we can just get the info on it
                incompleteFiles = false;
                self.file = new File(directory, self, 0, stats);
                self.files = [ self.file ];
                self.emit("single", self.file);
            }
        });
    });

    return this;
};

FileCollector.init = function initFileCollector(directory, app) {
    return new FileCollector(directory, app);
};

FileCollector.File = File;
FileCollector.terminatingPathSep = terminatingPathSepExp;
FileCollector.globalPathSep = globalPathSepExp;

util.inherits(FileCollector, Emitter);

FileCollector.prototype.getPath = function fileCollectorGetPath (browserSep) {
    browserSep = typeof browserSep === "undefined" ? false : browserSep;
    return this.makeSafePath(this.path, browserSep);
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

    // There has to be a better way
    if (lastPart === '')
        lastPart = parts.pop();

    len = parts.length;

    // Get the bread crumbs before where we are right now
    for (; i < len; i++)
        parts[i] = getBreadCrumb(parts[i]);

    return { "parts": parts, "lastPart": getBreadCrumb(lastPart) };
};

FileCollector.prototype.makeSafePath = function makeSafePath(path, browserSep) {
    var root_dir = this.app.get("root_directory");
    path = path.replace(root_dir, '');

    if (pathLib.sep !== '/' && browserSep)
        path = path.replace(globalPathSepExp, '/');

    return path;
};
