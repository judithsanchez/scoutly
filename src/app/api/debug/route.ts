import {NextResponse} from 'next/server';
import {exec} from 'child_process';
import {promisify} from 'util';

const execAsync = promisify(exec);

export async function GET() {
	const hostname = 'db.jobscoutly.tech';
	const results: Record<string, any> = {};

	try {
		console.log(`Attempting nslookup for ${hostname}`);
		const {stdout, stderr} = await execAsync(`nslookup ${hostname}`);
		results[hostname] = {status: 'success', stdout, stderr};
		console.log(`nslookup for ${hostname} successful`);
	} catch (error) {
		results[hostname] = {status: 'error', error: (error as Error).message};
		console.error(`nslookup for ${hostname} failed`, error);
	}

	return NextResponse.json(results);
}
