var moment = require('moment');
var everyauth = require('everyauth');
var settings = require('../settings.js');
var config = settings.config;
var tags = ['#unicorn', '#nodejs', '#javascript'];
var TwitterSearcher = require('./twitter-searcher').TwitterSearcher;
var ts = new TwitterSearcher(tags, settings.config.twitter);

var nunt = require('nunt');

var stats = {};

nunt.on(nunt.READY, init);

nunt.on(nunt.CONNECTED, function(e) {

    nunt.send("twitter.update.stats", {sessionId: e.sessionId, stats: stats});

});

function init(e) {

    console.log("Twitter searching started...");

    // Create a map of all tags that we are looking for
    var validHashTags = {};
    for(var i = 0, ii = tags.length; i < ii; i++){
        validHashTags[tags[i].replace(/#/g, '').toLowerCase()] = true;
    }

    // Start the search
    ts.start(15000, function(err, result) {

        var since = result.search_metadata.max_id;

        ts.since = null;

        stats = {};

        //settings.config.twitter.since = since;
        //settings.save();

        if (err) {
            console.log(err);
            return;
        }

        for(var i = 0, ii = result.statuses.length; i < ii; i++){

            var tweet = result.statuses[i];
            var date = moment(tweet.created_at).format("YYYY-MM-DD");
            var entities = tweet.entities;
            var hashtags = entities.hashtags;

            hashtags.forEach(function(tag) {
                var currentTag = tag.text.toLowerCase();
                if (validHashTags[currentTag]) {
                    if (!stats[date]) {
                        stats[date] = {};
                    }
                    if (!stats[date][currentTag]) {
                        stats[date][currentTag] = 0;
                    }
                    stats[date][currentTag]++;
                }
            });
        }

        stats.since = since;

        console.log(stats);
        nunt.send("twitter.update.stats", {cache: false, stats: stats});

    });

}

everyauth.everymodule.findUserById(function (user, callback) {
    callback();
});

// Set up the oauth via everyuath
everyauth.twitter.consumerKey(config.twitter.key)
everyauth.twitter.consumerSecret(config.twitter.secret) 
everyauth.twitter.redirectPath('/');
everyauth.twitter.findOrCreateUser( function (session, accessToken, accessTokenSecret, twitterUserMetadata) {

    //console.log(session, accessToken, accessTokenSecret);
    settings.config.twitter.accessToken = accessToken;
    settings.config.twitter.accessTokenSecret = accessTokenSecret;
    settings.save();

    // Now we have the tokens, start the search
    if (!runningSearches) {
        startTwitterSearch();
    }

    return {id: 1};

})


