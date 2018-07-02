const INIT_DELAY = 1500;

const zmq = require('zeromq');
const Converter = require('./converter');
const Exporter = require('./Exporter');

// Classes
class MessageQ {
	constructor() {
		this.chunks = new Array();
	}
	
	append(chunk) {
		this.chunks.push(chunk);
		return chunk;
	}

	get string() {
		return this.chunks.join(' ');
	}
}

class Tx extends MessageQ {
	// ref:
	//     https://github.com/iotaledger/iri/blob/master/src/main/java/com/iota/iri/storage/ZmqPublishProvider.java#L68
	//     https://github.com/iotaledger/iota.lib.js/blob/develop/lib/utils/utils.js#L169
	constructor(hash, trytes) {
		super();
		const transactionTrits = Converter.trits(trytes);
		this.topic = this.append('tx');
		this.hash = this.append(hash);
		this.address = this.append(trytes.slice(2187, 2268));
		this.value = this.append(Converter.value(transactionTrits.slice(6804, 6837)));
		this.obsoleteTag = this.append(trytes.slice(2295, 2322));
		this.timestamp = this.append(Converter.value(transactionTrits.slice(6966, 6993)));
		this.currentIndex = this.append(Converter.value(transactionTrits.slice(6993, 7020)));
		this.lastIndex = this.append(Converter.value(transactionTrits.slice(7020, 7047)));
		this.bundle = this.append(trytes.slice(2349, 2430));
		this.trunk = this.append(trytes.slice(2430, 2511));
		this.branch = this.append(trytes.slice(2511, 2592));
		this.arrivalDate = this.append(Date.now());
		this.tag = this.append(trytes.slice(2592, 2619));
	}
}

class Tx_trytes extends MessageQ {
	// ref:
	//     https://github.com/iotaledger/iri/blob/master/src/main/java/com/iota/iri/storage/ZmqPublishProvider.java#L93
	constructor(hash, trytes) {
		super();
		this.topic = this.append('tx_trytes');
		this.trytes = this.append(trytes);
		this.hash = this.append(hash);
	}
}

class Sn extends MessageQ {
	// ref:
	//     https://github.com/iotaledger/iri/blob/master/src/main/java/com/iota/iri/LedgerValidator.java#L150
	constructor(milestone, txs) {
		super();
		if (Array.isArray(txs) || txs.length > 5) {
			throw new Error('Confirmed transactions should come in an array of 5');
		}
		this.topic = this.append('sn');
		this.milestone = this.append(milestone);
		this.txs = txs;
		this.txs.forEach(tx => {
			this.append(tx);
		});
	}
}

class ZmqExporter extends Exporter {
	constructor(argv) {
		super();
		this._sock = undefined;
		this._port = argv.output;
		
		if (!this._port || typeof this._port !== 'number') {
			throw new Error('ZMQ port not provided');
		}
	}
	
	init(options) {
		this._sock = zmq.socket('pub');
		return new Promose((resolve, reject) => {
			this._sock.bind('tcp://127.0.0.1:' + this._port, err => {
				if (err) return reject();
				setTimeout(resolve, INIT_DELAY);
			});
		});
		super.init();
	}
	
	export(tx, trytes, index, isIncluded) {
		super.export(tx, trytes, index, isIncluded);
		this._sock.send(new Tx(tx, trytes));
		this._sock.send(new Tx_trytes(tx, trytes));
		if (isIncluded) {
			this._sock.send(new Sn('9'.repeat(81), [tx]));
		}
	}
	
	close() {
		this._sock.close();
		super.close();
	}
}

module.exports = ZmqExporter;
