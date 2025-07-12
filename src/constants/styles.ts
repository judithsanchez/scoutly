/**
 * Common styling constants used throughout the application
 */

export const MAIN_CONTAINER = 'container mx-auto px-4 py-8';
export const CARD_CONTAINER =
	'bg-white dark:bg-slate-900 rounded-lg shadow-md p-6 my-4 relative';
export const FLEX_CENTER = 'flex items-center justify-center';
export const FLEX_BETWEEN = 'flex items-center justify-between';
export const FLEX_COL = 'flex flex-col';

export const HEADING_LG =
	'text-3xl font-bold text-slate-900 dark:text-white mb-6';
export const HEADING_MD =
	'text-xl font-semibold text-slate-900 dark:text-white mb-4';
export const TEXT_PRIMARY = 'text-slate-900 dark:text-white';
export const TEXT_SECONDARY = 'text-slate-600 dark:text-slate-400';
export const TEXT_ACCENT = 'text-purple-600 dark:text-purple-400';

export const BUTTON_PRIMARY =
	'bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors';
export const BUTTON_PRIMARY_PURPLE =
	'bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors';
export const BUTTON_SECONDARY =
	'bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-medium py-2 px-4 rounded-md transition-colors';
export const BUTTON_OUTLINE =
	'border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-medium py-2 px-4 rounded-md transition-colors';

export const MODAL_OVERLAY =
	'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50';
export const MODAL_BACKDROP_BLUR = 'backdrop-blur-sm';

export const INPUT_FIELD =
	'w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--text-color)]';

export const STAT_CARD_CONTAINER =
	'text-center p-3 bg-slate-100 dark:bg-slate-900/50 rounded-lg';
export const STAT_CARD_NUMBER_PURPLE =
	'text-2xl font-bold text-purple-600 dark:text-purple-400';
export const STAT_CARD_NUMBER_GREEN =
	'text-2xl font-bold text-green-600 dark:text-green-400';
export const STAT_CARD_NUMBER_YELLOW =
	'text-2xl font-bold text-yellow-600 dark:text-yellow-400';
export const STAT_CARD_NUMBER_BLUE =
	'text-2xl font-bold text-blue-600 dark:text-blue-400';

/**
 * Page background styling - These three constants should be used together
 * to create the standard page background effect used across the app
 *
 * Example usage:
 * <div className={PAGE_BACKGROUND_CONTAINER}>
 *   <div className={PAGE_BACKGROUND_GLOW}></div>
 *   <main className={PAGE_CONTENT_CONTAINER}>
 *     <!-- Page content goes here -->
 *   </main>
 * </div>
 */
export const PAGE_BACKGROUND_CONTAINER =
	'bg-[var(--page-bg)] text-[var(--text-color)] min-h-screen';

export const PAGE_BACKGROUND_GLOW = 'background-glows fixed inset-0 z-0';

export const PAGE_CONTENT_CONTAINER =
	'relative z-10 max-w-4xl mx-auto pt-32 pb-24 px-4';

export const COMMON_BACKGROUND_BASE_LAYER = PAGE_BACKGROUND_CONTAINER;
export const COMMON_BACKGROUND_GLOW_LAYER = PAGE_BACKGROUND_GLOW;
export const COMMON_BACKGROUND_ANIMATION_LAYER = PAGE_CONTENT_CONTAINER;
