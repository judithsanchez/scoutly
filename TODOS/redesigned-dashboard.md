<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scoutly - Redesigned Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        html { scroll-behavior: smooth; }
        body {
            font-family: 'Inter', sans-serif;
            transition: background-color 0.3s ease, color 0.3s ease;
            overflow-x: hidden;
        }

        /* --- Theme Color System --- */
        :root {
            --bg-color: #f1f5f9;      /* slate-100 */
            --card-bg: white;
            --card-border: #e2e8f0;    /* slate-200 */
            --text-color: #0f172a;    /* slate-900 */
            --text-muted: #475569;    /* slate-600 */
            --tag-bg: #e2e8f0;       /* slate-200 */
            --nav-bg: rgba(255, 255, 255, 0.7);
            --nav-border: #e2e8f0;
            --toggle-icon-color: #475569;
            --snippet-bg: #f8fafc;    /* slate-50 */
        }
        .dark {
            --bg-color: #020617;      /* slate-950 */
            --card-bg: #0f172a;      /* slate-900 */
            --card-border: #1e293b;   /* slate-800 */
            --text-color: #f1f5f9;    /* slate-100 */
            --text-muted: #94a3b8;    /* slate-400 */
            --tag-bg: #1e293b;       /* slate-800 */
            --nav-bg: rgba(15, 23, 42, 0.7);
            --nav-border: rgba(255, 255, 255, 0.2);
            --toggle-icon-color: #cbd5e1;
            --snippet-bg: #020617;    /* slate-950 */
        }

        body { background-color: var(--bg-color); color: var(--text-color); }
        .card { background-color: var(--card-bg); border-color: var(--card-border); }
        .text-muted { color: var(--text-muted); }
        .tag { background-color: var(--tag-bg); }
        .nav-card { background-color: var(--nav-bg); border-color: var(--nav-border); }
        .toggle-icon { color: var(--toggle-icon-color); }
        .snippet-bg { background-color: var(--snippet-bg); }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .fade-in {
            animation: fadeIn 0.5s ease-out forwards;
        }
    </style>

</head>
<body>
    <!-- Navbar -->
    <nav class="fixed top-0 left-0 right-0 px-4 mt-4 z-40">
        <div class="nav-card mx-auto p-3 rounded-2xl border shadow-lg backdrop-blur-xl max-w-7xl">
            <div class="flex justify-between items-center">
                <a href="#" class="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-purple-600 dark:text-purple-400"><circle cx="12" cy="12" r="2"></circle><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"></path></svg>
                    <span class="text-2xl font-bold tracking-tighter text-slate-900 dark:text-white">Scoutly</span>
                </a>

                <div class="hidden md:flex items-center gap-6 text-sm font-medium text-muted">
                    <a href="#dashboard" class="text-purple-600 dark:text-purple-400 font-semibold">Dashboard</a>
                    <a href="#" class="hover:text-[var(--text-color)] transition-colors">Saved Jobs</a>
                    <a href="#" class="hover:text-[var(--text-color)] transition-colors">Profile</a>
                </div>

                <div class="flex items-center gap-2">
                    <button id="theme-toggle" class="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-200/50 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors" aria-label="Toggle theme">
                        <svg id="theme-icon-sun" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toggle-icon h-5 w-5 hidden"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>
                        <svg id="theme-icon-moon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toggle-icon h-5 w-5"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>
                    </button>
                     <!-- Mobile Menu Button -->
                    <button class="md:hidden h-10 w-10 flex items-center justify-center rounded-xl bg-slate-500/10 dark:bg-white/10 hover:bg-slate-500/20 dark:hover:bg-white/20 transition-colors" aria-label="Open menu">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toggle-icon h-5 w-5"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
                    </button>
                </div>
            </div>
        </div>
    </nav>

    <main id="dashboard" class="px-4 pb-24 pt-28 md:pt-32">
        <div class="max-w-7xl mx-auto">

            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                <h1 class="text-3xl md:text-4xl font-extrabold tracking-tight">Command Center</h1>
                <button class="mt-4 sm:mt-0 w-full sm:w-auto bg-purple-600 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-purple-700 transition-all shadow-lg hover:shadow-purple-500/30 transform hover:-translate-y-0.5 flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10c0-4.42-2.87-8.1-6.84-9.48"></path><path d="M12 2a10 10 0 1 0 10 10c0-4.42-2.87-8.1-6.84-9.48"></path><circle cx="12" cy="12" r="2"></circle><path d="M12 12h.01"></path><path d="M22 12h-2"></path><path d="M6 12H4"></path><path d="m15.5 15.5.7.7"></path><path d="m8.5 8.5.7.7"></path><path d="m15.5 8.5-.7.7"></path><path d="m8.5 15.5-.7.7"></path></svg>
                    Start New Scout
                </button>
            </div>

            <!-- Stat Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <div class="card border rounded-2xl p-5 fade-in" style="animation-delay: 0.1s;">
                    <h3 class="font-semibold text-muted mb-2">New Matches Found</h3>
                    <p class="text-4xl font-bold text-green-500">8</p>
                </div>
                <div class="card border rounded-2xl p-5 fade-in" style="animation-delay: 0.2s;">
                    <h3 class="font-semibold text-muted mb-2">Saved Jobs</h3>
                    <p class="text-4xl font-bold">12</p>
                </div>
                 <div class="card border rounded-2xl p-5 fade-in" style="animation-delay: 0.3s;">
                    <h3 class="font-semibold text-muted mb-2">Application Pipeline</h3>
                    <p class="text-4xl font-bold">4</p>
                </div>
                <div class="card border rounded-2xl p-5 fade-in" style="animation-delay: 0.4s;">
                    <h3 class="font-semibold text-muted mb-2">Companies Tracked</h3>
                    <p class="text-4xl font-bold">25</p>
                </div>
            </div>

            <!-- Main Content: Feed -->
            <div class="space-y-8">
                <div>
                    <h2 class="text-2xl font-bold mb-4">Latest Scout Report</h2>
                    <div class="card border rounded-2xl p-6 space-y-4 fade-in" style="animation-delay: 0.5s;">
                         <div class="flex flex-col sm:flex-row justify-between items-start">
                             <div>
                                <h3 class="text-lg font-bold">Scout for "Ashby"</h3>
                                <p class="text-sm text-muted">Completed just now &bull; 2 new matches found</p>
                             </div>
                             <a href="#" class="mt-3 sm:mt-0 text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline">View Full Report</a>
                         </div>
                         <div class="border-t border-[var(--card-border)] pt-4 flex flex-col sm:flex-row gap-4">
                            <!-- Job Match Snippet -->
                            <div class="flex-1 snippet-bg p-4 rounded-lg">
                                <p class="font-bold">All-around Ashby Expert</p>
                                <p class="text-sm text-muted">Ashby &bull; 95% Match</p>
                            </div>
                            <div class="flex-1 snippet-bg p-4 rounded-lg">
                                <p class="font-bold">Software Engineer, Frontend</p>
                                <p class="text-sm text-muted">Ashby &bull; 88% Match</p>
                            </div>
                         </div>
                    </div>
                </div>

                <div>
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-2xl font-bold">Recently Saved Jobs</h2>
                        <a href="#" class="text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline">View All</a>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Redesigned SavedJobCard -->
                        <div class="card border border-l-4 border-l-yellow-400 rounded-2xl p-5 fade-in" style="animation-delay: 0.6s;"><div class="flex justify-between items-start mb-2"><div class="flex-grow"><h3 class="text-lg font-bold">Senior Frontend Engineer</h3><p class="text-sm text-muted">Stripe</p></div><div class="text-2xl font-bold text-green-500">92%</div></div><div class="flex flex-wrap gap-2"><span class="tag text-xs font-medium px-2.5 py-1 rounded-full">React</span><span class="tag text-xs font-medium px-2.5 py-1 rounded-full">Next.js</span></div></div>
                        <div class="card border border-l-green-400 rounded-2xl p-5 fade-in" style="animation-delay: 0.7s;"><div class="flex justify-between items-start mb-2"><div class="flex-grow"><h3 class="text-lg font-bold">Product Engineer</h3><p class="text-sm text-muted">GitBook</p></div><div class="text-2xl font-bold text-green-500">75%</div></div><div class="flex flex-wrap gap-2"><span class="tag text-xs font-medium px-2.5 py-1 rounded-full">TypeScript</span><span class="tag text-xs font-medium px-2.5 py-1 rounded-full">Node.js</span></div></div>
                    </div>
                </div>
            </div>

        </div>
    </main>

    <script>
        const themeToggle = document.getElementById('theme-toggle');
        const sunIcon = document.getElementById('theme-icon-sun');
        const moonIcon = document.getElementById('theme-icon-moon');
        const docElement = document.documentElement;

        function applyTheme(theme) {
            if (theme === 'dark') {
                docElement.classList.add('dark');
                docElement.classList.remove('light');
                sunIcon.classList.add('hidden');
                moonIcon.classList.remove('hidden');
            } else {
                docElement.classList.remove('dark');
                docElement.classList.add('light');
                sunIcon.classList.remove('hidden');
                moonIcon.classList.add('hidden');
            }
        }
        const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        applyTheme(savedTheme);

        themeToggle.addEventListener('click', () => {
            const currentTheme = docElement.classList.contains('dark') ? 'dark' : 'light';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
        });
    </script>

</body>
</html>
