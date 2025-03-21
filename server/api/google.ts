import type { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';

export default async function handler(req: VercelRequest, res: VercelResponse) {
	const code = req.query.code as string;
	if (!code) {
		res.status(400).json({ message: 'No code provided' });
		return;
	}
	const state = req.query.state as string;
	console.log('code', code);
	const oauth2Client = new google.auth.OAuth2(
		process.env.GOOGLE_API_CLIENT_ID,
		process.env.GOOGLE_API_CLIENT_SECRET,
		'https://myalyce-server.vercel.app/api/google',
	);
	try {
		const { tokens } = await oauth2Client.getToken(code);
		// res.status(200).json({ message: 'Successfully authenticated', tokens });
		res.redirect(
			`https://zepp-os.zepp.com/app-settings/redirect.html?accessToken=null&refreshToken=null&state=${state}`,
		);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error });
		return;
	}
}
