'use strict'

var fs = require('fs');
var request = require('request');
var nock = require('nock');
var mock = require('mock-fs');
var expect = require('chai').expect;
var sinon = require('sinon');
var processor = require('../processor.js');

describe('Processor module', () => {
    describe('findExternalImages', () => {
        describe('when note contains an image', () => {
            it('returns an array of markdown image tags', () => {
                //arrange
                var imageMarkup = '![My image](https://www.google.co.uk/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png)';
                var noteText = `# Note title
                Some text
                ` + imageMarkup + `
                Some more text`;
                //act
                var result = processor.findExternalImages(noteText);
                //assert
                expect(result).to.be.a('Array');
                expect(result[0]).to.equal(imageMarkup);
            });
            it('only returns an array of external images', () => {
                //arrange
                var imageMarkups = ['![My image](https://www.google.co.uk/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png)',
                    '![My local image](./images/test.jpg'
                ];
                var noteText = `# Note title
                Some text
                ` + imageMarkups[0] + `
                blah blah
                ` + imageMarkups[1] + `
                Some more text`;
                //act
                var result = processor.findExternalImages(noteText);
                //assert
                expect(result.length).to.equal(1);
                expect(result[0]).to.equal(imageMarkups[0]);
            });
        })
    });

    describe('generateNewFileName', () => {
        var result = "";
        beforeEach(function () {

            //arrage
            var originalFilelocation = 'http://www.test.com/myimage.png';
            //act
            result = processor.generateNewFileName(originalFilelocation);
        });
        it('has the same extension as the original', () => {
            expect(result).to.be.a('string');
            var extension = result.substr(result.lastIndexOf('.') + 1);
            expect(extension).to.equal('png');
        });
        it('is prefixed with relative image directory', () => {
            expect(result.lastIndexOf('./images/', 0) === 0).to.be.true;
        });
        it('appends a timestamp to the end of the file', () => {
            var regex = RegExp('(?:_\d{10,12}\.([^.]+))?$');
            expect(regex.test(result)).to.be.true;
        });
    });

    describe('extractUrlFromMarkdown', () => {
        it('extracts the url from the image markdown',() => {
            var url = 'https://www.google.co.uk/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png';
            var data = `![Some alt text](${url})`;
            var result = processor.extractUrlFromMarkdown(data);
            expect(result).to.equal(url);
        });
    })

    describe('updateImageLocation', () => {
        it('updates the contents of text file with new image location', () => {
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

    describe('processNote', () => {
        it('loads the file contents', () => {
            var fsReadFile = sinon.stub(fs, 'readFile');
            processor.processNote('/Users/jason/testnote.md');
            sinon.assert.calledOnce(fsReadFile);
            fsReadFile.restore();
        });

        describe('once file is read', () => {
            var externalImagesReturn = [
                '![image alt](https://www.google.co.uk/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png)',
                '![image alt](http://i.dailymail.co.uk/i/sitelogos/logo_mol.gif)'];
            var findExternalImages; 
            before(function () {
                mock({
                    'path/to/some.md': `# Note header
                    Some note text
                    ![image alt](https://www.google.co.uk/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png)
                    some more text
                    ![image alt](http://i.dailymail.co.uk/i/sitelogos/logo_mol.gif)
                    `
                });
            });
            beforeEach(function(){
                findExternalImages = sinon.stub(processor, 'findExternalImages').returns(externalImagesReturn);
            });

            it('finds the external images in the file', (done) => {
                processor.processNote('path/to/some.md', function () {
                    sinon.assert.calledOnce(findExternalImages);
                    done();
                });
            });

            it('extracts the url from the image markdown', (done) => {
                var extractUrlFromMarkdown = sinon.spy(processor, 'extractUrlFromMarkdown');
                processor.processNote('path/to/some.md', function () {
                    sinon.assert.callCount(extractUrlFromMarkdown, externalImagesReturn.length);
                    extractUrlFromMarkdown.restore();
                    done();
                });
            });

            it('generates a new filename for the external images', (done) =>{
                var generateNewFileName = sinon.spy(processor, 'generateNewFileName');
                processor.processNote('path/to/some.md', function () {
                    sinon.assert.callCount(generateNewFileName, externalImagesReturn.length);
                    generateNewFileName.restore();
                    done();
                });
            });

            it('downloads the file to its new filename', (done) => {
                var generateNewFileName = sinon.stub(processor, 'generateNewFileName').returns('./test.png')
                    nock(/^https?.*/)
                    .get(/.*\.[a-z]{3,4}$/)                
                    .reply(200, 'somedata');
                processor.processNote('path/to/some.md', function () {
                    if(!fs.existsSync('/test.png')){
                        expect.fail("","",'Test file hasnt been written');
                    }
                    generateNewFileName.restore();
                    done();
                });
            });

            afterEach(function() {
                findExternalImages.restore();
            });
            after(function () {
                mock.restore();
            });
        });

    });


});