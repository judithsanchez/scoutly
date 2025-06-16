<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scoutly - Interactive Demo</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; transition: background-color 0.3s ease, color 0.3s ease; }

        /* --- Theme Color System --- */
        :root {
            --bg-color: #f1f5f9;      /* slate-100 */
            --modal-bg: white;
            --modal-border: #e2e8f0;    /* slate-200 */
            --text-color: #0f172a;    /* slate-900 */
            --text-muted: #475569;    /* slate-600 */
            --input-bg: #f8fafc;     /* slate-50 */
            --input-border: #cbd5e1;  /* slate-300 */
            --result-card-bg: #f1f5f9; /* slate-100 */
        }
        .dark {
            --bg-color: #020617;      /* slate-950 */
            --modal-bg: #1e293b;      /* slate-800 */
            --modal-border: #334155;   /* slate-700 */
            --text-color: #f1f5f9;    /* slate-100 */
            --text-muted: #94a3b8;    /* slate-400 */
            --input-bg: #0f172a;     /* slate-900 */
            --input-border: #334155;  /* slate-700 */
            --result-card-bg: #0f172a; /* slate-900 */
        }

        body { background-color: var(--bg-color); color: var(--text-color); }
        .modal-card { background-color: var(--modal-bg); border-color: var(--modal-border); color: var(--text-color); }
        .text-muted { color: var(--text-muted); }
        .input-base { background-color: var(--input-bg); border-color: var(--input-border); }
        .result-card { background-color: var(--result-card-bg); }

        .modal-backdrop { animation: fadeIn 0.3s ease-out forwards; }
        .modal-content { animation: scaleUp 0.3s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

        .progress-bar div { transition: width 0.5s ease-in-out; }
        .accordion-content { overflow: hidden; transition: max-height 0.4s ease, opacity 0.4s ease; max-height: 0; opacity: 0; }
        .accordion-content.expanded { max-height: 500px; opacity: 1; }
    </style>

</head>
<body class="flex items-center justify-center min-h-screen p-4">
    
    <!-- This button is just for the mockup to toggle themes -->
    <button id="theme-toggle" class="fixed top-4 right-4 z-50 h-10 w-10 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700">
         <svg id="theme-icon-sun" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 hidden"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"></path></svg>
         <svg id="theme-icon-moon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>
    </button>

    <!-- The Modal Container -->
    <div id="demo-modal" class="fixed inset-0 z-40 flex items-center justify-center p-4">
        <div id="modal-backdrop" class="modal-backdrop fixed inset-0 bg-black/70 backdrop-blur-sm"></div>

        <!-- Step 1: Input Form -->
        <div id="input-step" class="modal-content modal-card relative w-full max-w-lg rounded-2xl shadow-xl p-8 border">
            <div class="text-center mb-6">
                 <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-500/20 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-purple-600 dark:text-purple-300"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.84l8.57 3.92a2 2 0 0 0 1.66 0l8.57-3.92a1 1 0 0 0 0-1.84Z"/><path d="m22 17.65-8.57-3.92a2 2 0 0 0-1.66 0L3.2 17.65a1 1 0 0 0 0 1.84l8.57 3.92a2 2 0 0 0 1.66 0l8.57-3.92a1 1 0 0 0 0-1.84Z"/><path d="M3.2 6.08 12 10.01l8.8-3.93"/><path d="M12 22.08V12"/></svg>
                </div>
                <h2 class="text-2xl font-bold mb-2">Scoutly Interactive Demo</h2>
                <p class="text-muted">See the AI in action. All data is for this session only and is not saved.</p>
            </div>
            <div class="space-y-4">
                <div>
                    <label for="careers-url" class="block text-sm font-medium text-muted mb-2">Company Careers Page URL</label>
                    <input type="url" id="careers-url" class="input-base block w-full border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition" value="https://www.ashbyhq.com/careers">
                </div>
                <div>
                    <label for="cv-url" class="flex items-center text-sm font-medium text-muted mb-2">
                        <span>Public CV Link (Google Drive)</span>
                        <div class="group relative ml-2">
                             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-500"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                             <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-900 text-slate-300 text-xs rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
                                Your CV file on Google Drive must be public ("Anyone with the link can view"). Scoutly reads the text content to perform its analysis.
                             </div>
                        </div>
                    </label>
                    <input type="url" id="cv-url" class="input-base block w-full border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition" value="https://drive.google.com/file/d/1-0NUsEx0HmnTmcpMOjGSKdOJJ1Vd_uWL/view">
                </div>
                <div class="text-center pt-2">
                    <p class="text-xs text-slate-500">The demo uses a default candidate profile. The full version allows for detailed customization.</p>
                </div>
            </div>
            <div class="mt-8">
                <button id="analyze-btn" class="w-full px-4 py-3 text-white bg-purple-600 rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-lg">
                    Analyze and Find Matches
                </button>
            </div>
        </div>

        <!-- Step 2: Processing State -->
        <div id="processing-step" class="modal-content modal-card hidden relative w-full max-w-lg rounded-2xl shadow-xl p-8 border">
             <div class="text-center">
                <h2 class="text-2xl font-bold mb-4">AI Scout at Work...</h2>
                <div class="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                <div class="space-y-3 text-left">
                    <div id="progress-text" class="text-muted text-center font-medium">Initializing...</div>
                    <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                        <div id="progress-bar" class="bg-purple-500 h-2.5 rounded-full" style="width: 0%"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Step 3: Results View -->
        <div id="results-step" class="modal-content modal-card hidden relative w-full max-w-3xl rounded-2xl shadow-xl p-8 border">
            <div class="text-center mb-6">
                <h2 class="text-2xl font-bold mb-2">Demo Results</h2>
                <p class="text-muted">Found 2 strong matches on the page for the default profile.</p>
            </div>
            <div class="max-h-[60vh] overflow-y-auto pr-2 -mr-4 space-y-4">
                <div class="result-card rounded-lg p-4 border border-[var(--card-border)] border-l-4 border-l-yellow-400">
                    <div class="flex justify-between items-start mb-2"><div><h3 class="text-lg font-bold">All-around Ashby Expert</h3><p class="text-sm text-muted">Ashby</p></div><div class="text-2xl font-bold text-green-400">95%</div></div>
                    <div class="flex flex-wrap gap-2 mt-2 mb-3"><span class="bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full text-xs">React</span><span class="bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full text-xs">TypeScript</span></div>
                </div>
                 <div class="result-card rounded-lg p-4 border border-[var(--card-border)] border-l-4 border-l-yellow-400">
                    <div class="flex justify-between items-start mb-2"><div><h3 class="text-lg font-bold">Software Engineer, Frontend</h3><p class="text-sm text-muted">Ashby</p></div><div class="text-2xl font-bold text-green-400">88%</div></div>
                    <div class="flex flex-wrap gap-2 mt-2 mb-3"><span class="bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full text-xs">React</span><span class="bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full text-xs">Next.js</span></div>
                </div>
            </div>
            <div class="text-center mt-6">
                 <p class="text-xs text-slate-500 mb-4">This is a preview. The full dashboard experience allows you to save, track, and manage all your job prospects.</p>
                <button id="close-btn" class="px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-gray-200 transition-colors shadow-md">Close Demo</button>
            </div>
        </div>
    </div>

    <script>
        const modal = document.getElementById('demo-modal');
        const analyzeBtn = document.getElementById('analyze-btn');
        const closeBtn = document.getElementById('close-btn');
        const inputStep = document.getElementById('input-step');
        const processingStep = document.getElementById('processing-step');
        const resultsStep = document.getElementById('results-step');
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');

        function startDemo() {
            inputStep.style.display = 'none';
            resultsStep.style.display = 'none';
            processingStep.style.display = 'block';

            const stages = [
                { text: 'Scraping career page...', duration: 2000, width: '25%' },
                { text: 'Parsing job listings...', duration: 1500, width: '50%' },
                { text: 'Analyzing CV content...', duration: 1500, width: '75%' },
                { text: 'Matching jobs with AI...', duration: 2000, width: '100%' }
            ];
            let cumulativeDelay = 0;
            stages.forEach((stage, index) => {
                setTimeout(() => {
                    progressText.textContent = stage.text;
                    progressBar.style.width = stage.width;
                    if (index === stages.length - 1) setTimeout(showResults, 500);
                }, cumulativeDelay);
                cumulativeDelay += stage.duration;
            });
        }

        function showResults() {
            processingStep.style.display = 'none';
            resultsStep.style.display = 'block';
        }

        analyzeBtn.addEventListener('click', startDemo);
        if(closeBtn) closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
        if(document.getElementById('modal-backdrop')) document.getElementById('modal-backdrop').addEventListener('click', () => { modal.style.display = 'none'; });

        // Theme Toggle
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
            const newTheme = docElement.classList.contains('dark') ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
        });
    </script>

</body>
</html>
