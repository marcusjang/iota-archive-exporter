class Traverse {
	constructor(counter) {
		this.seen = new Set();
		this.queue = new Array();
		this.counter = counter || 0;
	}
	
	async publish(hash, trytes) {
		// Check if a hash is in DB then export and save
	}
}

class TraverseForward extends Traverse {
	constructor(counter) {
		super(counter);
	}
	
	async traverse(children) {		
		children.forEach(async hash => {
			if (!this.seen.has(hash)) {
				await this.publish(hash, trytes);
				this.queue.push(hash);
				this.seen.add(hash);
			}
		});
		this.queue.shift();
	}
}

class TraverseBackward extends Traverse 
	constructor(counter) {
		super(counter);
	}
	
	async traverse(tx, trytes) {
		await this.publish(hash, trytes);
		const parents = [ trytes.slice(2430, 2511), trytes.slice(2511, 2592) ];
		parents.forEach(async hash => {
			if (!this.seen.has(hash)) {
				if (tx === '9'.repeat(81)) {
					reverse(txhash);
				} else {
					this.queue.push(hash);
					this.seen.add(hash);
				}
			}
		});
		this.queue.shift();
	}
	
	reverse(txhash) {
		// reached the genesis. traversing forwards again...
	}
}

module.exports = {
	TraverseForward: TraverseForward,
	TraverseBackward: TraverseBackward
};
