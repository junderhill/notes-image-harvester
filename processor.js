'use strict'

const fs = require('fs');

var processNote = function(fileLocation, callback){
	fs.readFile(fileLocation, 'utf8', function(err,data){
		if(err) throw err;

		var externalImages = module.exports.findExternalImages(data);
		for(var i = 0; i < externalImages.length; i++){
			var newFilename = module.exports.generateNewFileName(externalImages[i]);
		}
		
		callback();
	});
};

var findExternalImages = function(noteContent){
	return noteContent.match(/!\[.*\]\([^\.].*\)/g);
};

var updateImageLocation = function(noteContent, originalImageMarkup, newImageMarkup){
	return noteContent.replace(originalImageMarkup, newImageMarkup);
};

var generateNewFileName = function(location){
	var filename = extractFilenameFromLocation(location);
	filename = appendTimestampToFilename(filename);
	return './images/' + filename;
};

function extractFilenameFromLocation(location){
	var re = /[^/\\&\?]+\.\w{3,4}(?=([\?&].*$|$))/;
	return re.exec(location)[0];
}

function appendTimestampToFilename(filename){
	var extension = filename.substr(filename.lastIndexOf('.')+1);
	var withoutExtension = filename.substr(0, filename.lastIndexOf('.'));
	var secondsSinceEpoch = Math.round(new Date().getTime() / 1000);
	return withoutExtension + '_' + secondsSinceEpoch + '.' + extension;
}

module.exports = {
	generateNewFileName: generateNewFileName,
	updateImageLocation: updateImageLocation,
	findExternalImages: findExternalImages,
	processNote: processNote
  }