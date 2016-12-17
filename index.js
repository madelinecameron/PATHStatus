var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');

module.exports.scrape = function (event, context, callback) {
    var url = 'http://rss.paalerts.com/rss.aspx?PATH';
    var events = [];

    request(url, function(error, response, html){
        if(!error){
            var $ = cheerio.load(html);

            $('item').each(function (index, elem) {
                var description = $(this).children('description').text()
                events.push({
                    date: $(this).children('pubDate').text(),
                    description: description,
                    affectedLine: guessLine(description),
                    status: guessStatus(description)
                })
            });

            return context.succeed({
                body: JSON.stringify(events),
                statusCode: 200,
                headers: {}
            });
        }
        else {
            console.log("Error occurred:", error)
            return callback(error);
        }
    });
}

function guessLine(description) {
    const lines = [
        'HOB-WTC',
        'NWK-WTC',
        'HOB-33',
        'JSQ-33',
    ];

    return lines.filter(function (line) {
        return description.indexOf(line) > -1
    })[0]
}

function guessStatus(description) {
    if(new RegExp('(resum(e|ing|ed)+)|(open(ed|ing){1})').test(description)) {
        return 'OPEN';
    }

    if(new RegExp('(delay(ed|s|ing)+)').test(description)) {
        return 'DELAY';
    }

    if(new RegExp('(stop(ed|ing)+)|(clos(e|ed|ing)+)').test(description)) {
        return 'CLOSE';
    }

}