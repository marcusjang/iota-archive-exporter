const DEFAULT_ARGS = {
	method: 'ZMQ',
	input: 14265,
	output: 5556
};

const args = {
	input: process.argv[2],
	output: process.argv[3]
};

const portValidation = port => {
	return (typeof port !== 'number' || port < 1 || port > 65535);
}

if (portValidation(args.input)) {
	throw new Error('Invalid input port provided');
}

if (portValidation(args.output)) {
	throw new Error('Invalid output port provided');
}

module.exports = Object.assign(DEFAULT_ARGS, args);
