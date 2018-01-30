'use strict'

var fs = require('fs');
var expect = require('chai').expect;
var sinon = require('sinon');
var httpreq = require('httpreq')
var processor = require('../processor.js');

describe('Processor module', () => {
    var sandbox;
    beforeEach(function () {
        sandbox = sinon.sandbox.create();
    });

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
        it('extracts the url from the image markdown', () => {
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
        var noteText =
            `# Note header
            Some note text
            some more text
            ![image alt](http://i.dailymail.co.uk/i/sitelogos/logo_mol.gif)
            `;
        var httpLib = null;
            
        beforeEach(function() {
            var httpResponse = {
                statusCode: 200,
                headers: {},
                body: 'somedata'
            };
            httpLib = sandbox.stub(httpreq, 'download').callsArgWith(3,null,httpResponse);
        });

        it('loads the file contents', () => {
            var fsReadFile = sandbox.stub(fs, 'readFile').yields(null, noteText);
            processor.processNote('/Users/jason/testnote.md', fs, function () {
                sandbox.assert.calledOnce(fsReadFile);
                fsReadFile.restore();
            });
        });

        describe('once file is read', () => {
            it('finds the external images in the file', (done) => {
                var mockfs = sandbox.stub(fs, 'readFile');
                mockfs.yields(null, noteText);
                var findExternalImages = sandbox.spy(processor, 'findExternalImages');
                processor.processNote('path/to/some.md', fs, function () {
                    sandbox.assert.calledOnce(findExternalImages);
                    findExternalImages.restore();
                    done();
                });
            });

            it('extracts the url from the image markdown', (done) => {
                var mockfs = sandbox.stub(fs, 'readFile');
                mockfs.yields(null, noteText);
                var extractUrlFromMarkdown = sandbox.spy(processor, 'extractUrlFromMarkdown');
                processor.processNote('path/to/some.md', fs, function () {
                    sandbox.assert.callCount(extractUrlFromMarkdown, 1);
                    done();
                });
            });

            it('generates a new filename for the external images', (done) => {
                var mockfs = sandbox.stub(fs, 'readFile');
                mockfs.yields(null, noteText);
                var generateNewFileName = sandbox.spy(processor, 'generateNewFileName');
                processor.processNote('path/to/some.md', fs, function () {
                    sandbox.assert.callCount(generateNewFileName, 1);
                    done();
                });
            });


            it('downloads the files', (done) => {
                var fsReadFile = sandbox.stub(fs, 'readFile').yields(null, noteText);
                var generateNewFileName = sandbox.stub(processor, 'generateNewFileName').returns('./test.png');

                processor.processNote('path/to/some.md', fs, function () {
                    sandbox.assert.callCount(httpLib, 1);
                    done();
                });
            });

        });

    });
    afterEach(function () {
        sandbox.restore();
    });
});