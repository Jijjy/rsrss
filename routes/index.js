var express = require('express');
var rss = require('../services/get-rss');
var _ = require('lodash');
var moment = require('moment');
var router = express.Router();

function dateKey(m) {
  let now = moment();
  let daydiff = moment().startOf('day').diff(moment(m).startOf('day'), 'days');
  if (daydiff >= 7) return now.month() !== m.month() ? m.format('Do [of] MMMM') : m.format('dddd [the] Do');
  if (daydiff > 1) return m.format('dddd');
  if (daydiff === 1) return m.hours() >= 23 ? 'Last Night' : 'Yesterday';
  if (m.hours() >= 18)
    return 'This Evening';
  if (m.hours() >= 12)
    return 'This Afternoon';
  if (m.hours() >= 5)
    return 'This Morning';
  return now.hours() < 5 ? 'Tonight' : 'Last Night';
}

/* GET home page. */
router.get('/', function (req, res, next) {

  var articles = rss.getArticles().map(a => {
    a.pubdate = moment(a.pubdate);
    return {
      sectionTitle: dateKey(a.pubdate),
      article: a
    }
  });

  var sections = Object.entries(_.groupBy(articles, 'sectionTitle')).map(([k, v]) => ({
    title: k,
    articles: v.map(a => a.article).sort((a, b) => b.pubdate - a.pubdate)
  })).sort((a, b) => b.articles[0].pubdate - a.articles[0].pubdate);

  res.render('index', {
    sections: sections
  });

});

module.exports = router;