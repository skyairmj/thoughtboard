
/**
 * Module dependencies.
 */

var http    = require('http'), 
    ws      = require("./vendor/ws"),
    express = require('express'), 
    redis   = require('redis'); 

//redis.debug_mode = true;
var app = module.exports = express.createServer();
var client = redis.createClient();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

var clients = []

// Routes
app.get('/', function (req, res) {
  res.render('index', {
    title: 'ThoughtBoard'
  });
});

app.post('/status', function(req, res){
  console.log(req.body)
  var status = req.body.status;
  client.sadd('tw.statuses', status);
  clients.forEach(function(client) {
    client.write(status);
  });
  res.send({status: status}, {"Content-Type": "text/plain"}, 200);
})

app.get('/status', function(req, res){
  client.smembers('tw.statuses', function(err, replies){
    var statuses = [];
    replies.forEach(function (reply, index) {
      statuses.push(reply.toString());
    });
    res.send({status:statuses}, {"Content-Type": "text/plain"}, 200);
  });
})

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

// WebSocket
ws.createServer(function (websocket) {
  clients.push(websocket);

  websocket.addListener("connect", function (resource) {
    console.log("connect: " + resource);
  }).addListener("close", function () { 
    var index = clients.indexOf(websocket);
    if(index != -1)clients.splice(index, 1);
    console.log("connection closed");
  });

}).listen(8080);
