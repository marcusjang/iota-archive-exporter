const DELAY = 5; // in miliseconds
const DEFAULT_OPTS = {
	method: 'ZMQ',
	input: 14265,
	output: 5556,
	outputDir: 'dumps'
};
const ARGS_ALIAS = {
	m: 'method',
	i: 'input',
	o: 'output',
	d: 'outputDir'
};

// Necessary libraries
const argv = require('minimist')(process.argv.slice(2), {
	alias: ARGS_ALIAS,
	default: DEFAULT_OPTS
});
const ExporterClass = require('./lib/' + argv.method);
const Exporter = new ExporterClass(argv);
const RequesterClass = require('./lib/requester');
const Requester = new RequesterClass(argv.output, DELAY);
const request = Requester.send

const getTrytes = async txhash => {
	let { trytes } = await request({ command: 'getTrytes', hashes: [txhash] });
	return trytes[0];
};

const traverseForward = async txhash => {
	const { hashes } = await request({ command: 'findTransactions', approvees: [txhash] });
	hashes.forEach(async tx => {
		if (!seenForward.has(tx)) {
			if (!db.has(tx)) {
				const trytes = await getTrytes(tx);
				Exporter.export(tx, trytes);
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
		Exporter.export(txhash, trytes, true);
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

(async () => {
	await Exporter.init();
	
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
	
	
	Exporter.close();
})();
