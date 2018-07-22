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

	start(info, set) {
		const { appName, appVersion, latestSolidSubtangleMilestoneIndex: lsmi } = info;
		return new Promise(async (resolve, reject) => {
			Exporter.send(`info start ${appName} ${appVersion} ${lsmi} ${set}`);
			while(this.queue.length > 0) {
				const entryPoint = this.queue.shift();
				await this.traverse(entryPoint);
			}
			delete this.seen;
			Exporter.send(`info done ${set}`);
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
		return hashes.reduce((promise, hash) => {
			return promise.then(async () => {
				if (!this.seen.has(hash)) {
					if (!db.has(hash)) {
						const trytes = await API.getTrytes(hash);
						Exporter.export(hash, trytes, index++);
						db.add(hash);
					}
					this.queue.push(hash);
					this.seen.add(hash);
				}
			})
		}, Promise.resolve());

		/*
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
		*/
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

		return parents.reduce((promise, hash) => {
			return promise.then(async () => {
				if (!this.seen.has(hash)) {
					if (hash === '9'.repeat(81)) {
						traverse.forward.queue.push(hash);
					} else {
						this.queue.push(hash);
						this.seen.add(hash);
					}
				}
			})
		}, Promise.resolve());

		/*
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
		*/
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
	const lsm = await API.getSync;
	const nodeInfo = await API.nodeInfo;
	traverse.backward.queue.push(lsm);
	
	await Exporter.init();
	
	await traverse.backward.start(nodeInfo, 'confirmed');
	await traverse.forward.start(nodeInfo, 'unconfirmed');
	
	Exporter.close();
})();
