var http = require("http")
var fs = require("fs")

http.createServer(function(req, res)
{
	console.log(req.url)
	if (req.url == "/login")
	{
		var client_id = "30860a4d8522424a887e9f91c975588f";
		var redirect_uri = "https://spotifywebplayer.herokuapp.com"
		var scopes = 'user-modify-playback-state streaming user-read-email user-read-private';
		res.writeHead(301, { Location: 'https://accounts.spotify.com/authorize' +
		'?response_type=code' +
		'&client_id=' + client_id +
		(scopes ? '&scope=' + encodeURIComponent(scopes) : '') +
		'&redirect_uri=' + encodeURIComponent(redirect_uri)});
	}
	if (req.url == "/")
	{
		res.write(fs.readFileSync(__dirname + "/index.html", 'utf8'))
	}
	else
	{
		try
		{
			res.write(fs.readFileSync(__dirname + req.url))
		}
		catch
		{
			console.log("Uknown url: " + req.url)
		}
	}

	res.end()
	
}).listen(process.env.PORT)
