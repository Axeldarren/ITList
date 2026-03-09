/**
 * Returns the correct src URL for a profile picture.
 * Handles both ImageKit CDN URLs (https://...) and legacy relative paths (/uploads/...).
 */
export function getProfilePictureSrc(profilePictureUrl: string | null | undefined): string | null {
    if (!profilePictureUrl) return null;
    if (profilePictureUrl.startsWith('http')) return profilePictureUrl;
    return `${process.env.NEXT_PUBLIC_API_BASE_URL}${profilePictureUrl}`;
}
