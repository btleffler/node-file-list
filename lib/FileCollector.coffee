pathLib = require "path"
fs = require "fs"
Emitter = require("events").EventEmitter
util = require "util"
filesize = require "filesize"
terminatingPathSepExp = /[\\\/]$/
globalPathSepExp = /[\\\/]/g

##
# File Object
##

class File extends Emitter
	constructor: (path, collector, index, stats) ->
		self = this

		Emitter.call this

		this.collector = collector
		this.index = index
		this.path = path
		this.name = pathLib.basename path
		this.extension = pathLib.extname this.name
		this.stats = stats

		finish = () ->
			self.emit "ready", self

			if incompleteFiles != false
				if --incompleteFiles <= 0
					self.collector.emit "ready", self.collector

		fs.exists path, (exists) ->
			# Huh?
			if not exists
				self.destroy()
				finish()
				return console.log("Something is wrong with this. " + path)

			if self.stats
				finish()
			else
				fs.stat path, (err, stats) ->
					if err
						console.log err
						self.destroy()

					self.stats = stats
					finish()

		this

	# Remove this file from its collector
	destroy: () ->
		this.collector.files.splice this.index, 1

	isBlockDevice: () ->
		this.stats.isBlockDevice()

	isCharacterDevice: () ->
		this.stats.isCharacterDevice()

	isSymbolicLink: () ->
		this.stats.isSymbolicLink()

	isFIFO: () ->
		this.stats.isFIFO()

	isSocket: () ->
		this.stats.isSocket()

	size: () ->
		filesize this.stats.size, 2, false

	date: () ->
		if (this.timeObject)
			return this.timeObject

		mtime = this.stats.mtime
		timeObject = {}
		timeObject.time = mtime.toLocaleTimeString()
		timeObject.date = mtime.toLocaleDateString()

		return this.timeObject = timeObject

	getPath: (browserSep) ->
		browserSep = if typeof browserSep == "undefined" then false else browserSep
		this.collector.makeSafePath this.path, browserSep

	##
	# I hate this, and I feel like there has to be a better way. I freely admit
	# that I'm not an expert on file extensions.
	##
	bootstrapIcon: () ->
		iconClass = "hdd" # Default
		text = [ ".txt", ".doc", ".docx", ".rtf", ".pdf" ]
		archive = [ ".zip", ".rar", ".7z", ".dmg", ".gz" ]
		image = [ ".jpg", ".jpeg", ".png", ".gif", ".bmp" ]
		sound = [ ".mp3", ".wav", ".ape", ".flac", ".mp4", ".midi" ]
		video = [ ".avi", ".mkv", ".mov", ".hdmov", ".mpeg" ]
		extension = this.extension

	if extension == ''
		iconClass = "folder-open";
	else if -1 != text.indexOf extension
		iconClass = "align-justify";
	else if -1 != archive.indexOf extension
		iconClass = "compressed";
	else if -1 != image.indexOf extension
		iconClass = "picture";
	else if -1 != sound.indexOf extension
		iconClass = "music";
	else if -1 != video.indexOf extension
		iconClass = "film";

	"glyphicon-" + iconClass

File.init = (path, collector, index, stats) ->
	new File path, collector, index, stats

util.inherits File, Emitter

##
# FileCollector Object
##
class FileCollector extends Emitter
	constructor: (directory, app) ->
		self = this
		showHidden = app.get "showHiddenFiles"

		Emitter.call this
		this.files = []
		this.path = directory = decodeURI directory
		this.app = app

		fs.exists directory, (exists) ->
			if not exists
				return self.emit "notFound", self

			fs.stat directory, (err, stats) ->
				if err
					throw err

				# May as well save this information
				self.stats = stats

				# Make sure we can send the correct paths to the File objects
				if stats.isDirectory() and not directory.match terminatingPathSepExp
					directory += pathLib.sep

				# This is a directory, and we should find the files in it
				if stats.isDirectory()
					fs.readdir directory, (err, files) ->
						if err
							throw err

						incompleteFiles = files.length

						# Create the file objects that belong to this collector
						add = (file) ->
							# Hide hidden files in unix unless we want to show them
							if file.charAt 0 != '.' or showHidden
								self.files.push(new File directory + files[i], self, i)
							else
								if --incompleteFiles <= 0
									self.emit "ready", self

						if len
							add file for file in files
						else
							self.emit "ready", self
				else
					# This is a file, we can just get the info on it
					incompleteFiles = false
					self.file = new File directory, self, 0, state
					self.files = [ self.file ]
					self.emit "single", self.file

		this

	getPath: (browserSep) ->
		browserSep = if typeof browserSep == "undefined" then false else browserSep
		this.makeSafePath this.path, browserSep

	getBreadCrumbs: () ->
		self = this
		path = this.getPath()

		getBreadCrumb = (part) ->
			name = part or pathLib.sep

			{
				"name": name,
				"path": path.substring(0, path.indexOf(name) + name.length)
			}

		# Special case
		if path == pathLib.sep
			return {
				"parts": [],
				"lastPart": getBreadCrumb(pathLib.sep)
			}

		parts = path.split pathLib.sep
		i = 0
		lastPart = parts.pop()

		# There has to be a better way
		if lastPart == ''
			lastPart = parts.pop

		len = parts.length

		# Get the bread crumbs before where we are right now
		parts = (getBreadCrumb part for part in parts)

		{ "parts": parts, "lastPart": getBreadCrumb lastPart }

	makeSafePath: (path, browserSep) ->
		root_dir = this.app.get "root_directory"
		path = path.replace root_dir, ''

		if pathLib.sep != '/' and browserSep
			path = path.replace globalPathSepExp, '/'

		path

FileCollector.init = (directory, app) ->
	new FileCollector directory, app

FileCollector.File = File
FileCollector.terminatingPathSep = terminatingPathSepExp
FileCollector.globalPathSep = globalPathSepExp

util.inherits FileCollector, Emitter

module.exports = FileCollector
