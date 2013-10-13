#!/usr/bin/env node

var program = require("commander"),
    fs = require("fs"),
    path = require("path"),
    config = require("../lib/config"),
    pathSepExp = config.pathSepExp,
    fileList = require("../lib/file-list.js");

config = config.config;

program
    .version("0.0.1")
    .option("-r, --root [directory]", "root directory to be served", path.normalize);

program
    .command("serve")
    .description("Serve a directory")
    .option("-r, --root [directory]", "rood directory to be served", path.normalize)
    .action(function (options) {
        var root = options.root || config.root || process.cwd();
        root = root.replace(pathSepExp, '');
        fileList.startServer(root);
    });

program.parse(process.argv);

if (program.root === true)
    if (typeof config.get("root_dir") !== "undefined")
       console.log(config.get("root_dir"));

if (typeof program.root === "string") {
    config.set("root_dir", program.root.replace(pathSepExp, ''));
    config.save();
}
