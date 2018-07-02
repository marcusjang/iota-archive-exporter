class Traverse {
	constructor() {
		this.seen = new Set();
		this.queue = new Array();
	}
	
	async publish(hash, trytes) {
		// Check if a hash is in DB then export and save
	}
	
	async start() {
		while(this.queue.length > 0) {
			const entryPoint = this.queue.shift();
			await this.traverse(entryPoint);
		}
		delete this.seen;
	}
}

class TraverseForward extends Traverse {
	constructor() {
		super();
	}
	
	async traverse(children) {		
		children.forEach(async hash => {
			if (!this.seen.has(hash)) {
				await this.publish(hash, trytes);
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
	
	async traverse(tx, trytes) {
		await this.publish(tx, trytes);
		const parents = [ trytes.slice(2430, 2511), trytes.slice(2511, 2592) ];
		parents.forEach(async hash => {
			if (!this.seen.has(hash)) {
				if (tx === '9'.repeat(81)) {
					this.reverse(tx);
				} else {
					this.queue.push(hash);
					this.seen.add(hash);
				}
			}
		});
	}
	
	reverse(hash) {
		// reached the genesis. traversing forwards again...
	}
}

module.exports = {
	TraverseForward: TraverseForward,
	TraverseBackward: TraverseBackward
};
