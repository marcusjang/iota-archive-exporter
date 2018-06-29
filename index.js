const API_PORT = process.argv[2] || 14265;
const ZMQ_PORT = process.argv[3] || 5556;
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
		if (!seenForward.has(tx)) {
			if (!db.has(tx)) {
				const trytes = await getTrytes(tx);
				const msgs = new Array();
				msgs.push(new Tx(tx, trytes));
				msgs.push(new Tx_trytes(tx, trytes));
				publish(msgs);
				db.add(tx);
			}
			queueForward.push(tx);
			seenForward.add(tx);
		}
	});
	queueForward.shift();
};

const traverseBackward = async txhash => {
	const trytes = await getTrytes(txhash);

	if (!db.has(txhash)) {
		const msgs = new Array();
		msgs.push(new Tx(txhash, trytes));
		msgs.push(new Tx_trytes(txhash, trytes));
		msgs.push(new Sn('9'.repeat(81), [txhash]));
		publish(msgs);
		db.add(txhash);
	}

	const parents = [ trytes.slice(2430, 2511), trytes.slice(2511, 2592) ];
	parents.forEach(async tx => {
		if (!seenBackward.has(tx)) {
			if (tx === '9'.repeat(81)) {
				// reached the genesis. traversing forwards again...
				queueForward.push(txhash);
			} else {
				queueBackward.push(tx);
				seenBackward.add(tx);
			}
		}
	});
	queueBackward.shift();
};

const getNodeSyncState = async () => {
	const {
		latestMilestone: lm,
		latestMilestoneIndex: lmi,
		latestSolidSubtangleMilestone : lsm,
		latestSolidSubtangleMilestoneIndex: lsmi
	} = await request({ command: 'getNodeInfo' });
	
	return { lm, lmi, lsm, lsmi };
}

// Declerations
const seenBackward = new Set();
const seenForward = new Set();
const queueBackward = new Array();
const queueForward = new Array();
const db = new Set();
let counter = 0;


// Do the thang
console.log('Initializing ZMQ publishing stream...');
sock.bindSync('tcp://127.0.0.1:' + ZMQ_PORT);

setTimeout(async () => {

	console.log('Trying to connect to the IRI API endpoint...');
	let { lm, lmi, lsm, lsmi } = await getNodeSyncState();
	
	// Check the sync state of the node first
	while (lsm === '9'.repeat(81) /* || lmi !== lsmi */) {
		console.log(lsm);
		console.log(lmi, lsmi);
		console.log('IRI is not solid yet, trying again soon...');
		setTimeout(async () => {
			({ lm, lmi, lsm, lsmi } = await getNodeSyncState());
		}, 750);
	}
	
	console.log('Successfully retrived the latest solid subtangle milestone, traversing...');
	queueBackward.push(lsm);
	

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
}, 1000);
