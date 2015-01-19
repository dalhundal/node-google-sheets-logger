Node-Google-Sheets-Logger
=========================

NodeJS module to allow quick and easy data logging to Google Sheets using OAuth credentials

## Installation

    npm install node-google-sheets-logger --save

## Usage

    var GoogleSheetsLogger = require('node-google-sheets-logger');

    var googleSheetsLogger = new GoogleSheetsLogger({
        'clientId': '<YOUR-CLIENT-ID>',
        'clientSecret': '<YOUR-CLIENT-SECRET>',
        'fileId': '<YOUR-FILE-ID>',
        'refreshToken': '<YOUR-REFRESH-TOKEN>'
    });

    googleSheetsLogger.log({
        when: new Date(),
        what: 'Something happened',
        count: 10,
        dataArray: ['A','B','C',1,2,3],
        dataObject: {
            foo: 'bar',
            wat: 'boo'
        }
    }).then(function() {
        console.log("The stuff was logged as a new row to your spreadsheet!");
    }).catch(function(err) {
        console.log("FAILED WITH ERROR: ", err)
    });