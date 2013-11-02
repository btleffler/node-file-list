#!/usr/bin/env node

var program = require("commander"),
    fs = require("fs"),
    path = require("path"),
    pathSepExp = require("../lib/FileCollector.js").terminatingPathSep,
    fileList = require("../lib");

program.version("0.2.0");

program
    .command("serve")
    .description("Serve a directory")
    .option("-r, --root [directory]", "root directory to be served", path.normalize)
    .option("-p, --port [port]", "port to listen to", parseInt)
    .action(function (options) {
        var root = options.root || process.cwd(),
            port = options.port || 3000;
        root = root.replace(pathSepExp, '');
        fileList.cli.startServer(root, port);
    });

program.parse(process.argv);
