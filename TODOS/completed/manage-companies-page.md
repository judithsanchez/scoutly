<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scoutly - Manage Companies</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; transition: background-color 0.3s ease, color 0.3s ease; }
        :root {
            --bg-color: #f1f5f9; --card-bg: white; --card-border: #e2e8f0; --text-color: #0f172a; --text-muted: #64748b; --input-bg: white; --input-border: #cbd5e1; --nav-bg: rgba(255,255,255,0.7); --nav-border: #e2e8f0; --toggle-icon-color: #475569; --btn-filter-bg: #e2e8f0; --btn-filter-text: #334155; --btn-filter-hover-bg: #cbd5e1;
        }
        .dark {
            --bg-color: #020617; --card-bg: #0f172a; --card-border: #1e293b; --text-color: #f1f5f9; --text-muted: #94a3b8; --input-bg: #1e293b; --input-border: #334155; --nav-bg: rgba(15,23,42,0.7); --nav-border: rgba(255,255,255,0.2); --toggle-icon-color: #cbd5e1; --btn-filter-bg: #1e293b; --btn-filter-text: #e2e8f0; --btn-filter-hover-bg: #334155;
        }
        body { background-color: var(--bg-color); color: var(--text-color); }
        .card { background-color: var(--card-bg); border-color: var(--card-border); }
        .input { background-color: var(--input-bg); border-color: var(--input-border); }
        .text-muted { color: var(--text-muted); }
        .nav-card { background-color: var(--nav-bg); border-color: var(--nav-border); }
        .toggle-icon { color: var(--toggle-icon-color); }
        .btn-filter { background-color: var(--btn-filter-bg); color: var(--btn-filter-text); }
        .btn-filter:hover { background-color: var(--btn-filter-hover-bg); }
        .btn-filter.active { background-color: #9333ea; color: white; }
        
        .switch-bg { transition: background-color .2s ease-in-out; }
        .switch-handle { transition: transform .2s ease-in-out; }
        input:checked + .switch-bg { background-color: #9333ea; }
        input:checked + .switch-bg .switch-handle { transform: translateX(100%); }
    </style>
</head>
<body class="bg-slate-100 dark:bg-slate-950">
    <header class="w-full p-4 sticky top-0 z-30 bg-[var(--bg-color)]/80 backdrop-blur-lg mb-8">
         <div class="mx-auto flex justify-between items-center max-w-7xl">
            <a href="#" class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-purple-600 dark:text-purple-400"><circle cx="12" cy="12" r="2"></circle><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"></path></svg>
                <span class="text-2xl font-bold tracking-tighter text-slate-900 dark:text-white">Scoutly</span>
            </a>
            <div class="flex items-center gap-2">
                <button id="theme-toggle" class="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-200/50 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors" aria-label="Toggle theme">
                    <svg id="theme-icon-sun" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toggle-icon h-5 w-5 hidden"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>
                    <svg id="theme-icon-moon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toggle-icon h-5 w-5"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>
                </button>
            </div>
        </div>
    </header>

    <main class="px-4 pb-24">
        <div class="max-w-7xl mx-auto">
            <h1 class="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">Track Companies</h1>
            <p class="text-muted mb-8">Select the companies you want Scoutly to monitor for new job openings.</p>

            <!-- Filter Section -->
            <div class="card border rounded-2xl p-6 mb-8">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                    <!-- Text Search -->
                    <div>
                        <label for="search" class="block text-sm font-medium text-muted mb-2">Search</label>
                        <input type="text" id="search-input" placeholder="Company name..." class="input w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                    </div>

                    <!-- Work Model Filter -->
                    <div>
                        <label class="block text-sm font-medium text-muted mb-2">Work Model</label>
                        <div id="work-model-filters" class="flex gap-2">
                            <button data-filter="all" class="btn-filter active flex-1 px-3 py-2 text-sm font-semibold rounded-lg transition-colors">All</button>
                            <button data-filter="FULLY_REMOTE" class="btn-filter flex-1 px-3 py-2 text-sm font-semibold rounded-lg transition-colors">Remote</button>
                            <button data-filter="HYBRID" class="btn-filter flex-1 px-3 py-2 text-sm font-semibold rounded-lg transition-colors">Hybrid</button>
                        </div>
                    </div>

                    <!-- Ranking Slider -->
                    <div>
                        <label for="ranking-slider" class="block text-sm font-medium text-muted mb-2">Min. Ranking: <span id="ranking-value" class="font-bold text-purple-600 dark:text-purple-400">50</span></label>
                        <input type="range" id="ranking-slider" min="0" max="100" value="50" class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer">
                    </div>

                    <!-- Sort Dropdown -->
                     <div>
                        <label for="sort-select" class="block text-sm font-medium text-muted mb-2">Sort By</label>
                        <select id="sort-select" class="input w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                            <option value="name-asc">Name (A-Z)</option>
                            <option value="name-desc">Name (Z-A)</option>
                            <option value="ranking-desc">Ranking (High-Low)</option>
                            <option value="ranking-asc">Ranking (Low-High)</option>
                        </select>
                    </div>
                </div>
            </div>

            <div id="company-grid" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <!-- Company Cards will be populated by JS -->
            </div>
        </div>
    </main>

    <script>
        const companies = [
            { id: 'ashby', name: 'Ashby', field: 'Recruiting & HR Tech', workModel: 'FULLY_REMOTE', ranking: 95, tracked: true },
            { id: 'stripe', name: 'Stripe', field: 'Fintech & Payments', workModel: 'HYBRID', ranking: 92, tracked: false },
            { id: 'google', name: 'Google', field: 'Search & Cloud', workModel: 'HYBRID', ranking: 98, tracked: true },
            { id: 'netlify', name: 'Netlify', field: 'Web Development', workModel: 'FULLY_REMOTE', ranking: 88, tracked: false },
            { id: 'apple', name: 'Apple', field: 'Consumer Electronics', workModel: 'IN_OFFICE', ranking: 97, tracked: false },
            { id: 'doist', name: 'Doist', field: 'Productivity', workModel: 'FULLY_REMOTE', ranking: 85, tracked: true },
            { id: 'miro', name: 'Miro', field: 'Collaboration', workModel: 'HYBRID', ranking: 90, tracked: false },
            { id: 'zapier', name: 'Zapier', field: 'Automation', workModel: 'FULLY_REMOTE', ranking: 93, tracked: true },
        ];

        const companyGrid = document.getElementById('company-grid');
        const searchInput = document.getElementById('search-input');
        const workModelFilters = document.getElementById('work-model-filters');
        const rankingSlider = document.getElementById('ranking-slider');
        const rankingValue = document.getElementById('ranking-value');
        const sortSelect = document.getElementById('sort-select');

        let currentFilters = {
            search: '',
            workModel: 'all',
            ranking: 50
        };

        const companyCardHTML = (company) => `
            <div class="company-card card border rounded-2xl p-5 flex flex-col justify-between"
                 data-name="${company.name.toLowerCase()}"
                 data-work-model="${company.workModel}"
                 data-ranking="${company.ranking}">
                <div>
                    <h3 class="font-bold text-lg">${company.name}</h3>
                    <p class="text-muted text-sm mt-1">${company.field}</p>
                </div>
                <div class="mt-4 flex items-center justify-between">
                    <span class="text-sm font-medium ${company.tracked ? 'text-green-500' : 'text-muted'}">${company.tracked ? 'Tracking' : 'Not Tracking'}</span>
                    <label class="inline-flex items-center cursor-pointer">
                        <input type="checkbox" class="sr-only peer" ${company.tracked ? 'checked' : ''}>
                        <div class="switch-bg relative w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 peer-checked:bg-purple-600">
                           <div class="switch-handle peer-checked:translate-x-full absolute top-0.5 left-[2px] bg-white h-5 w-5 rounded-full"></div>
                        </div>
                    </label>
                </div>
            </div>`;

        function renderCompanies() {
            let companiesToRender = [...companies];

            // Filter
            companiesToRender = companiesToRender.filter(c => {
                const searchMatch = c.name.toLowerCase().includes(currentFilters.search);
                const workModelMatch = currentFilters.workModel === 'all' || c.workModel === currentFilters.workModel;
                const rankingMatch = c.ranking >= currentFilters.ranking;
                return searchMatch && workModelMatch && rankingMatch;
            });

            // Sort
            const sortValue = sortSelect.value;
            companiesToRender.sort((a, b) => {
                if (sortValue === 'name-asc') return a.name.localeCompare(b.name);
                if (sortValue === 'name-desc') return b.name.localeCompare(a.name);
                if (sortValue === 'ranking-desc') return b.ranking - a.ranking;
                if (sortValue === 'ranking-asc') return a.ranking - b.ranking;
                return 0;
            });

            companyGrid.innerHTML = companiesToRender.map(companyCardHTML).join('');
        }

        // Event Listeners
        searchInput.addEventListener('input', (e) => {
            currentFilters.search = e.target.value.toLowerCase();
            renderCompanies();
        });

        workModelFilters.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                workModelFilters.querySelector('.active').classList.remove('active');
                e.target.classList.add('active');
                currentFilters.workModel = e.target.dataset.filter;
                renderCompanies();
            }
        });

        rankingSlider.addEventListener('input', (e) => {
            currentFilters.ranking = parseInt(e.target.value, 10);
            rankingValue.textContent = e.target.value;
            renderCompanies();
        });

        sortSelect.addEventListener('change', renderCompanies);

        // Theme Toggle Logic
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

        // Initial render
        renderCompanies();

    </script>

</body>
</html>
