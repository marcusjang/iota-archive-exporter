const DEFAULT_OPTS = {
	method: 'ZMQ',
	input: 14265,
	output: 5556
};

const ARGS_ALIAS = {
	m: 'method',
	i: 'input',
	o: 'output'
};

const METHODS = new Set(['ZMQ']);

const argv = require('minimist')(process.argv.slice(2), {
	alias: ARGS_ALIAS,
	default: DEFAULT_OPTS
});

if (!METHODS.has(argv.method)) {
	throw new Error('Invalid method provided');
}

module.exports = argv;
