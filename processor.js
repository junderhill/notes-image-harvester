'use strict'

exports.readNote = function(noteContent){
	return noteContent.match(/!\[.*\](.*)/g);
};

exports.updateImageLocation = function(noteContent, originalImageMarkup, newImageMarkup){
	return noteContent.replace(originalImageMarkup, newImageMarkup);
}
