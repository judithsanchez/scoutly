<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scoutly - Homepage Mockup</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&display=swap" rel="stylesheet">
    <style>
        html {
            scroll-behavior: smooth;
        }
        body {
            font-family: 'Inter', sans-serif;
            transition: background-color 0.3s ease, color 0.3s ease;
        }

        /* --- Theme Color System --- */
        /* Light Theme (default) */
        :root {
            --bg-color: #f8fafc;                /* slate-50 */
            --text-color: #0f172a;              /* slate-900 */
            --text-muted: #475569;              /* slate-600 */
            --nav-bg: rgba(255, 255, 255, 0.7);
            --nav-border: #e2e8f0;              /* slate-200 */
            --card-bg: white;
            --card-border: #e2e8f0;             /* slate-200 */
            --tech-card-bg: #f1f5f9;            /* slate-100 */
            --tech-card-border: #e2e8f0;         /* slate-200 */
            --btn-primary-bg: #1e293b;          /* slate-800 */
            --btn-primary-text: white;
            --btn-primary-hover-bg: #334155;    /* slate-700 */
            --toggle-icon-color: #475569;       /* slate-600 */
        }

        /* Dark Theme */
        .dark {
            --bg-color: #020617;
            --text-color: #f1f5f9;              /* slate-100 */
            --text-muted: #94a3b8;              /* slate-400 */
            --nav-bg: rgba(15, 23, 42, 0.7);    /* slate-900/70 */
            --nav-border: rgba(255, 255, 255, 0.2);
            --card-bg: rgba(2, 6, 23, 0.5);     /* slate-950/50 */
            --card-border: rgba(255, 255, 255, 0.1);
            --tech-card-bg: #1e293b;            /* slate-800 */
            --tech-card-border: #334155;        /* slate-700 */
            --btn-primary-bg: white;
            --btn-primary-text: #0f172a;
            --btn-primary-hover-bg: #e2e8f0;
            --toggle-icon-color: #cbd5e1;       /* slate-300 */
        }

        body {
            background-color: var(--bg-color);
            color: var(--text-color);
        }

        /* Utility classes to apply variables */
        .text-muted { color: var(--text-muted); }
        .nav-card { background-color: var(--nav-bg); border-color: var(--nav-border); }
        .feature-card { background-color: var(--card-bg); border-color: var(--card-border); }
        .tech-card { background-color: var(--tech-card-bg); border-color: var(--tech-card-border); color: var(--text-color);}
        .btn-primary { background-color: var(--btn-primary-bg); color: var(--btn-primary-text); }
        .btn-primary:hover { background-color: var(--btn-primary-hover-bg); }
        .toggle-icon { color: var(--toggle-icon-color); }
        .footer-text { color: #64748b; } /* slate-500 */
        .dark .footer-text { color: #64748b; }

        .background-glows {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background-color: var(--bg-color);
            background-image: radial-gradient(circle at 10% 20%,rgba(168, 85, 247, 0.1),transparent 50%),radial-gradient(circle at 80% 90%,rgba(236, 72, 153, 0.1),transparent 55%),radial-gradient(circle at 50% 50%,rgba(79, 70, 229, 0.08),transparent 50%);
            transition: background-color 0.3s ease;
            z-index: -1;
            animation: move-glows 25s linear infinite;
        }

        .dark .background-glows {
            background-image: radial-gradient(circle at 10% 20%,rgba(168, 85, 247, 0.2),transparent 40%),radial-gradient(circle at 80% 90%,rgba(236, 72, 153, 0.2),transparent 45%),radial-gradient(circle at 50% 50%,rgba(79, 70, 229, 0.15),transparent 40%);
        }

        @keyframes move-glows {
            0% { transform: translate(0, 0) rotate(0deg) scale(1.2); }
            25% { transform: translate(10vw, -10vh) rotate(15deg) scale(1.3); }
            50% { transform: translate(5vw, 15vh) rotate(-10deg) scale(1.2); }
            75% { transform: translate(-10vw, 5vh) rotate(10deg) scale(1.4); }
            100% { transform: translate(0, 0) rotate(0deg) scale(1.2); }
        }

        .gradient-text { background: linear-gradient(90deg, #a855f7, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .fade-in-card { animation: fadeIn 0.5s ease-out forwards; opacity: 0; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

    </style>

</head>
<body>
    <div class="background-glows"></div>

    <!-- Navbar -->
    <nav class="fixed top-0 left-0 right-0 px-4 mt-4 z-40">
        <div class="nav-card mx-auto p-3 rounded-2xl border shadow-lg backdrop-blur-xl max-w-7xl">
            <div class="flex justify-between items-center">
                <a href="#" class="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-purple-600 dark:text-purple-400"><circle cx="12" cy="12" r="2"></circle><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"></path></svg>
                    <span class="text-2xl font-bold tracking-tighter">Scoutly</span>
                </a>

                <div class="hidden md:flex items-center gap-6 text-sm font-medium text-muted">
                    <a href="#how-it-works" class="hover:text-[var(--text-color)] transition-colors">How It Works</a>
                    <a href="#about-project" class="hover:text-[var(--text-color)] transition-colors">About this Project</a>
                    <a href="https://github.com/judithsanchez/scoutly" target="_blank" rel="noopener noreferrer" class="hover:text-[var(--text-color)] transition-colors flex items-center gap-1.5">
                        GitHub
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                    </a>
                </div>

                <div class="flex items-center gap-2">
                    <button id="theme-toggle" class="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-200/50 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors" aria-label="Toggle theme">
                        <svg id="theme-icon-sun" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toggle-icon h-5 w-5 hidden"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>
                        <svg id="theme-icon-moon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toggle-icon h-5 w-5"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>
                    </button>
                    <button class="btn-primary hidden sm:block px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-md">
                        Launch Demo
                    </button>
                    <button class="md:hidden h-10 w-10 flex items-center justify-center rounded-xl bg-slate-500/10 dark:bg-white/10 hover:bg-slate-500/20 dark:hover:bg-white/20 transition-colors" aria-label="Open menu">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toggle-icon h-5 w-5"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
                    </button>
                </div>
            </div>
        </div>
    </nav>

    <main class="relative z-10">
        <section class="w-full pt-32 md:pt-48 pb-16 md:pb-20 px-4 text-center">
            <h1 class="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tighter mb-6">Stop searching. <br class="hidden sm:block" /> Start <span class="gradient-text">matching.</span></h1>
            <p class="max-w-3xl mx-auto text-base md:text-lg text-muted mb-10">Scoutly was born from a simple frustration: job hunting is tedious. We built an AI-powered scout that tirelessly scans the web for you, matching your unique skills to the perfect opportunities, so you can focus on what matters.</p>
            <a href="#about-project" class="px-8 py-3 text-base font-bold rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-md">Launch Interactive Demo</a>
        </section>

        <section id="how-it-works" class="w-full max-w-6xl mx-auto px-4 py-10 md:py-20">
            <h2 class="text-3xl md:text-4xl font-bold text-center mb-12">How It Works</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div class="fade-in-card feature-card p-6 md:p-8 rounded-2xl border"><div class="flex items-center justify-center h-16 w-16 mb-6 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></div><h3 class="text-xl md:text-2xl font-bold mb-3">1. Provide Your CV</h3><p class="text-muted">Give our AI scout your resume. It analyzes your unique skills, experience, and career goals to understand exactly what you're looking for.</p></div>
                <div class="fade-in-card feature-card p-6 md:p-8 rounded-2xl border"><div class="flex items-center justify-center h-16 w-16 mb-6 rounded-full bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-300"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg></div><h3 class="text-xl md:text-2xl font-bold mb-3">2. We Scout the Web</h3><p class="text-muted">Our system works around the clock, scraping hundreds of company career pages. It intelligently filters out the noise to find new, relevant job postings.</p></div>
                <div class="fade-in-card feature-card p-6 md:p-8 rounded-2xl border"><div class="flex items-center justify-center h-16 w-16 mb-6 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-300"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg></div><h3 class="text-xl md:text-2xl font-bold mb-3">3. Get Perfect Matches</h3><p class="text-muted">Receive a curated list of jobs that are a true fit, complete with a suitability score and breakdown of why it matches your profile.</p></div>
            </div>
        </section>

        <section id="about-project" class="w-full max-w-6xl mx-auto px-4 py-10 md:py-20"><div class="text-center"><h2 class="text-3xl md:text-4xl font-bold mb-4">About this Project</h2><p class="max-w-3xl mx-auto text-base md:text-lg text-muted mb-12">Scoutly is a personal portfolio project designed to showcase a modern, full-stack application architecture. It demonstrates skills in AI integration, web scraping, database management, and building a responsive, interactive user interface.</p><div class="flex flex-wrap justify-center items-center gap-3 sm:gap-4"><div class="fade-in-card tech-card rounded-lg px-4 py-2 text-sm font-medium border">Next.js</div><div class="fade-in-card tech-card rounded-lg px-4 py-2 text-sm font-medium border">TypeScript</div><div class="fade-in-card tech-card rounded-lg px-4 py-2 text-sm font-medium border">Tailwind CSS</div><div class="fade-in-card tech-card rounded-lg px-4 py-2 text-sm font-medium border">Playwright</div><div class="fade-in-card tech-card rounded-lg px-4 py-2 text-sm font-medium border">MongoDB</div><div class="fade-in-card tech-card rounded-lg px-4 py-2 text-sm font-medium border">Google Gemini</div></div><div class="mt-12"><a href="https://github.com/judithsanchez/scoutly" target="_blank" rel="noopener noreferrer" class="inline-block px-6 py-3 text-base font-bold rounded-xl bg-purple-100 text-purple-700 border border-purple-200 hover:bg-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-700/50 dark:hover:bg-purple-900 transition-colors">View Source Code on GitHub</a></div></div></section>

        <footer class="text-center py-10 border-t border-slate-200 dark:border-white/10 mt-10 md:mt-20"><p class="footer-text">A Portfolio Project by Judith Sanchez</p></footer>
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

        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                document.querySelector(this.getAttribute('href')).scrollIntoView({ behavior: 'smooth' });
            });
        });
    </script>

</body>
</html>
