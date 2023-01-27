const axios = require('axios')
const dotenv = require('dotenv').config()

module.exports = {
	//cosa vogliamo passargli, req_options?
	async APIrequest(datastring) {
		const dataArray = datastring.split(':');
		if (dataArray[0] === 'test') {
			console.log('TEST RICONOSCIUTO CORRETTAMENTE');
			return;
		}
		//dataArray[0] destinatario api, [1] playlist id, [2] token
		//forse vale la pena criptare token
		if (dataArray[0] === 'spotify') {
			console.log('opero su api spotify, playlist_id: '+dataArray[1]);
			const options = {
				market: 'IT',
				playlist_id: dataArray[1],
				access_token: dataArray[2]	
			}
			//await o no? aggiungiamo error handling?
			await spotifyScrubPlaylist(options);
			return;
		} 
		if (dataArray[0] === 'youtube') {
			console.log('opero su api youtube');
			const options = {
				playlist_id: dataArray[1],
				access_token: dataArray[2]
			}
			await youtubeScrubPlaylist(options);
			return;
		}
		return {message: 'errore, destinatario chiamata api non specificato o non presente'};
	}
}

//SPOTIFY	
async function spotifyScrubPlaylist(req_options) {
		const result = await spotifyGetPlaylist(req_options);

		//console.log('spotify scrub playlist response: '+result);
		//console.log('spotify scrub playlist response items: '+result.items);

		const daRimuovere = spotifyElementiDaRimuovere(result.items);
		spotifySnocciolaPlaylist(req_options,daRimuovere);

		return;
		//res.status(200).send({message:'playlist spotify pulita correttamente'});
}

async function spotifyGetPlaylist(req_options) {
	const rootUrl = 'https://api.spotify.com/v1/playlists/'+ req_options.playlist_id+'/tracks'+'?market='+ req_options.market
	try {
		var res = await axios.get(rootUrl, {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + req_options.access_token
			},
		});
		return res.data
	} catch(error) {
		console.log(error, 'fallimento fetch playlist da spotify');
		throw new Error(error.message);
	}
}

function spotifyElementiDaRimuovere(tracks) {
	var removeTrack = new Array();
	var cnt = 0;
	tracks.forEach(function(trackData) {
		cnt = cnt+1
		console.log('elementi in traccia: '+Object.keys(trackData.track))
		console.log('TRACCIA TROVATA IN PLAYLIST NUMERO '+cnt+', traccia: '+trackData.track.name);
		if (trackData.track.is_playable === false) {
			removeTrack.push({'uri': trackData.track.uri});
		}
	})
	return removeTrack;
}

async function spotifySnocciolaPlaylist(req_options,uris) {
	const rootUrl = 'https://api.spotify.com/v1/playlists/'+req_options.playlist_id+'/tracks'
	try {
		var res = await axios.delete(rootUrl, {
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + req_options.access_token
			},
			data: {
				tracks: uris,
			},
		});
		return res
	} catch(error) {
		console.log(error, 'fallimento eliminazione elementi');
		throw new Error(error.message);
	}
}

//GOOGLE
async function youtubeScrubPlaylist(req_options) {
	const result = await youtubeGetPlaylist(req_options);
	console.log(result.data.items);
	var daRimuovere = await youtubeElementiDaRimuovere(req_options.access_token, result.data.items);
	return;
}

async function youtubeElementiDaRimuovere(token, elements) {
	var cnt = 0;
	elements.forEach(async function(videoData) {
		cnt = cnt+1
		console.log("CIAO00000000");
		if (!youtubeIsVideoAvailable(token, videoData)) {
			console.log("CIAO");
			await youtubeRimuoviVideo(token, videoData);
		}
	})
	console.log("Finito");
	return;
}

async function youtubeRimuoviVideo(token, videoData) {
	const rootUrl = 'https://www.googleapis.com/youtube/v3/playlistItems?id='+videoData.id+'&access_token='+token;
	try {
		var res = await axios.delete(rootUrl, {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer'+token
			}
		});
		
	} catch(error) {
		console.log('errore DELETE elemento da playlist')
		res.status(500).send({message: errore});
	}
}

function youtubeIsVideoAvailable(token, videoData) {
	if (videoData.status.privacyStatus === 'private' || videoData.status.uploadStatus === 'deleted') {
			return false;
	}
	return true;
}

async function youtubeGetPlaylist(req_options){
	const rootUrl = 'https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet%2CcontentDetails%2Cstatus%2Cid&playlistId='+req_options.playlist_id+'&access_token='+req_options.access_token+'&maxResults=50';
	try {
		var res = await axios.get(rootUrl, {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + req_options.access_token
			}
		});
		return res;
	} catch(error) {
		console.log('errore richiesta canzone: ', error.response)
	}
}
