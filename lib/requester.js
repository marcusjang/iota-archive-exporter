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
}

module.export = Requester;
