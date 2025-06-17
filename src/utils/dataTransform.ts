/**
 * Data transformation utilities for converting between different formats
 */

/**
 * Converts a JavaScript object to XML format for AI processing
 *
 * @param obj - The object to convert to XML
 * @returns XML string representation of the object
 */
export function objectToXML(obj: any): string {
	if (obj === null || obj === undefined) return '';

	if (Array.isArray(obj)) {
		return obj
			.map(
				item =>
					`<item>${typeof item === 'object' ? objectToXML(item) : item}</item>`,
			)
			.join('');
	}

	if (typeof obj === 'object') {
		let xml = '';
		for (const [key, value] of Object.entries(obj)) {
			const tag = key.replace(/[^a-zA-Z0-9]/g, '');
			xml += `<${tag}>${
				typeof value === 'object' ? objectToXML(value) : value
			}</${tag}>`;
		}
		return xml;
	}

	return String(obj);
}

/**
 * Creates a Set from URL array for efficient lookups
 *
 * @param urls - Array of URL objects or strings
 * @returns Set of URL strings
 */
export function createUrlSet(urls: Array<{url: string} | string>): Set<string> {
	return new Set(
		urls.map(url => (typeof url === 'string' ? url : String(url.url))),
	);
}

/**
 * Filters links based on URL set
 *
 * @param links - Array of link objects with url property
 * @param urlSet - Set of URLs to filter by
 * @returns Filtered array of links
 */
export function filterLinksByUrlSet<T extends {url: string}>(
	links: T[],
	urlSet: Set<string>,
): T[] {
	return links.filter(link => urlSet.has(String(link.url)));
}
