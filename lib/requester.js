const http = require('http');

class Requester {
	constructor(port, delay) {
		this.port = port;
		this.delay = delay;
		this.pool = new http.Agent({ maxSockets: 64 });
		this.lsm = false;
	}
	
	send(command) {
		return new Promise((resolve, reject) => {
			try {
				const req = http.request({
					protocol: 'http:',
					hostname: 'localhost',
					port: this.port,
					method: 'POST',
					agent: this.pool,
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
						setTimeout(resolve, this.delay, body);
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
	}
}

class ApiRequester extends Requester {
	constructor(port, delay) {
		super(port, delay);
	}
	
	get nodeInfo() {
		return new Promise((resolve, reject) => {
			this.send({ command: 'getNodeInfo' }).then(result => {
				resolve(result);
			});
		});
	}
	
	get getSync() {
		console.log('Trying to connect to the IRI API endpoint...');
		
		const trySync = resolve => {
			this.nodeInfo.then(nodeInfo => {
				const { latestSolidSubtangleMilestone: lsm } = nodeInfo;
				if (lsm !== '9'.repeat(81) /* && lmi === lsmi */) {
					resolve(lsm);
				} else {
					setTimeout(trySync, 3000, resolve);
				}
			});
		};
		
		return new Promise(resolve => {
			trySync(resolve);
		});
	}
	
	async getTrytes(txhash) {
		let { trytes } = await this.send({ command: 'getTrytes', hashes: [txhash] });
		return trytes[0];
	}
}

module.exports = ApiRequester;
