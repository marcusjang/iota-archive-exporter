const http = require('http');

class Requester {
	constructor(port, delay) {
		this.port = port;
		this.delay = delay;
		this.pool = new http.Agent({ maxSockets: 64 });
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
	
	get async info() {
		return await this.send({ command: 'getNodeInfo' });
	}
	
	get async isSynced() {
		const {
			latestMilestone: lm,
			latestMilestoneIndex: lmi,
			latestSolidSubtangleMilestone : lsm,
			latestSolidSubtangleMilestoneIndex: lsmi
		} = await this.nodeInfo;

		return (lsm === '9'.repeat(81) /* || lmi !== lsmi */);
	}
	
	async getTrytes(txhash) {
		let { trytes } = await request({ command: 'getTrytes', hashes: [txhash] });
		return trytes[0];
	}
}

module.export = Requester;
