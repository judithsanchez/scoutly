import {NextResponse} from 'next/server';
import {lookup} from 'dns/promises';

export async function GET() {
	const hostname = 'db.jobscoutly.tech';
	const results: Record<string, any> = {};

	try {
		console.log(`Attempting dns.lookup for ${hostname}`);
		const {address, family} = await lookup(hostname);
		results[hostname] = {status: 'success', address, family};
		console.log(`dns.lookup for ${hostname} successful:`, {address, family});
	} catch (error) {
		const err = error as NodeJS.ErrnoException;
		results[hostname] = {
			status: 'error',
			code: err.code,
			message: err.message,
			hostname: err.hostname,
		};
		console.error(`dns.lookup for ${hostname} failed`, err);
	}

	return NextResponse.json(results);
}
