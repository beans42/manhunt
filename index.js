const fs = require('fs');
const express = require('express');
const https = require('https');
const socket = require('socket.io');
const crypto = require('crypto');

const port = 443;
const ssl_options = {
	key: fs.readFileSync('ssl/privkey.pem'),
	cert: fs.readFileSync('ssl/fullchain.pem'),
};

const app = express();
const server = https.createServer(ssl_options, app);
const io = socket(server);

let room_id_to_room = new Map();

function generate_code(length) {
	const alpha = 'abcdefghijklmnopqrstuvwxyz';
	let bytes = crypto.randomBytes(length);
	let out = new Array(length);
	let cursor = 0;
	for (let i = 0; i < length; i++) {
		cursor += bytes[i];
		out[i] = alpha[cursor % alpha.length];
	}
	return out.join('');
}

io.on('connection', socket => {
	let room_id = ''

	socket.on('join room', data => {
		room_id = data.room_id;
		if (!room_id || !room_id_to_room.has(room_id))
			return;
		socket.join(room_id);
		room_id_to_room.get(room_id).players[socket.id] = {
			name: data.user_name,
			longitude: data.longitude,
			latitude: data.latitude
		};
		io.to(room_id).emit('join acknowledgement', { user_name: data.user_name, socket: socket.id });
		console.log('socket', socket.id, 'with name', data.user_name, 'joined room', room_id);
	});

	socket.on('position update', pos => {
		if (!room_id || !room_id_to_room.has(room_id))
			return;
		let room = room_id_to_room.get(room_id);
		room.players[socket.id].longitude = pos.longitude;
		room.players[socket.id].latitude = pos.latitude;
		room_id_to_room.set(room_id, room);
		io.to(room_id).emit('position update', { players: room.players });
	});

	socket.on('disconnect', () => {
		if (!room_id || !room_id_to_room.has(room_id))
			return;
		let existing_room = room_id_to_room.get(room_id);
		let name = existing_room.players[socket.id].name;
		delete existing_room.players[socket.id];
		room_id_to_room.set(room_id, existing_room);
		io.to(room_id).emit('position update', { players: existing_room.players });
		console.log('socket', socket.id, 'with name', name, 'left room', room_id);
	});
});

app.get('/join-room/:room_id', (req, res) => {
	const room_id = req.params['room_id'].toLowerCase();
	if (room_id_to_room.has(room_id)) {
		res.render('room', { room_id });
	} else
		res.redirect('/invalid-room.html');
});

app.get('/create-room', (req, res) => {
	let room_id;
	do
		room_id = generate_code(6);
	while (room_id_to_room.has(room_id));
	let room = {
		players: {}
	};
	room_id_to_room.set(room_id, room);
	res.redirect('/join-room/' + room_id);
	console.log('room created with id', room_id);
});

app.set('view engine', 'ejs');
app.use(express.static('public'));
server.listen(port);