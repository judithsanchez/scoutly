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
 * @param exclude - If true, excludes URLs in the set (default: false)
 * @returns Filtered array of links
 */
export function filterLinksByUrlSet<T extends {url: string}>(
	links: T[],
	urlSet: Set<string>,
	exclude: boolean = false,
): T[] {
	if (exclude) {
		return links.filter(link => !urlSet.has(String(link.url)));
	}
	return links.filter(link => urlSet.has(String(link.url)));
}

/**
 * Filters out links that are already in the URL set (new links only)
 *
 * @param links - Array of link objects with url property
 * @param seenUrls - Set of previously seen URLs
 * @returns Array of new links not in the seen URLs
 */
export function filterNewLinks<T extends {url: string}>(
	links: T[],
	seenUrls: Set<string>,
): T[] {
	return links.filter(link => !seenUrls.has(String(link.url)));
}
