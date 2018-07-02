const DELAY = 5; // in miliseconds

// Necessary libraries
const argv = require('./lib/argv');

const Exporter = require('./lib/' + argv.method);
const Export = new Exporter(argv);

const Requester = require('./lib/requester');
const API = new Requester(argv.input, DELAY);

const { TraverseForward, TraverseBackward } = require('./lib/traverse');
const Traverse = {
	forward = new TraverseForward(),
	backward = new TraverseBackward()
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
