'use strict'

var fs = require('fs');
var request = require('request');

var processNote = function(fileLocation, callback){
	fs.readFile(fileLocation, 'utf8', function(err,data){
		if(err) throw err;

		var externalImages = module.exports.findExternalImages(data);
		for(var i = 0; i < externalImages.length; i++){
			var urlFromMarkdown = module.exports.extractUrlFromMarkdown(externalImages[i]);
			var newFilename = module.exports.generateNewFileName(urlFromMarkdown);

			request(urlFromMarkdown).pipe(fs.createWriteStream(newFilename));
		}
		
		callback();
	});
};

// Returns the external images in the note including there markdown syntax
var findExternalImages = function(noteContent){
	return noteContent.match(/!\[.*\]\([^\.].*\)/g);
};

var updateImageLocation = function(noteContent, originalImageMarkup, newImageMarkup){
	return noteContent.replace(originalImageMarkup, newImageMarkup);
};

var extractUrlFromMarkdown = function(markdown){
	var re = /(?:!\[.*]\()(.*)(?:\)$)/;
	return re.exec(markdown)[1];
}

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
	extractUrlFromMarkdown: extractUrlFromMarkdown,
	processNote: processNote
  }