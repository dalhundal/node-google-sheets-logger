module.exports = (function() {

	var GoogleTokenProvider = require('refresh-token').GoogleTokenProvider;
	var request = require('request');
	var data2xml = require('data2xml')();
	var _ = require('underscore');
	var q = require('q');
	var moment = require('moment');

	var GoogleSheetsLogger = function(config) {
		config = _.defaults(_.isObject(config) ? config : {}, {
			clientId: undefined,
			clientSecret: undefined,
			fileId: undefined,
			refreshToken: undefined,
			sheetIndex: 1,
			dateFormat: 'DD/MM/YYYY HH:mm:ss'
		});

		// Check config is valid and all required parameters are present
		if (!_.isString(config.clientId)) throw new Error("cliendId is undefined or invalid");
		if (!_.isString(config.clientSecret)) throw new Error("clientSecret is undefined or invalid");
		if (!_.isString(config.fileId)) throw new Error("fileId is undefined or invalid");
		if (!_.isString(config.refreshToken)) throw new Error("refreshToken is undefined or invalid");
		if (!_.isNumber(config.sheetIndex)) throw new Error("sheetIndex is undefined or invalid");
		if (!_.isString(config.dateFormat)) throw new Error("dateFormat is undefined or invalid");

		// Clean up the File ID
		config.fileId = config.fileId.replace(/#.*$/, '');
		
		var tokenProvider = new GoogleTokenProvider({
			'refresh_token': config.refreshToken,
			'client_id': config.clientId,
			'client_secret': config.clientSecret
		});

		var getAccessToken = function() {
			var deferred = q.defer();
			tokenProvider.getToken(function(err, accessToken) {
				if (err) {
					deferred.reject(err);
				} else {
					deferred.resolve(accessToken);
				};
			});
			return deferred.promise;
		};

		this.log = function(fields) {
			var deferred = q.defer();
			var fieldsData = {
				_attr: {
					'xmlns' : "http://www.w3.org/2005/Atom",
					'xmlns:gsx': "http://schemas.google.com/spreadsheets/2006/extended",
				},
			};
			// Set the field values for the new data row
			for (var iColName in fields) {
				// Only allow alphanumeric field names - because I don't want to mess about with any more complexity!
				if (iColName.match(/^[a-z0-9]+$/i)) {
					var fieldValue = fields[iColName];
					if (_.isDate(fieldValue)) {
						// If the value is a data, use 'moment' to format it as a string
						fieldValue = moment(fieldValue).format(config.dateFormat);
					} else if (_.isArray(fieldValue) || _.isObject(fieldValue)) {
						// If the value is an object or array, JSONify it
						fieldValue = JSON.stringify(fieldValue);
					};
					//
					fieldsData['gsx:'+iColName] = fieldValue;
				};
			};
			//
			var fieldsXML = data2xml('entry',fieldsData);
			//
			getAccessToken().then(function(accessToken) {
				var postData = {
					'headers': {
						'Authorization': 'Bearer '+accessToken,
						'Content-Type': 'application/atom+xml'
					},
					'body': fieldsXML
				};
				//
				request.post('https://spreadsheets.google.com/feeds/list/'+config.fileId+'/'+config.sheetIndex+'/private/full?alt=json', postData, function(err, response, body) {
					if (err) {
						deferred.reject(err);
					} else {
						deferred.resolve(body)
					}
				});
				//
			}).catch(function(err) {
				deferred.reject(err);
			});
			return deferred.promise;
		};
	}

	return GoogleSheetsLogger;
})();