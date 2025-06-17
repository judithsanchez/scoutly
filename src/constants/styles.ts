/**
 * Common styling constants used throughout the application
 */

// Background related classes
export const GRADIENT_BACKGROUND =
	'absolute inset-0 -z-10 h-full w-full bg-white dark:bg-slate-950 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#113_1px,transparent_1px),linear-gradient(to_bottom,#113_1px,transparent_1px)] bg-[size:6rem_4rem]';
export const ANIMATED_GRADIENT =
	'absolute -z-10 h-full w-full bg-white dark:bg-slate-950';
export const GRADIENT_GLOW =
	'absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_500px_at_50%_200px,#C9EBFF,transparent)] dark:bg-[radial-gradient(circle_500px_at_50%_200px,#133347,transparent)]';

// Container and layout classes
export const MAIN_CONTAINER = 'container mx-auto px-4 py-8';
export const CARD_CONTAINER =
	'bg-white dark:bg-slate-900 rounded-lg shadow-md p-6 my-4 relative';
export const FLEX_CENTER = 'flex items-center justify-center';
export const FLEX_BETWEEN = 'flex items-center justify-between';
export const FLEX_COL = 'flex flex-col';

// Typography classes
export const HEADING_LG =
	'text-3xl font-bold text-slate-900 dark:text-white mb-6';
export const HEADING_MD =
	'text-xl font-semibold text-slate-900 dark:text-white mb-4';
export const TEXT_PRIMARY = 'text-slate-900 dark:text-white';
export const TEXT_SECONDARY = 'text-slate-600 dark:text-slate-400';

// Button classes
export const BUTTON_PRIMARY =
	'bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors';
export const BUTTON_SECONDARY =
	'bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-medium py-2 px-4 rounded-md transition-colors';
export const BUTTON_OUTLINE =
	'border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-medium py-2 px-4 rounded-md transition-colors';
