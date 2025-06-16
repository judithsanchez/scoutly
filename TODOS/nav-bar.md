<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Navbar Component</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
            transition: background-color 0.3s ease, color 0.3s ease;
            padding: 1rem;
        }

        /* --- Theme Color System --- */
        :root {
            --bg-color: #f8fafc;                /* slate-50 */
            --text-color: #0f172a;              /* slate-900 */
            --text-muted: #475569;              /* slate-600 */
            --nav-bg: rgba(255, 255, 255, 0.7);
            --nav-border: #e2e8f0;              /* slate-200 */
            --btn-primary-bg: #1e293b;          /* slate-800 */
            --btn-primary-text: white;
            --btn-primary-hover-bg: #334155;    /* slate-700 */
            --toggle-icon-color: #475569;       /* slate-600 */
        }
        .dark {
            --bg-color: #020617;
            --text-color: #f1f5f9;              /* slate-100 */
            --text-muted: #94a3b8;              /* slate-400 */
            --nav-bg: rgba(15, 23, 42, 0.7);    /* slate-900/70 */
            --nav-border: rgba(255, 255, 255, 0.2);
            --btn-primary-bg: white;
            --btn-primary-text: #0f172a;
            --btn-primary-hover-bg: #e2e8f0;
            --toggle-icon-color: #cbd5e1;       /* slate-300 */
        }

        body { background-color: var(--bg-color); color: var(--text-color); }
        .text-muted { color: var(--text-muted); }
        .nav-card { background-color: var(--nav-bg); border-color: var(--nav-border); }
        .btn-primary { background-color: var(--btn-primary-bg); color: var(--btn-primary-text); }
        .btn-primary:hover { background-color: var(--btn-primary-hover-bg); }
        .toggle-icon { color: var(--toggle-icon-color); }
        .logo-text { color: var(--text-color); }

        .mobile-menu {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease-out;
        }
        .mobile-menu.open {
            max-height: 500px;
        }
    </style>

</head>
<body>
    <nav id="navbar" class="w-full">
        <div class="nav-card mx-auto p-3 rounded-2xl border shadow-lg backdrop-blur-xl max-w-7xl">
            <div class="flex justify-between items-center">
                <a href="#" class="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-purple-600 dark:text-purple-400"><circle cx="12" cy="12" r="2"></circle><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"></path></svg>
                    <span class="logo-text text-2xl font-bold tracking-tighter">Scoutly</span>
                </a>

                <div class="hidden md:flex items-center gap-6 text-sm font-medium text-muted">
                    <a href="#" class="hover:text-[var(--text-color)] transition-colors">How It Works</a>
                    <a href="#" class="hover:text-[var(--text-color)] transition-colors">About this Project</a>
                    <a href="#" target="_blank" rel="noopener noreferrer" class="hover:text-[var(--text-color)] transition-colors flex items-center gap-1.5">
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
                    <button id="mobile-menu-btn" class="md:hidden h-10 w-10 flex items-center justify-center rounded-xl bg-slate-500/10 dark:bg-white/10 hover:bg-slate-500/20 dark:hover:bg-white/20 transition-colors" aria-label="Open menu">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toggle-icon h-5 w-5"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
                    </button>
                </div>
            </div>
        </div>
        <!-- Mobile Menu -->
        <div id="mobile-menu" class="mobile-menu md:hidden mt-2 nav-card rounded-2xl border shadow-lg backdrop-blur-xl p-4">
            <a href="#how-it-works" class="block py-2 text-muted hover:text-[var(--text-color)]">How It Works</a>
            <a href="#about-project" class="block py-2 text-muted hover:text-[var(--text-color)]">About this Project</a>
            <a href="https://github.com/judithsanchez/scoutly" target="_blank" rel="noopener noreferrer" class="block py-2 text-muted hover:text-[var(--text-color)]">GitHub</a>
             <button class="btn-primary w-full mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-md">
                Launch Demo
            </button>
        </div>
    </nav>

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

        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('open');
        });
    </script>

</body>
</html>
