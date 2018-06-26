const API_PORT = process.argv[2] | 14265;
const ZMQ_PORT = process.argv[3] | 5556;
const DELAY = 5; // in miliseconds

// Necessary libraries
const http = require('http');
const pool = new http.Agent({ maxSockets: 64 });

const zmq = require('zeromq');
const sock = zmq.socket('pub');

const { Tx, Tx_trytes, Sn } = require('./lib/MessageQ');

// Functions
const request = command => {
	return new Promise((resolve, reject) => {
		try {
			const req = http.request({
				protocol: 'http:',
				hostname: 'localhost',
				port: API_PORT,
				method: 'POST',
				agent: pool,
				headers: {
					'Content-Type': 'application/json',
					'X-IOTA-API-Version': 1,
					'Content-Length': Buffer.byteLength(JSON.stringify(command))
				},
			}, res => {
				let data = '';

				res.on('data', chunk => {
					data += chunk;
				});

				res.on('end', () => {
					const body = JSON.parse(data);
					if ('error' in body) {
						throw new Error(body.error);
					}
					setTimeout(resolve, DELAY, body);
				});
			});

			req.on('error', err => {
				throw err;
			});

			req.write(JSON.stringify(command));
			req.end();
		} catch (err) {
			console.error(err);
			reject(err);
		}
	});
};

const getTrytes = async txhash => {
	let { trytes } = await request({ command: 'getTrytes', hashes: [txhash] });
	return trytes[0];
};

const publish = messages => {
	messages.forEach(msg => {
		console.log(msg.string);
		sock.send(msg.string);
	});
};

const traverseForward = async txhash => {
	const { hashes } = await request({ command: 'findTransactions', approvees: [txhash] });
	hashes.forEach(async tx => {
		if (!seenForward.includes(tx)) {
			if (!db.includes(tx)) {
				const trytes = await getTrytes(tx);
				const msgs = new Array();
				msgs.push(new Tx(tx, trytes));
				msgs.push(new Tx_trytes(tx, trytes));
				publish(msgs);
				save(tx);
			}
			queueForward.push(tx);
			seenForward.push(tx);
		}
	});
	queueForward.shift();
};

const traverseBackward = async txhash => {
	const trytes = await getTrytes(txhash);

	if (!db.includes(txhash)) {
		const trytes = await getTrytes(txhash);
		const msgs = new Array();
		msgs.push(new Tx(txhash, trytes));
		msgs.push(new Tx_trytes(txhash, trytes));
		publish(msgs);
		db.push(txhash);
	}

	const parents = [ trytes.slice(2430, 2511), trytes.slice(2511, 2592) ];
	parents.forEach(async tx => {
		if (!seenBackward.includes(tx)) {
			if (tx === '9'.repeat(81)) {
				// reached the genesis. traversing forwards again...
				queueForward.push(txhash);
			} else {
				queueBackward.push(tx);
				seenBackward.push(tx);
			}
		}
	});
	queueBackward.shift();
};

// Declerations
const seenBackward = new Array();
const seenForward = new Array();
const queueBackward = new Array();
const queueForward = new Array();
const db = new Array();
let counter = 0;


// Do the thang
(async () => {
	const { latestSolidSubtangleMilestone } = await request({ command: 'getNodeInfo' });
	queueBackward.push(latestSolidSubtangleMilestone);
	
	sock.bindSync('tcp://127.0.0.1:5557');

	// First traverse backwards towards the milestone, publishing confirmed transactions
	while (queueBackward.length > 0) {
		await traverseBackward(queueBackward[0]);
	}

	// Not sure if needed, but delete seen backward transactions object since we're done here
	delete seenBackward;

	// And then from the genesis traverse forward towards the edge, publishing unconfirmed transactions
	while (queueForward.length > 0) {
		await traverseForward(queueForward[0]);
	}

	// Not sure if needed, but delete seen forward transactions object since we're done here
	delete seenForward;
})();
