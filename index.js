var http = require("http")
var https = require("https")
var fs = require("fs")
var url = require("url")
var querystring = require("querystring")

port = process.env.PORT

var client_id = "30860a4d8522424a887e9f91c975588f";
var client_secret = "88bfbbc6ae4544519c86d54ba083a5e4";

var authToken = "";
var selectedClientId = "";

http.createServer(function(req, res)
{
	console.log(req.url.split("?")[0])
	if (req.url.split("?")[0] == "/login")
	{
		
		var redirect_uri = "https://spotifywebplayer.herokuapp.com/token"
		var scopes = 'streaming user-read-email user-read-private user-read-playback-state user-read-currently-playing user-modify-playback-state';
		res.writeHead(301, { Location: 'https://accounts.spotify.com/authorize' +
		'?response_type=code' +
		'&client_id=' + client_id +
		(scopes ? '&scope=' + encodeURIComponent(scopes) : '') +
		'&redirect_uri=' + encodeURIComponent(redirect_uri)});

		res.end()
	}
	else if (req.url.split("?")[0] == "/api")
	{
		var command = url.parse(req.url, true).query.command

		if (authToken == "")
		{
			res.write("ERROR_NO_VALID_AUTH_TOKENS");
			res.end()

		}
		else if (command == "playing") //Checks what song is currently playing
		{
			const options = {
				hostname: "api.spotify.com",
				port: 443,
				path: "/v1/me/player/currently-playing",
				method: "GET",
				headers: {
					Authorization: "Bearer " + authToken
				}
			}

			const getReq = https.request(options, getRes => {
				getRes.setEncoding('utf8')

				if (getRes.statusCode == "204")
				{
					res.write("STATUS_NO_SONG_PLAYING")
					res.end()
				}
				else if (getRes.statusCode == "200")
				{
					var parts = []

					getRes.on("data", function(chunk) {
						parts.push(chunk)
					})

					getRes.on("end", function(chunk)
					{
						total = ""

						for (var i = 0; i < parts.length; i++)
						{
							total += parts[i]
						}

						res.write(total)
						res.end()
					})
				}
				else
				{
					res.write("STATUS_UNEXPECTED_"+getRes.statusCode)
					res.end()
				}
			})

			getReq.on("error", error => {
				console.log("API_REQUEST_ERROR_"+command)

				res.write("API_REQUEST_ERROR_"+command)
				res.end()
			})

			getReq.end()
		}
		else if (command == "play") //Resumes song if possible
		{
			var playObject = null

			try
			{
				playObject = url.parse(req.url, true).query.playObject
			}
			catch
			{
				console.log("No playobject specified")
			}

			var data = JSON.stringify({})

			if (playObject != null)
			{
				if (playObject.includes("track"))
				{
					data = JSON.stringify({
						"uris": [playObject]
					})
				}
				else
				{
					data = JSON.stringify({
						"context_uri": playObject
					})
				}
			}

			console.log("Play Request Data: "+data)

			if (selectedClientId == "")
			{
				res.write("NO_CLIENT_ID_SET")
				res.end()
			}
			else
			{
				console.log("Resuming on device "+selectedClientId)

				const options = {
					hostname: "api.spotify.com",
					port: 443,
					path: "/v1/me/player/play?device_id="+selectedClientId,
					method: "PUT",
					headers: {
						Authorization: "Bearer " + authToken,
						Accept: "application/json",
						"Content-Type": "application/json"
					}
				}

				const getReq = https.request(options, getRes => {

					if (getRes.statusCode == "204")
					{
						res.write("STATUS_NO_SONG_PLAYING")
						res.end()
					}
					else if (getRes.statusCode == "200")
					{
						res.write("PLAYING_SONG")
						res.end()
					}
					else if (getRes.statusCode == "404")
					{
						res.write("NO_DEVICE_CONNTECTED")
						res.end()
					}
					else
					{
						res.write("STATUS_UNEXPECTED_"+getRes.statusCode)
						res.end()
					}
				})

				getReq.on("error", error => {
					console.log("API_REQUEST_ERROR_"+command)

					res.write("API_REQUEST_ERROR_"+command)
					res.end()
				})

				getReq.write(data)
				getReq.end()
			}
		}
		else if (command == "setdevice")
		{
			var device_id = url.parse(req.url, true).query.device_id

			selectedClientId = device_id

			res.write("DEVICE_ID_SET_"+device_id)
			res.end()
		}
		else if (command == "devices")
		{
			const options = {
				hostname: "api.spotify.com",
				port: 443,
				path: "/v1/me/player/devices",
				method: "GET",
				headers: {
					Authorization: "Bearer " + authToken,
					Accept: "application/json",
					"Content-Type": "application/json"
				}
			}

			const getReq = https.request(options, getRes => {

				getRes.setEncoding('utf8')

				if (getRes.statusCode == "200")
				{
					var parts = []

					getRes.on("data", function(chunk) {
						parts.push(chunk)
					})

					getRes.on("end", function(chunk)
					{
						total = ""

						for (var i = 0; i < parts.length; i++)
						{
							total += parts[i]
						}

						res.write(total)
						res.end()
					})
				}
				else
				{
					res.write("STATUS_UNEXPECTED_"+getRes.statusCode)
					res.end()
				}
			})

			getReq.on("error", error => {
				console.log("API_REQUEST_ERROR_"+command)

				res.write("API_REQUEST_ERROR_"+command)
				res.end()
			})

			getReq.end()
		}
		else if (command == "next")
		{

		}
		else
		{
			res.write("API_INVALID_COMMAND")
			res.end()
		}
	}
	else if (req.url.split("?")[0] == "/token")
	{
		var authCode = url.parse(req.url, true).query.code

		console.log(authCode)
		
		var requestData = querystring.stringify({
			'grant_type': "authorization_code",
			'code': authCode,
			'redirect_uri': "https://spotifywebplayer.herokuapp.com/token"
		})

		var base64ClientAndSecret = Buffer.from(client_id + ":" + client_secret).toString("base64")
		
		var tokenOptions = {
			hostname: "accounts.spotify.com",
			port: 443,
			path: "/api/token",
			method: "POST",
			headers: {
				"Authorization": "Basic " + base64ClientAndSecret,
				"Content-Type": "application/x-www-form-urlencoded"
			}
		}

		var tokenReq = https.request(tokenOptions, tokenRes => {

			tokenRes.setEncoding('utf8')
		
			tokenRes.on("data", function(chunk) {
				console.log("Response: "+chunk)

				try
				{
					authToken = JSON.parse(chunk).access_token

					res.writeHead(301, { Location: "/?token="+authToken })
					res.end()
				}
				catch
				{
					console.log("ERROR_"+chunk)
					res.write("ERROR_GETTING_TOKEN")
					res.write(chunk)
					res.end()
				}
				
			})
		})

		tokenReq.on("error", error => {
			console.error(error)
		})

		tokenReq.write(requestData)
		tokenReq.end()
	}
	else if (req.url.split("?")[0] == "/")
	{
		res.write(fs.readFileSync(__dirname + "/index.html", 'utf8'))
		res.end()
	}
	else
	{
		try
		{
			res.write(fs.readFileSync(__dirname + req.url))
			res.end()
		}
		catch
		{
			res.write("404")
			console.log("Unknown url: " + req.url)
			res.end()
		}
	}
	
}).listen(port)
