const express = require('express');
const crypto = require('crypto');
const app = express();
const port = 80;

let uuid_to_room_id = new Map();
let room_id_to_room = new Map();

app.set('view engine', 'ejs');

//let rooms=[{players:[{name:"",longitude:0,latitude:0}]}];

function leave_user(user_id) {
	const existing_room_id = uuid_to_room_id.get(user_id);
	let existing_room = room_id_to_room.get(existing_room_id);
	delete existing_room.players[user_id];
	room_id_to_room.set(existing_room_id, existing_room);
	uuid_to_room_id.delete(user_id);
}

app.get('/leave-room/:user_id', (req, res) => {
	const user_id = req.params['user_id'];
	leave_user(user_id);
	res.render('left-room');
});

app.get('/actually-join-room/:room_id/:user_id/:name', (req, res) => {
	const room_id = req.params['room_id'];
	const user_id = req.params['user_id'];
	const user_name = req.params['name'];
	if (uuid_to_room_id.has(user_id))
		leave_user(user_id);
	let room = room_id_to_room.get(room_id);
	room.players[user_id] = {
		name: user_name,
		longitude: 0,
		latitude: 0
	};
	room_id_to_room.set(room_id, room);
	uuid_to_room_id.set(user_id, room_id);
	res.render('room', {
		user_id: user_id
	});
});

app.get('/join-room/:room_id', (req, res) => {
	const room_id = req.params['room_id'];
	if (room_id_to_room.has(room_id)) {
		const room = room_id_to_room.get(room_id);
		res.render('join-room', {
			room_id: room_id,
			room_players: room.players
		});
	} else
		res.render('invalid-room');
});

app.get('/create-room', (req, res) => {
	let room_id;
	do
		room_id = crypto.randomBytes(10).toString('hex');
	while (room_id_to_room.has(room_id));
	let room = {
		players: {}
	};
	room_id_to_room.set(room_id, room);
	res.redirect('/join-room/' + room_id);
});

app.use(express.static('public'));
app.listen(port);