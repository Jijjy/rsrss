const https = require('https');
const http = require('http');
const xml2js = require('xml2js');
const h2p = require('html2plaintext')
var parser = new xml2js.Parser();

const oneMinute = 60000;
const updateInterval = 15 * oneMinute;
const maxArticleCount = 500;

const feedUrls = [
    'https://www.polygon.com/rss/index.xml',
    'http://feeds.bbci.co.uk/news/rss.xml',
    'https://www.popsci.com/rss.xml',
    'https://gizmodo.com/rss',
    'https://www.engadget.com/rss.xml',
    'https://lifehacker.com/rss',
    'https://www.wired.co.uk/rss/article',
    'https://www.reddit.com/r/worldnews/.rss',
    'https://www.reddit.com/r/technology/.rss',
    'https://www.reddit.com/r/science/.rss',
    'https://www.theregister.co.uk/headlines.atom'
];

var articles = {};

function cull() {
    var keys = Object.keys(articles);
    if (keys.length < maxArticleCount) return;
    console.info(`culling ${keys.length - maxArticleCount} articles.`);
    keys.sort((a, b) => articles[a].pubdate - articles[b].pubdate).slice(0, keys.length - maxArticleCount).forEach(k => delete articles[k]);
}

function getValue(e) {
    return !e ? null : Array.isArray(e) ? (e[0]._ || e[0]) : e;
}

function getPubDate(e) {
    if (e.published)
        return new Date(getValue(e.published));

    if (e.pubDate)
        return new Date(getValue(e.pubDate));

    if (e.updated)
        return new Date(getValue(e.updated));

    console.warn(e);
    return new Date();
}

function processResult(url, result) {
    try {
        if (result.feed) {
            result.feed.entry.forEach(e => {
                let id = getValue(e.id);
                articles[id] = {
                    id: id,
                    title: getValue(e.title),
                    content: h2p((e.summary || e.content)[0]._),
                    link: e.link[0].$.href,
                    pubdate: getPubDate(e)
                };
            });
        } else if (result.rss) {
            result.rss.channel[0].item.forEach(e => {
                articles[e.guid[0]] = {
                    id: e.guid,
                    title: e.title,
                    content: h2p(e.description),
                    link: e.link[0],
                    pubdate: getPubDate(e)
                };
            });
        }
    } catch (e) {
        console.error('failed processing data from ' + url, result, e);
    } finally {
        console.log('finished processing data from ' + url);
    }
}

(function scan() {
    feedUrls.forEach(u => {
        console.log('checking ' + u);
        (u.startsWith('https') ? https : http).get(u, function (res) {
            try {
                var data = '';
                if (res.statusCode >= 200 && res.statusCode < 400) {
                    res.on('data', function (d) {
                        data += d.toString();
                    });
                    res.on('end', function () {
                        console.log('parsing data from ' + u);
                        parser.parseString(data, function (err, result) {
                            processResult(u, result);
                            cull();
                        });
                    });
                }
            } catch (e) {
                console.warn('error checking ' + u, e);
            }
        });
    });


    setTimeout(scan, updateInterval);
})();

module.exports.getArticles = () => Object.values(articles);