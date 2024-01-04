import { join } from 'path';

globalThis.trace = function trace(...args: unknown[]) {
	const { stack } = new Error();
	if (!stack) throw new Error('Failed to track caller.');
	const lastCaller = stack.split('\n')[2].trim();

	console.log(...args, '\n\t', '\x1b[90m', lastCaller, '\x1b[0m', '\n');
};

globalThis.sleep = function sleep(seconds: number) {
	return new Promise((r) => setTimeout(r, seconds * 1000));
};


globalThis.filePath = function filePath(name: string) {
	return join(__dirname, '../../tmp/test/', name);
};
