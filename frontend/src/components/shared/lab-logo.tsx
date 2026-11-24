'use client';

import { BUNDLED_LOGO, RoundLogo } from '@/components/shared/round-logo';

export { BUNDLED_LOGO };

/**
 * The laboratory logo mark: always the round Al Hamd logo shipped with the app
 * (public/brand/ahl-logo-round.png), which shows the whole logo inside the circle.
 * Uploaded images (often rectangular) are not used for the round mark.
 */
export function LabLogoMark({ className, alt = '', glow }: { className?: string; alt?: string; glow?: boolean }) {
  return <RoundLogo src={BUNDLED_LOGO} alt={alt} className={className} glow={glow} />;
}
