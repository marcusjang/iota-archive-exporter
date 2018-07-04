const DELAY = 3; // in miliseconds

// Necessary libraries
const argv = require('./lib/argv');

const ZMQ = require('./lib/exporters/' + argv.method);
const Exporter = new ZMQ(argv.output);

const ApiRequester = require('./lib/requester');
const API = new ApiRequester(argv.input, DELAY);

class Traverse {
	constructor() {
		this.seen = new Set();
		this.queue = new Array();
	}

	start() {
		return new Promise(async (resolve, reject) => {
			while(this.queue.length > 0) {
				const entryPoint = this.queue.shift();
				await this.traverse(entryPoint);
			}
			delete this.seen;
			resolve();
		});
	}
}

class TraverseForward extends Traverse {
	constructor() {
		super();
	}
	
	async traverse(tx) {
		const { hashes } = await API.send({ command: 'findTransactions', approvees: [tx] });
		hashes.forEach(async hash => {
			if (!this.seen.has(hash)) {
				if (!db.has(hash)) {
					const trytes = await API.getTrytes(hash);
					Exporter.export(hash, trytes, index++);
					db.add(hash);
				}
				this.queue.push(hash);
				this.seen.add(hash);
			}
		});
	}
}

class TraverseBackward extends Traverse {
	constructor() {
		super();
	}
	
	async traverse(tx) {
		const trytes = await API.getTrytes(tx);

		if (!db.has(tx)) {
			Exporter.export(tx, trytes, index++, true);
			db.add(tx);
		}

		const parents = [ trytes.slice(2430, 2511), trytes.slice(2511, 2592) ];
		parents.forEach(async hash => {
			if (!this.seen.has(hash)) {
				if (hash === '9'.repeat(81)) {
					traverse.forward.queue.push(hash);
				} else {
					this.queue.push(hash);
					this.seen.add(hash);
				}
			}
		});
	}
}


const traverse = {
	forward: new TraverseForward(),
	backward: new TraverseBackward()
}

const db = new Set();
let index = 0;

// Do the thang

(async () => {
	await Exporter.init();
	
	const lsm = await API.getSync;
	const nodeInfo = await API.getNodeInfo;
	traverse.backward.queue.push(lsm);
	
	Exporter.send(`set ${nodeInfo.appName} ${nodeInfo.appVersion} ${nodeInfo.latestSolidSubtangleMilestoneIndex} confirmed`);
	await traverse.backward.start();
	
	Exporter.send(`set ${nodeInfo.appName} ${nodeInfo.appVersion} ${nodeInfo.latestSolidSubtangleMilestoneIndex} unconfirmed`);
	await traverse.forward.start();
	
	Exporter.close();
})();
