var config = require("nconf").file({ "file": __dirname + "/config.json" }),
    path = require("path"),
    pathSepExp = /[\\\/]$/,
    globalPathSepExp = /[\\\/]/g,
    root_dir = config.get("root_dir") || '';

if (root_dir.match(pathSepExp))
    root_dir = root_dir.replace(pathSepExp, '');

exports.root_dir = root_dir;
exports.pathSepExp = pathSepExp;
exports.globalPathSepExp = globalPathSepExp;
exports.config = config;