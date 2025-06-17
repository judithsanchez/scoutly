/**
 * Form validation constants used throughout the application
 */

// Email validation
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const PASSWORD_MIN_LENGTH = 8;
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;

// Input field restrictions
export const TEXT_INPUT_MAX_LENGTH = 255;
export const TEXTAREA_MAX_LENGTH = 1000;
export const URL_MAX_LENGTH = 2048;

// Form error messages
export const FORM_ERROR_MESSAGES = {
	REQUIRED: 'This field is required',
	INVALID_EMAIL: 'Please enter a valid email address',
	PASSWORD_TOO_SHORT: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
	PASSWORD_NO_MATCH: 'Passwords do not match',
	USERNAME_TOO_SHORT: `Username must be at least ${USERNAME_MIN_LENGTH} characters`,
	USERNAME_TOO_LONG: `Username must be at most ${USERNAME_MAX_LENGTH} characters`,
	INVALID_URL: 'Please enter a valid URL',
	SERVER_ERROR: 'An error occurred. Please try again later.',
};
