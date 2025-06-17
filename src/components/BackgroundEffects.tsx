'use client';

import {PAGE_BACKGROUND_GLOW} from '@/constants/styles';

/**
 * Renders the standard animated gradient background effect.
 * This component should be used on pages that need the consistent background styling.
 */
export function BackgroundEffects() {
	return <div className={PAGE_BACKGROUND_GLOW} />;
}
