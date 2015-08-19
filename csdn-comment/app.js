var http = require('http');
var cheerio = require('cheerio');
var async = require('async');
var fs = require('fs');
var localJSON = require('./local.json');

//封装并返回http请求头部信息
function getOpt(path){
  path = path || 'http://download.csdn.net/my/downloads';
  var opt = {
    host:'127.0.0.1', //本地代理ip
    port:'8888',//本地代理端口
    method:'GET',
    path:path,
    headers:{ //此处头部信息根据实际登陆访问的时候浏览器看到的http头决定
      'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Encoding':'gzip, deflate, sdch',
      'Accept-Language':'zh-CN,zh;q=0.8,en;q=0.6,zh-TW;q=0.4',
      'Cache-Control':'no-cache',
      'DNT':'1',
      'Host':'download.csdn.net',
      'Pragma':'no-cache',
      'Proxy-Connection':'keep-alive',
      'Referer':'http://download.csdn.net/my/downloads/4',
      'User-Agent':'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36'
    }
  };

  for(key in localJSON){
    if(localJSON.hasOwnProperty(key)){
      opt.headers[key] = localJSON[key];
    }
  }

  return opt;
}

//根据html找到未评论的条目
function findNotComment(html){
  var r = [];
  var $ = cheerio.load(html);
  var tobeComment = $('.btn-comment');
  tobeComment.each(function(){
    var $this = $(this);
    var url = $this.attr('href');
    var text = $this.parent().next('h3').find('a').text();
    r.push(text + ':' + url+'\n') ;
  })
  return r;
}

//看一下一共多少页，根据数字再去访问每一页，找到未评论的条目
function countAll(html){
  var $ = cheerio.load(html);
  var c = $('.page_nav').find('.pageliststy').last().attr('href');
  c = c.match(/\d+/)[0];

  var tasklist  = [];

  for(var i = 1;i<c;i++){
    tasklist.push( (function(i){
    return function(cb){
        httpRequest('http://download.csdn.net/my/downloads/' + i,cb)
      }
    })(i))
  }

  async.parallel(tasklist,function(err, results){
    console.log(results.join('\n'));
  });
}

//发起http请求，初始化及翻页都是此函数
function httpRequest(path,cb){
  http.request(getOpt(path),function(res){
    var html = '';

    res.on('data',function(data){
      html += data;
    });

    res.on('end',function(data){
      if(cb){
        cb(null,findNotComment(html));
      }else{
        countAll(html);
      }
    });

  }).on('error',function(e){
    console.log("error:" + e.message);
  }).end();
}

//初始化，程序启动
httpRequest();

//console.log(getOpt());