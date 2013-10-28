#!/usr/bin/env node

var program = require("commander"),
    fs = require("fs"),
    path = require("path"),
    pathSepExp = require("../lib/FileCollector.js").terminatingPathSep,
    fileList = require("../lib");

program.version("0.1.0");

program
    .command("serve")
    .description("Serve a directory")
    .option("-r, --root [directory]", "root directory to be served", path.normalize)
    .action(function (options) {
        var root = options.root || process.cwd();
        root = root.replace(pathSepExp, '');
        fileList.cli.startServer(root);
    });

program.parse(process.argv);
