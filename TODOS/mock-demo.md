<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scoutly - Interactive Demo</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
        .modal-backdrop {
            animation: fadeIn 0.3s ease-out forwards;
        }
        .modal-content {
            animation: scaleUp 0.3s ease-out forwards;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes scaleUp {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        .progress-bar div {
            transition: width 0.5s ease-in-out;
        }
         .accordion-content {
            overflow: hidden;
            transition: max-height 0.4s ease-in-out, opacity 0.4s ease-in-out;
            max-height: 0;
            opacity: 0;
        }
        .accordion-content.expanded {
            max-height: 500px;
            opacity: 1;
        }
    </style>
</head>
<body class="bg-slate-950 flex items-center justify-center min-h-screen p-4">

    <!-- The Modal Container -->
    <div id="demo-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div id="modal-backdrop" class="modal-backdrop fixed inset-0 bg-black/70 backdrop-blur-sm"></div>

        <!-- Step 1: Input Form -->
        <div id="input-step" class="modal-content relative w-full max-w-lg bg-slate-800 rounded-2xl shadow-xl p-8 text-white border border-slate-700">
            <div class="text-center mb-6">
                 <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-500/20 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-purple-300"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.84l8.57 3.92a2 2 0 0 0 1.66 0l8.57-3.92a1 1 0 0 0 0-1.84Z"/><path d="m22 17.65-8.57-3.92a2 2 0 0 0-1.66 0L3.2 17.65a1 1 0 0 0 0 1.84l8.57 3.92a2 2 0 0 0 1.66 0l8.57-3.92a1 1 0 0 0 0-1.84Z"/><path d="M3.2 6.08 12 10.01l8.8-3.93"/><path d="M12 22.08V12"/></svg>
                </div>
                <h2 class="text-2xl font-bold mb-2">Scoutly Interactive Demo</h2>
                <p class="text-slate-400">See the AI in action. All data is for this session only and is not saved.</p>
            </div>
            <div class="space-y-4">
                <div>
                    <label for="careers-url" class="block text-sm font-medium text-slate-300 mb-2">Company Careers Page URL</label>
                    <input type="url" id="careers-url" class="block w-full bg-slate-700/50 border border-slate-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition" value="https://www.ashbyhq.com/careers">
                </div>
                <div>
                    <label for="cv-url" class="flex items-center text-sm font-medium text-slate-300 mb-2">
                        <span>Public CV Link (Google Drive)</span>
                        <div class="group relative ml-2">
                             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-500"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                             <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-900 text-slate-300 text-xs rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
                                Your CV file on Google Drive must be public ("Anyone with the link can view"). Scoutly reads the text content to perform its analysis.
                             </div>
                        </div>
                    </label>
                    <input type="url" id="cv-url" class="block w-full bg-slate-700/50 border border-slate-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition" value="https://drive.google.com/file/d/1-0NUsEx0HmnTmcpMOjGSKdOJJ1Vd_uWL/view">
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
        <div id="processing-step" class="modal-content hidden relative w-full max-w-lg bg-slate-800 rounded-2xl shadow-xl p-8 text-white border border-slate-700">
             <div class="text-center">
                <h2 class="text-2xl font-bold mb-4">AI Scout at Work...</h2>
                <div class="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                <div class="space-y-3 text-left">
                    <div id="progress-text" class="text-slate-300 text-center font-medium">Initializing...</div>
                    <div class="w-full bg-slate-700 rounded-full h-2.5">
                        <div id="progress-bar" class="bg-purple-500 h-2.5 rounded-full" style="width: 0%"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Step 3: Results View -->
        <div id="results-step" class="modal-content hidden relative w-full max-w-3xl bg-slate-800 rounded-2xl shadow-xl p-8 text-white border border-slate-700">
            <div class="text-center mb-6">
                <h2 class="text-2xl font-bold mb-2">Demo Results</h2>
                <p class="text-slate-400">Found 2 strong matches on the page for the default profile.</p>
            </div>
            <div class="max-h-[60vh] overflow-y-auto pr-2 -mr-4 space-y-4">
                <!-- Card 1: Expanded -->
                <div class="bg-slate-900/50 rounded-lg p-4 shadow-lg border-l-4 border-l-yellow-400">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <h3 class="text-lg font-bold text-white mb-1">All-around Ashby Expert</h3>
                            <p class="text-slate-400 text-sm">Ashby</p>
                        </div>
                        <div class="text-2xl font-bold text-green-400">95%</div>
                    </div>
                    <div class="flex flex-wrap gap-2 mt-2 mb-3">
                         <span class="bg-slate-700 text-slate-200 px-2 py-0.5 rounded-full text-xs">React</span>
                         <span class="bg-slate-700 text-slate-200 px-2 py-0.5 rounded-full text-xs">TypeScript</span>
                    </div>
                     <button class="expand-btn text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-1 w-full text-left">
                        <span>Hide Evaluation</span>
                        <svg class="w-3 h-3 transform transition-transform duration-300 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"></path></svg>
                    </button>
                    <div class="accordion-content expanded mt-3 space-y-3 text-xs border-t border-slate-700 pt-3">
                        <div>
                            <h4 class="font-semibold text-green-400 mb-1">✅ Good Fit Reasons</h4>
                            <ul class="list-disc list-inside text-slate-300 space-y-1"><li>Strong match for React & TypeScript.</li><li>Aligns with goal of using modern tech.</li></ul>
                        </div>
                        <div>
                            <h4 class="font-semibold text-yellow-400 mb-1">⚠️ Points to Consider</h4>
                            <ul class="list-disc list-inside text-slate-300 space-y-1"><li>Requires some knowledge of Ruby on Rails.</li></ul>
                        </div>
                    </div>
                </div>
                 <!-- Card 2 -->
                 <div class="bg-slate-900/50 rounded-lg p-4 shadow-lg border-l-4 border-l-yellow-400">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <h3 class="text-lg font-bold text-white mb-1">Software Engineer, Frontend</h3>
                            <p class="text-slate-400 text-sm">Ashby</p>
                        </div>
                        <div class="text-2xl font-bold text-green-400">88%</div>
                    </div>
                     <div class="flex flex-wrap gap-2 mt-2 mb-3">
                         <span class="bg-slate-700 text-slate-200 px-2 py-0.5 rounded-full text-xs">React</span>
                         <span class="bg-slate-700 text-slate-200 px-2 py-0.5 rounded-full text-xs">Next.js</span>
                    </div>
                     <button class="expand-btn text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-1 w-full text-left">
                        <span>Show Evaluation</span>
                        <svg class="w-3 h-3 transform transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"></path></svg>
                    </button>
                     <div class="accordion-content mt-3 space-y-3 text-xs border-t border-slate-700 pt-3"></div>
                </div>
            </div>
            <div class="text-center mt-6">
                 <p class="text-xs text-slate-500 mb-4">This is a preview. The full dashboard experience allows you to save, track, and manage all your job prospects.</p>
                <button id="close-btn" class="px-5 py-2.5 rounded-xl text-sm font-semibold bg-white text-slate-900 hover:bg-gray-200 transition-colors shadow-md">
                    Close Demo
                </button>
            </div>
        </div>

    </div>

    <script>
        const modal = document.getElementById('demo-modal');
        const backdrop = document.getElementById('modal-backdrop');
        const analyzeBtn = document.getElementById('analyze-btn');
        const closeBtn = document.getElementById('close-btn');

        const inputStep = document.getElementById('input-step');
        const processingStep = document.getElementById('processing-step');
        const resultsStep = document.getElementById('results-step');

        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');

        function startDemo() {
            inputStep.classList.add('hidden');
            processingStep.classList.remove('hidden');

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
                    if (index === stages.length - 1) {
                        setTimeout(showResults, 500);
                    }
                }, cumulativeDelay);
                cumulativeDelay += stage.duration;
            });
        }

        function showResults() {
            processingStep.classList.add('hidden');
            resultsStep.classList.remove('hidden');
            setupAccordion();
        }

        function closeModal() {
            // In a real app, this would hide the modal. For this static demo, we'll just log it.
            console.log('Closing modal');
        }

        function setupAccordion() {
             resultsStep.querySelectorAll('.expand-btn').forEach(button => {
                button.addEventListener('click', () => {
                    const content = button.nextElementSibling;
                    const icon = button.querySelector('svg');
                    const text = button.querySelector('span');

                    const isExpanded = content.classList.toggle('expanded');
                    icon.classList.toggle('rotate-180', isExpanded);
                    text.textContent = isExpanded ? 'Hide Evaluation' : 'Show Evaluation';
                });
            });
        }

        analyzeBtn.addEventListener('click', startDemo);
        closeBtn.addEventListener('click', closeModal);
        backdrop.addEventListener('click', closeModal);
    </script>

</body>
</html>
