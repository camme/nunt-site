
// Config file for the project. Holds password and keys for different services

var fs = require('fs');

var configFile = './config.json';
var config = {};

if (!fs.existsSync(configFile)) {
    fs.writeFileSync(configFile, '{}', 'utf8');
}

config = JSON.parse(fs.readFileSync(configFile));

exports.config = config;

exports.save = function() {
    fs.writeFileSync(configFile, JSON.stringify(config, '', '    '), 'utf8');
}
