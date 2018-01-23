'use strict'

const fs = require('fs');

exports.processNote = function(fileLocation){
	fs.readFile(fileLocation, function(err,data){
		if(err) throw err;

		var externalImages = findExternalImages(data);
	});
};

exports.findExternalImages = function(noteContent){
	return noteContent.match(/!\[.*\]\([^\.].*\)/g);
};

exports.updateImageLocation = function(noteContent, originalImageMarkup, newImageMarkup){
	return noteContent.replace(originalImageMarkup, newImageMarkup);
};

exports.generateNewFileName = function(location){
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