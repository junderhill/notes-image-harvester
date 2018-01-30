'use strict'

var FileHound = require('filehound');

var findMarkdownFiles = function(directory,callback){

    var files = FileHound.create()
    .paths(directory)
    .ext('md')
    .find();
    
    callback(files);
}


module.exports = {
    findMarkdownFiles: findMarkdownFiles
}