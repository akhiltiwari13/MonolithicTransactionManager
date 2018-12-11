require("babel-register");
require("babel-polyfill");

var lib = require("./src/lib");

lib.app.start();
