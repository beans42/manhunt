# manhunt

manhunt is a [Node.js](https://nodejs.org/) 'Find My Friends' like browser game built with [Express.js](https://expressjs.com/), and [Socket.IO](https://socket.io/).

## requirements

[node/npm](https://nodejs.org/) needs to be installed.

The geolocation and deviceorientation browser API's can only be used in secure contexts (HTTPS). You need a domain and a corresponding SSL certificate ([Let's Encrypt](https://letsencrypt.org/) works fine).

You also need to forward port 443 (HTTPS) to your pc.

## installation

These commands clone the repo, change the symlinks to your SSL certs, install dependencies, and run the app.

windows:

```batch
git clone https://github.com/beans42/manhunt.git
cd manhunt\ssl

mklink TempLink YOUR_PRIVKEY_FILE
copy /l /y TempLink privkey.pem
del TempLink

mklink TempLink YOUR_FULLCHAIN_FILE
copy /l /y TempLink fullchain.pem
del TempLink

cd ..
npm install
node index.js
```

linux:

```bash
git clone https://github.com/beans42/manhunt.git
cd manhunt/ssl

ln -sf YOUR_PRIVKEY_FILE privkey.pem
ln -sf YOUR_FULLCHAIN_FILE fullchain.pem

cd ..
npm install
node index.js
```

## usage

- go to yourdomain.com and click 'create room'
- pick a nickname for yourself
- share the link or game code with your friends
