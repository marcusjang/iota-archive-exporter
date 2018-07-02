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

const Exporter = require('./lib/' + argv.method);
const Export = new Exporter(argv);

const Requester = require('./lib/requester');
const API = new Requester(argv.input, DELAY);

const { TraverseForward, TraverseBackward } = require('./lib/traverse');
const Traverse = {
	forward = new TraverseForward(counter),
	backward = new TraverseBackward(counter)
}

Traverse.forward.publish = async hash => {
	if (!db.has(hash)) {
		const trytes = await API.getTrytes(hash);
		Exporter.export(hash, trytes, index++);
		db.add(hash);
	}
}

Traverse.backward.publish = async (hash, trytes) => {
	if (!db.has(hash)) {
		Exporter.export(hash, trytes, index++, true);
		db.add(hash);
	}
}
	
Traverse.backward.reverse = hash => {
	Traverse.forward.queue.push(hash);
}

const db = new Set();
let index = 0;


// Do the thang

(async () => {
	await Exporter.init();
	
	const lsm = await API.getSync();
	
	Traverse.backward.queue.push(lsm);
	
	await Traverse.backward.start();
	await Traverse.forward.start();
	
	Exporter.close();
})();
