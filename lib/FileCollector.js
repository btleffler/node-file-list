var Path = require("path"),
  Fs = require("fs"),
  Emitter = require("events").EventEmitter,
  Util = require("util"),
  Exec = require("child_process").exec,
  Os = require("os"),
  filesize = require("filesize"),
  Async = require("async"),
  terminatingPathSepExp = /[\\\/]$/,
  globalPathSepExp = /[\\\/]/g,
  File, FileCollector;

var WINDOWS = Os.platform() === "win32";

/*
 *
 * File Object
 *
 */
File = function File(path, collector, index, stats, finish) {
  var self = this;

  Emitter.call(this);

  this.collector = collector;
  this.index = index;
  this.path = path;
  this.name = Path.basename(path);
  this.extension = Path.extname(this.name);
  this.stats = stats;

  // This may just be a single file, with no callback
  finish = finish || function () {};

  function determineHidden () {
    var cmd = "cscript " + Path.join(__dirname, "whf.js") + ' ' + self.path +
      " //Nologo";

    if (WINDOWS) {
      // Node.js doesn't have a decent way to figure out whether or not
      // files are hidden in Windows, running a child process is a good
      // workaround for now.
      return Exec(cmd, function (error, stdout, stderr) {
        if (error || stderr) {
          self.destroy();
          finish();

          if (error) {
            return console.log(error);
          }

          if (stderr) {
            return console.log(stderr);
          }
        }

        // "0" = Not hidden on Windows
        // "-1" = Hidden on Windows
        self.stats.windowsHidden = stdout.trim() === "-1";

        finish();
      });
    }

    // We're not on Windows, so this attribute doesn't matter
    self.stats.windowsHidden = false;
    finish();
  }

  if (self.stats) {
    determineHidden();
  } else {
    Fs.stat(path, function (err, stats) {
      if (err) {
        console.log(err.stack);
        self.destroy();
      }

      self.stats = stats;
      determineHidden();
    });
  }

  return this;
};

File.init = function initFile(path, collector, index, stats) {
  return new File(path, collector, index, stats);
};

Util.inherits(File, Emitter);

// Remove this file from its collector
File.prototype.destroy = function FileDestory() {
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

File.prototype.size = function fileSize() {
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

File.prototype.getPath = function fileGetPath(browserSep) {
  browserSep = typeof browserSep === "undefined" ? false : browserSep;
  return this.collector.makeSafePath(this.path, browserSep);
};

File.prototype.isHidden = function fileIsHidden () {
  if (WINDOWS) {
    return this.windowsHidden;
  }

  return this.path.split(Path.sep).some(function (part) {
    if (part.charAt(0) === '.') {
      return true;
    }

    return false;
  });
};

/*
 * I hate this, and I feel like there has to be a better way. I freely admit
 * that I'm not an expert on file extensions.
 */
File.prototype.bootstrapIcon = function fileBootstrapIcon() {
  var iconClass = "hdd", // Default
    text = [".txt", ".doc", ".docx", ".rtf", ".pdf"],
    archive = [".zip", ".rar", ".7z", ".dmg", ".gz"],
    image = [".jpg", ".jpeg", ".png", ".gif", ".bmp"],
    sound = [".mp3", ".wav", ".ape", ".flac", ".mp4", ".midi"],
    video = [".avi", ".mkv", ".mov", ".hdmov", ".mpeg"],
    extension = this.extension;

  if (extension === '') {
    iconClass = "folder-open";
  } else if (-1 !== text.indexOf(extension)) {
    iconClass = "align-justify";
  } else if (-1 !== archive.indexOf(extension)) {
    iconClass = "compressed";
  } else if (-1 !== image.indexOf(extension)) {
    iconClass = "picture";
  } else if (-1 !== sound.indexOf(extension)) {
    iconClass = "music";
  } else if (-1 !== video.indexOf(extension)) {
    iconClass = "film";
  }

  return "glyphicon-" + iconClass;
};

/*
 *
 * FileCollector Object
 *
 */
module.exports = FileCollector = function FileCollector(directory, app) {
  var self = this,
    showHidden, isHidden;

  Emitter.call(this);
  this.files = [];
  this.path = directory = decodeURI(directory);
  this.app = app;

  function finish () {
    Fs.stat(directory, function (err, stats) {
      if (err) {
        console.log(directory + ":\n", err.stack);
        self.emit("notFound", self);

        return;
      }

      if (isHidden && !showHidden) {
        return self.emit("notFound", self);
      }

      // May as well save this information
      self.stats = stats;

      // This is a directory, and we should find the files in it
      if (stats.isDirectory()) {
        // Make sure we can send the correct paths to the File objects
        if (!directory.match(terminatingPathSepExp)) {
          directory += Path.sep;
        }

        Fs.readdir(directory, function (err, files) {
          if (err) {
            console.log(err.stack);
            self.emit("notFound", self);

            return;
          }

          // Create the file objects that belong to this collector
          if (files.length) {
            Async.forEachOf(files, function (path, i, cb) {
              var file = new File(
                Path.join(directory, path),
                self,
                i,
                false,
                function () {
                  if (showHidden || !(showHidden || file.isHidden())) {
                    self.files.push(file);
                  }

                  return cb();
                }
              );
            }, function () {
              self.emit("ready", self);
            });
          } else {
            self.emit("ready", self);
          }
        });
      } else { // This is a file, we can just get the info on it
        self.file = new File(directory, self, 0, stats);
        self.files = [ self.file ];
        self.emit("single", self.file);
      }
    });
  }

  showHidden = app.get("showHiddenFiles");

  // If we aren't showing hidden files,
  // emit notFound events for hidden paths
  if (!showHidden) {
    if (WINDOWS) {
      Exec(cmd, function (error, stdout, stderr) {
        if (error || stderr) {
          self.destroy();
          finish();

          if (error) {
            return console.log(error);
          }

          if (stderr) {
            return console.log(stderr);
          }
        }

        // "0" = Not hidden on Windows
        // "-1" = Hidden on Windows
        isHidden = stdout.trim() === "-1";

        finish();
      });
    } else {
      isHidden = directory.split(Path.sep).some(function (part) {
        if (part.charAt(0) === '.') {
          return true;
        }

        return false;
      });

      finish();
    }
  } else {
    finish();
  }

  return this;
};

FileCollector.init = function initFileCollector(directory, app) {
  return new FileCollector(directory, app);
};

FileCollector.File = File;
FileCollector.terminatingPathSep = terminatingPathSepExp;
FileCollector.globalPathSep = globalPathSepExp;

Util.inherits(FileCollector, Emitter);

FileCollector.prototype.getPath = function fileCollectorGetPath(browserSep) {
  browserSep = typeof browserSep === "undefined" ? false : browserSep;
  return this.makeSafePath(this.path, browserSep);
};

FileCollector.prototype.getBreadCrumbs = function getBreadCrumbs() {
  var self = this,
    path = this.getPath(),
    parts, i, len, part, lastPart;

  function getBreadCrumb(part) {
    var name = part || Path.sep;

    return {
      "name": name,
      "path": path.substring(0, path.indexOf(name) + name.length)
    };
  }

  // Special case
  if (path === Path.sep) {
    return {
      "parts": [],
      "lastPart": getBreadCrumb(Path.sep)
    };
  }

  parts = path.split(Path.sep);
  i = 0;
  lastPart = parts.pop();

  // There has to be a better way
  if (lastPart === '') {
    lastPart = parts.pop();
  }

  len = parts.length;

  // Get the bread crumbs before where we are right now
  for (; i < len; i++) {
    parts[i] = getBreadCrumb(parts[i]);
  }

  return {
    "parts": parts,
    "lastPart": getBreadCrumb(lastPart)
  };
};

FileCollector.prototype.makeSafePath = function (path, browserSep) {
  console.log(path, browserSep);
  var root_dir = this.app.get("root_directory");
  path = path.replace(root_dir, '');

  console.log(path);

  if (Path.sep !== '/' && browserSep) {
    path = path.replace(globalPathSepExp, '/');
    console.log(path);
  }

  return path;
};
