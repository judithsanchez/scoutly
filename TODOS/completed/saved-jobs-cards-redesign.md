<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Redesigned Saved Job Cards</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #020617; /* slate-950 */
        }
        /* Simple animation for the accordion */
        .accordion-content {
            overflow: hidden;
            transition: max-height 0.4s ease-in-out, opacity 0.4s ease-in-out;
            max-height: 0;
            opacity: 0;
        }
        .accordion-content.expanded {
            max-height: 500px; /* Adjust as needed */
            opacity: 1;
        }
    </style>
</head>
<body class="p-4 sm:p-8">

    <div class="max-w-3xl mx-auto">
        <h1 class="text-4xl font-extrabold tracking-tight text-white mb-2 text-center">Saved Jobs</h1>
        <p class="text-slate-400 mb-10 text-center">A visual mockup of the redesigned job cards.</p>

        <!-- Card 1: Want to Apply (Expanded by default) -->
        <div id="job-card-1" class="job-card bg-slate-800/80 rounded-lg p-6 shadow-lg transition-all duration-300 ease-in-out border-l-4 border-l-yellow-400 hover:bg-yellow-400/10 transform hover:scale-[1.02] mb-6">
            <div class="flex justify-between items-start mb-4">
                <div class="flex-grow">
                    <h3 class="text-xl font-bold text-white mb-1">Senior Frontend Engineer</h3>
                    <p class="text-slate-400 font-medium">Stripe</p>
                    <p class="text-slate-500 text-sm mt-1">Amsterdam, Netherlands</p>
                </div>
                <div class="flex flex-col items-end gap-3 shrink-0 ml-4">
                    <div class="text-3xl font-bold text-green-400">92%</div>
                    <div class="flex items-center gap-2">
                        <button class="status-btn p-2 rounded-full transition-colors bg-yellow-400/20 text-yellow-400" title="Want to Apply">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                        </button>
                        <button class="status-btn p-2 rounded-full transition-colors text-slate-400 hover:bg-slate-700" title="Mark as Applied">
                           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>
                        </button>
                        <button class="status-btn p-2 rounded-full transition-colors text-slate-400 hover:bg-slate-700" title="Discard">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8v13H3V8"></path><path d="M1 3h22v5H1z"></path><path d="M10 12h4"></path></svg>
                        </button>
                    </div>
                </div>
            </div>
            <div class="flex flex-wrap gap-2 mb-4">
                <span class="bg-slate-700 text-slate-200 px-2.5 py-1 rounded-full text-xs font-medium">React</span>
                <span class="bg-slate-700 text-slate-200 px-2.5 py-1 rounded-full text-xs font-medium">TypeScript</span>
                <span class="bg-slate-700 text-slate-200 px-2.5 py-1 rounded-full text-xs font-medium">Next.js</span>
                <span class="bg-slate-700 text-slate-200 px-2.5 py-1 rounded-full text-xs font-medium">GraphQL</span>
            </div>
            <div class="border-t border-slate-700 pt-4">
                <button class="expand-btn text-slate-400 hover:text-white text-sm font-semibold flex items-center gap-2 w-full text-left">
                    <span>Hide AI Evaluation</span>
                    <svg class="w-4 h-4 transform transition-transform duration-300 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                <div class="accordion-content expanded mt-4 space-y-4 text-sm">
                    <div>
                        <h4 class="font-semibold text-green-400 mb-2">✅ Good Fit Reasons</h4>
                        <ul class="list-disc list-inside text-slate-300 space-y-1.5">
                            <li>Excellent match with your 5+ years of React and TypeScript experience.</li>
                            <li>Company uses Next.js, aligning with your career goals.</li>
                            <li>Role focuses on user-facing product development, a stated preference.</li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="font-semibold text-yellow-400 mb-2">⚠️ Points to Consider</h4>
                        <ul class="list-disc list-inside text-slate-300 space-y-1.5">
                            <li>Requires experience with GraphQL, which is a secondary skill for you.</li>
                            <li>The role is in a fast-paced environment which may require occasional on-call duties.</li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="font-semibold text-blue-400 mb-2">🚀 Stretch Goals</h4>
                        <ul class="list-disc list-inside text-slate-300 space-y-1.5">
                            <li>Opportunity to become a subject-matter expert in GraphQL.</li>
                            <li>Potential to mentor junior developers on the team.</li>
                        </ul>
                    </div>
                    <div class="pt-2">
                        <a href="#" class="text-purple-400 hover:text-purple-300 font-semibold text-sm inline-flex items-center gap-1.5">
                            View Original Job Posting
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                        </a>
                    </div>
                </div>
            </div>
        </div>

        <!-- Card 2: Applied -->
        <div id="job-card-2" class="job-card bg-slate-800/80 rounded-lg p-6 shadow-lg transition-all duration-300 ease-in-out border-l-4 border-l-green-400 hover:bg-green-400/10 transform hover:scale-[1.02] mb-6">
            <div class="flex justify-between items-start mb-4">
                 <div class="flex-grow">
                    <h3 class="text-xl font-bold text-white mb-1">Product Engineer</h3>
                    <p class="text-slate-400 font-medium">GitBook</p>
                    <p class="text-slate-500 text-sm mt-1">EU (Remote)</p>
                </div>
                <div class="flex flex-col items-end gap-3 shrink-0 ml-4">
                    <div class="text-3xl font-bold text-green-400">75%</div>
                    <div class="flex items-center gap-2">
                         <button class="status-btn p-2 rounded-full transition-colors text-slate-400 hover:bg-slate-700" title="Want to Apply">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                        </button>
                        <button class="status-btn p-2 rounded-full transition-colors bg-green-400/20 text-green-400" title="Mark as Applied">
                           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>
                        </button>
                        <button class="status-btn p-2 rounded-full transition-colors text-slate-400 hover:bg-slate-700" title="Discard">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8v13H3V8"></path><path d="M1 3h22v5H1z"></path><path d="M10 12h4"></path></svg>
                        </button>
                    </div>
                </div>
            </div>
            <div class="flex flex-wrap gap-2 mb-4">
                <span class="bg-slate-700 text-slate-200 px-2.5 py-1 rounded-full text-xs font-medium">TypeScript</span>
                <span class="bg-slate-700 text-slate-200 px-2.5 py-1 rounded-full text-xs font-medium">Node.js</span>
                <span class="bg-slate-700 text-slate-200 px-2.5 py-1 rounded-full text-xs font-medium">Cloudflare Workers</span>
            </div>
            <div class="border-t border-slate-700 pt-4">
                <button class="expand-btn text-slate-400 hover:text-white text-sm font-semibold flex items-center gap-2 w-full text-left">
                    <span>Show AI Evaluation</span>
                    <svg class="w-4 h-4 transform transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                <div class="accordion-content mt-4 space-y-4 text-sm">
                    <!-- Hidden content -->
                </div>
            </div>
        </div>

        <!-- Card 3: Discarded -->
        <div id="job-card-3" class="job-card bg-slate-800/80 rounded-lg p-6 shadow-lg transition-all duration-300 ease-in-out border-l-4 border-l-red-500 hover:bg-red-500/10 transform hover:scale-[1.02] opacity-60 mb-6">
             <div class="flex justify-between items-start mb-4">
                 <div class="flex-grow">
                    <h3 class="text-xl font-bold text-white mb-1">Lead DevOps Engineer</h3>
                    <p class="text-slate-400 font-medium">DataDog</p>
                    <p class="text-slate-500 text-sm mt-1">New York, USA (On-site)</p>
                </div>
                <div class="flex flex-col items-end gap-3 shrink-0 ml-4">
                    <div class="text-3xl font-bold text-green-400">35%</div>
                    <div class="flex items-center gap-2">
                         <button class="status-btn p-2 rounded-full transition-colors text-slate-400 hover:bg-slate-700" title="Want to Apply">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                        </button>
                        <button class="status-btn p-2 rounded-full transition-colors text-slate-400 hover:bg-slate-700" title="Mark as Applied">
                           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>
                        </button>
                        <button class="status-btn p-2 rounded-full transition-colors bg-red-500/20 text-red-400" title="Discard">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8v13H3V8"></path><path d="M1 3h22v5H1z"></path><path d="M10 12h4"></path></svg>
                        </button>
                    </div>
                </div>
            </div>
            <div class="flex flex-wrap gap-2 mb-4">
                 <span class="bg-slate-700 text-slate-200 px-2.5 py-1 rounded-full text-xs font-medium">AWS</span>
                 <span class="bg-slate-700 text-slate-200 px-2.5 py-1 rounded-full text-xs font-medium">Kubernetes</span>
                 <span class="bg-slate-700 text-slate-200 px-2.5 py-1 rounded-full text-xs font-medium">Terraform</span>
            </div>
             <div class="border-t border-slate-700 pt-4">
                <button class="expand-btn text-slate-400 hover:text-white text-sm font-semibold flex items-center gap-2 w-full text-left">
                    <span>Show AI Evaluation</span>
                    <svg class="w-4 h-4 transform transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                <div class="accordion-content mt-4 space-y-4 text-sm">
                     <!-- Hidden content -->
                </div>
            </div>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const cards = document.querySelectorAll('.job-card');

            cards.forEach(card => {
                const expandBtn = card.querySelector('.expand-btn');
                const content = card.querySelector('.accordion-content');
                const icon = expandBtn.querySelector('svg');
                const text = expandBtn.querySelector('span');

                let isExpanded = content.classList.contains('expanded');

                expandBtn.addEventListener('click', () => {
                    isExpanded = !isExpanded;
                    content.classList.toggle('expanded', isExpanded);
                    icon.classList.toggle('rotate-180', isExpanded);
                    text.textContent = isExpanded ? 'Hide AI Evaluation' : 'Show AI Evaluation';
                });
            });
        });
    </script>

</body>
</html>
