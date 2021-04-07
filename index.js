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
		io.to(room_id).emit('join acknowledgement', { user: data.user_name, socket: socket.id });
	});

	socket.on('position update', data => {
		if (!room_id || !room_id_to_room.has(room_id))
			return;
		let room = room_id_to_room.get(room_id);
		room.players[socket.id].longitude = data.longitude;
		room.players[socket.id].latitude = data.latitude;
		room_id_to_room.set(room_id, room);
		socket.to(room_id).emit('position update', { players: room.players });
	});

	socket.on('disconnect', () => {
		if (!room_id || !room_id_to_room.has(room_id))
			return;
		let existing_room = room_id_to_room.get(room_id);
		delete existing_room.players[socket.id];
		room_id_to_room.set(room_id, existing_room);
		io.to(room_id).emit('position update', { players: existing_room.players });
	});
});

app.get('/join-room/:room_id', (req, res) => {
	const room_id = req.params['room_id'];
	if (room_id_to_room.has(room_id)) {
		res.render('room', {
			room_id: room_id,
		});
	} else
		res.render('invalid-room');
});

app.get('/create-room', (req, res) => {
	let room_id;
	do
		room_id = "room-" + crypto.randomBytes(10).toString('hex');
	while (room_id_to_room.has(room_id));
	let room = {
		players: {}
	};
	room_id_to_room.set(room_id, room);
	res.redirect('/join-room/' + room_id);

});

app.set('view engine', 'ejs');
app.use(express.static('public'));
server.listen(port);