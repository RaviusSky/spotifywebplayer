var http = require("http")
var https = require("https")
var fs = require("fs")
var url = require("url")

port = process.env.PORT

var client_id = "30860a4d8522424a887e9f91c975588f";

http.createServer(function(req, res)
{
	console.log(req.url.split("?")[0])
	if (req.url.split("?")[0] == "/login")
	{
		
		var redirect_uri = "https://spotifywebplayer.herokuapp.com"
		var scopes = 'streaming user-read-email user-read-private';
		res.writeHead(301, { Location: 'https://accounts.spotify.com/authorize' +
		'?response_type=code' +
		'&client_id=' + client_id +
		(scopes ? '&scope=' + encodeURIComponent(scopes) : '') +
		'&redirect_uri=' + encodeURIComponent(redirect_uri)});
	}
	else if (req.url.split("?")[0] == "/token")
	{
		var authCode = url.parse(req.url, true).query.code
		
		var requestData = JSON.stringify({
			grant_type: "authorization_code",
			code: authCode,
			redirect_uri: "https://spotifywebplayer.herokuapp.com"
		})
		
		var tokenOptions = {
			hostname: "accounts.spotify.com",
			port: 443,
			path: "/api/token",
			method: "POST",
			headers: {
				"Authorization": "Basic " + Buffer.from(client_id).toString("base64"),
				"Content-Type": "application/x-www-form-urlencoded"
			}
		}

		var tokenReq = https.request(tokenOptions, tokenRes => {

			tokenRes.setEncoding('utf8')

			console.log("Token request status code: ${tokenRes.statusCode}")
		
			tokenRes.on("data", function(chunk) {
				console.log("Response: "+chunk)
			})
		})

		tokenReq.on("error", error => {
			console.error(error)
		})
	}
	else if (req.url.split("?")[0] == "/")
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
			res.write("404")
			console.log("Unknown url: " + req.url)
		}
	}

	res.end()
	
}).listen(port)
