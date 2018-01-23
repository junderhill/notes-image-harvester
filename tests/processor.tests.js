'use strict'

const expect = require('chai').expect;
const sinon = require('sinon');
const processor = require('../processor.js');

describe('Processor module', () =>{
    describe('readNote', ()=>{
        describe('when note contains an image', () =>{
            it('returns an array of markdown image tags', () =>{
                //arrange
                var imageMarkup = '![My image](https://www.google.co.uk/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png)';
                var noteText = `# Note title
                Some text
                ` + imageMarkup + `
                Some more text`;
                //act
                var result = processor.readNote(noteText);
                //assert
                expect(result).to.be.a('Array');
                expect(result[0]).to.equal(imageMarkup);
            });
        })


        describe('updateImageLocation', () =>{
            it('updates the contents of text file with new image location', ()=>{
                //arrange
                var imageMarkup = '![My image](https://www.google.co.uk/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png)';
                var newImageMarkup = '![My image](./images/googlelogo_color_272x92dp.png)';
                var noteText = `# Note title
                Some text
                ` + imageMarkup + `
                Some more text`;
                //act
                var updatedNoteText = processor.updateImageLocation(noteText, imageMarkup, newImageMarkup);
                //assert
                var expectedOutput = `# Note title
                Some text
                ` + newImageMarkup + `
                Some more text`;
                expect(updatedNoteText).to.equal(expectedOutput);
            });
        });

        
    });
});
