export default function Dashboard() {
	return (
		<div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4">
			<div className="max-w-md w-full p-8 bg-white dark:bg-slate-900 rounded-xl shadow-lg">
				<div className="text-center space-y-4">
					<h1 className="text-2xl font-bold text-green-600">
						Login Successful!
					</h1>
					<p className="text-gray-600 dark:text-gray-400">
						Logged in as: judithv.sanchezc@gmail.com
					</p>
					<div className="pt-4">
						<a
							href="/"
							className="inline-block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
						>
							Back to Homepage
						</a>
					</div>
				</div>
			</div>
		</div>
	);
}
