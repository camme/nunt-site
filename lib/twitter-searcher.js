var URL = require('url');
var https = require("https"), querystring = require("querystring"), crypto=require("crypto");
//var RestClient = require('./rest-client').RestClient;

// TwitterSearcher
// ---------------
// Responsible for searching Twitter for certain terms
// Pass a list of arguments to search for
//
//     var ts = new TwitterSearch('lemon', 'apple', 'orange');

var TwitterSearcher = exports.TwitterSearcher = function(terms, twitterData) {
    this.term = terms.join(" OR ");
    this.baseUrl = 'https://api.twitter.com/1.1';
    this.since = null;
    this.timeoutRef = -1;
    this.timeout = 5000;
    this.callback = function() {};
    this.runs = 0;
    this.runsWithError = 0;
    this.maxErrors = 10;
    this.twitterData = twitterData;
    this.http = (this.baseUrl.indexOf('https') > -1) ? require('https') : require('http');
};

// ### Start the TwitterSearcher
// @timeout The waiting time between calls in ms

TwitterSearcher.prototype.start = function(timeout, callback) {
    clearTimeout(this.timeoutRef);
    this.timeout = timeout;
    this.callback = callback;
    this.searchTimerLoop();
};

TwitterSearcher.prototype.stop = function() {
    clearTimeout(this.timeoutRef);
}

TwitterSearcher.prototype.searchTimerLoop = function() {
    var self = this;

    self.search(self.term, function(err, result) {
        if (result.errors) {
            err = result;
            result = null;
        }
        if (err) {
            self.runsWithError++;
            if (self.runsWithError >= self.maxErrors) {
                if(self.callback && typeof self.callback == 'function') {
                    self.callback({fatal: "too many runs with errors"});
                }
            }
        }
        else {
            self.runsWithError = 0;
            result._twitterSearcher = { runs: self.runs };
        }
        if(self.callback && typeof self.callback == 'function') {
            self.callback(err, result);
        }
        self.runs++;
        clearTimeout(self.timeoutRef);
        self.timeoutRef = setTimeout(self.searchTimerLoop.bind(self), self.timeout);
    });
}

// ### Search
// Makes an individual search call

TwitterSearcher.prototype.search = function(term, callback) {

    var self = this;
    var params = {
        'lang': 'en',
        'include_entities': true,
        'q': term,
        count: 100
    };
   
    if(self.since) {
        params['since_id'] = self.since;
    }

    var url = this.baseUrl + "/search/tweets.json";
    var urlObjectForOauthSign = URL.parse(url);


    //var requestUrl = URL.parse(url);
    //'https://api.twitter.com/1.1/search/tweets.json');
    urlObjectForOauthSign.method = 'get';


    var oauthHeader = getOauthData(urlObjectForOauthSign, this.twitterData.key, this.twitterData.accessToken, params, this.twitterData.secret, this.twitterData.accessTokenSecret);

    url += "?" + querystring.stringify(params);

    var urlObject = URL.parse(url);

    urlObject.headers = {
        'Authorization': "OAuth" + oauthHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
    };

    this.get(urlObject, function(err, result) {
        if(err && callback && typeof callback == 'function') {
            callback(err);
        } else {
            if (result.errors) {
                callback(result);
            }
            else {
                self.since = result.search_metadata.max_id;
                callback(null, result);
            }
        }
    });

};

TwitterSearcher.prototype.get = function(url, callback) {

    this.http.get(url, function(res) {

        var data = "";

        res.on('data', function(chunk) {
            data += chunk.toString();
        });

        res.on('end', function() {
            var json = {};
            var err = null;
            try {
                json = JSON.parse(data);
            }
            catch (parseError) {
                err = {'message': "json parsing failed", err: parseError}; 
            }

            callback(err, json);
        });
    }).on('error', function(e) {
        callback(e);
    });

}


function getOauthData(url, key, token, data, consumerSecret, accessSecret) {

    var buf = crypto.randomBytes(32);
    var nonce = buf.toString('base64');
    var oauthData = {
        oauth_consumer_key: key,
        oauth_nonce: nonce, 
        oauth_signature_method: "HMAC-SHA1", 
        oauth_timestamp: Math.round(new Date().getTime() / 1000),
        oauth_token: token, 
        oauth_version: "1.0" 
    };

    var sigData = {};
    for (var k in oauthData){
        sigData[k] = oauthData[k];
    }
    for (var k in data){
        sigData[k] = data[k];
    }
    var sig = generateOAuthSignature(url.method, "https://" + url.host + url.path, sigData, consumerSecret, accessSecret);
    oauthData.oauth_signature = sig;

    var oauthHeader = "";
    for (var k in oauthData){
        oauthHeader += ", " + encodeURIComponent(k) + "=\"" + encodeURIComponent(oauthData[k]) + "\"";
    }
    oauthHeader = oauthHeader.substring(1);
    return oauthHeader;
}


function generateOAuthSignature(method, url, data, consumerSecret, accessSecret){
    var signingToken = encodeURIComponent(consumerSecret) + "&" + encodeURIComponent(accessSecret);

    var keys = [];
    for (var d in data){
        keys.push(d);
    }
    keys.sort();
    var output = method.toUpperCase() + "&" + encodeURIComponent(url) + "&";
    var params = "";
    keys.forEach(function(k){
        params += "&" + encodeURIComponent(k) + "=" + encodeURIComponent(data[k]);
    });
    params = encodeURIComponent(params.substring(1));

    return hashString(signingToken, output+params, "base64");
}

function hashString(key, str, encoding){
    var hmac = crypto.createHmac("sha1", key);
    hmac.update(str);
    return hmac.digest(encoding);
}



