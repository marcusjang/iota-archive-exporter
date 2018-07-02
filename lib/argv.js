const DEFAULT_OPTS = {
	method: 'ZMQ',
	input: 14265,
	output: 5556,
	outputDir: 'dumps'
};

const ARGS_ALIAS = {
	m: 'method',
	i: 'input',
	o: 'output',
	d: 'outputDir'
};

module.exports = require('minimist')(process.argv.slice(2), {
	alias: ARGS_ALIAS,
	default: DEFAULT_OPTS
});
