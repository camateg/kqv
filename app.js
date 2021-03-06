var cons = require('consolidate')
   ,request = require('request')
   ,express = require('express')
   ,cheerio = require('cheerio')
   ,strftime = require('strftime').strftimeTZ
   ,RSS = require('rss');

var app = express();

app.use(express.static(__dirname+'/public'));

var port = process.env.PORT || 5000;

module.exports = app;
if (!module.parent) {
  app.listen(port, function() {
    console.log("Server listening on port " + port);
  });
}

app.get('/json', set_today, get_shows, render_json);
app.get('/rss', set_today, get_shows, render_rss);

var root_url = 'http://kqv.com/radiohighlights.asp'

function set_today(req, res, next) {
  res.stash = res.stash || {};
  var raw_date = req.param('date') || strftime('%-m/%-d/%y', 'EST');
  res.stash.the_date = raw_date.replace(/_/g,'/');

  return next();
}

function get_shows(req, res, next) {
  res.stash = res.stash || {};
  res.stash.src_url = root_url + '?programdate=' + res.stash.the_date;
  request(res.stash.src_url, function(e,r,b) {
    if (!e & r.statusCode == 200) {
      $ = cheerio.load(b);

      var block = $('#subcontent blockquote').html();

      block = block.replace(/\r/g,'');
      block = block.replace(/\n/g,'');
      block = block.replace(/\t/g,'');

      var tre = /<strong\b[^>]*>([\s\S]*?)<\/strong>/gm;
      var trc = /<strong\b[^>]*>[\s\S]*?<\/strong>/;     
      var scruba = /<a\b[^>]*>([\s\S]*?)<a>/gm;
 
      var t_result, titles=[];
      while (t_result = tre.exec(block)) {
         titles.push(t_result[1]);
      }

      var contents = block.split(trc);
    
      contents.shift();

      output = [];

      for(var ct=0;ct<titles.length;ct++) {
        var tmp = {};
        tmp['title'] = titles[ct];
        tmp['idx'] = ct;
        var tmp_contents = contents[ct].replace(/<br>/g,' ').replace(/<hr>/g,'---').replace(scruba,'').replace(/<p>/g,'').replace(/<\/a>/,'').replace(/<\/p>/,'').trim();
        var matches = tmp_contents.match(/(\d+\:\d+)\:\d+\s(AM|PM)\s+\-\s+(\d+\:\d+)\:\d+\s(AM|PM)/);

        if (matches != null) {
          tmp['start'] = matches[1] + matches[2];
	  tmp['end'] = matches[3] + matches[4];
	  var cont_temp = tmp_contents.replace(matches[0],'').replace(/^\s+/,"");;
          var show_tmp = cont_temp.split('---');
          if (show_tmp[0] == '') {
            tmp['show'] = [];
          } else {
	    tmp['show'] = show_tmp;
          }
          output.push(tmp);
        }
      }

      json = {};
      json['date'] = res.stash.the_date;
      json['src_url'] = res.stash.src_url;
      json['shows'] = output;

      res.stash.json = json;

      return next();
    } else {
      res.stash.json = {error: 'error'};
    }
  });

}

function render_json(req, res) {
  res.stash = res.stash || {};
  res.json(res.stash.json);
}

function render_rss(req, res) {
  res.stash = res.stash || {};
 
  var feed = new RSS(
    {
      "title": "KQV programming",
      "feed_url": "https://kqv.herokuapp.com/rss",
      "site_url":  res.stash.json.src_url
    } 
  );

  for(ct=0;ct<res.stash.json.shows.length;ct++) {
    var descrip = "";
    for(ct1=0;ct1<res.stash.json.shows[ct].show.length;ct1++) {
      descrip += "<br />" + res.stash.json.shows[ct].show[ct1];
    }; 
    feed.item(
      { "title": res.stash.json.shows[ct].title + ' @ ' + res.stash.json.shows[ct].start,
        "description": "<b>" + res.stash.json.shows[ct].title + "</b>" + descrip
      });
  }

  res.setHeader('content-type', 'application/rss+xml');
  res.send(feed.xml({indent: true})); 
}
