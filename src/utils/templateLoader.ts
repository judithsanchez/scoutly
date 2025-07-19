import fs from 'fs/promises';
import path from 'path';
import {Logger} from './logger';

const logger = new Logger('TemplateLoader');

export interface PromptTemplates {
	systemRole: string;
	firstSelectionTask: string;
	jobPostDeepDive: string;
}

export const TEMPLATE_PATHS = {
	systemRole: 'src/config/systemRole.md',
	firstSelectionTask: 'src/config/firstSelectionTask.md',
	jobPostDeepDive: 'src/config/jobPostDeepDive.md',
} as const;

export async function loadTemplate(templatePath: string): Promise<string> {
	try {
		const fullPath = path.join(process.cwd(), templatePath);
		const content = await fs.readFile(fullPath, 'utf-8');
		logger.debug(`Loaded template: ${templatePath}`, {
			size: content.length,
		});
		return content;
	} catch (error) {
		logger.error(`Failed to load template: ${templatePath}`, error);
		throw new Error(`Failed to load template: ${templatePath}`);
	}
}
export async function loadPromptTemplates(): Promise<PromptTemplates> {
	try {
		logger.info('Loading prompt templates...');

		const [systemRole, firstSelectionTask, jobPostDeepDive] = await Promise.all(
			[
				loadTemplate(TEMPLATE_PATHS.systemRole),
				loadTemplate(TEMPLATE_PATHS.firstSelectionTask),
				loadTemplate(TEMPLATE_PATHS.jobPostDeepDive),
			],
		);

		logger.success('All prompt templates loaded successfully');

		return {
			systemRole,
			firstSelectionTask,
			jobPostDeepDive,
		};
	} catch (error) {
		logger.error('Failed to load prompt templates:', error);
		throw new Error('Failed to load required prompt templates');
	}
}

export function validateTemplates(templates: PromptTemplates): void {
	const requiredTemplates = Object.keys(TEMPLATE_PATHS) as Array<
		keyof PromptTemplates
	>;

	for (const templateKey of requiredTemplates) {
		const template = templates[templateKey];
		if (!template || template.trim().length === 0) {
			throw new Error(`Template ${templateKey} is missing or empty`);
		}
	}

	logger.debug('All templates validated successfully');
}
