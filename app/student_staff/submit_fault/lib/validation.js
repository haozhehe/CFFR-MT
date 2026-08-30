const MAX_DESCRIPTION_LENGTH = 1000;

/**
 * Validates report form data
 * @param {string} location - Report location
 * @param {string} description - Report description
 * @returns {string|null} Error message or null if valid
 */
export function validateReport(location, description) {
  const cleanLocation = location.trim();
  const cleanDescription = description.trim();

  if (!cleanLocation || !cleanDescription) {
    return 'Location and description are required.';
  }

  if (cleanDescription.length > MAX_DESCRIPTION_LENGTH) {
    return `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`;
  }

  return null;
}

/**
 * Validates image file
 * @param {File|null} image - Image file to validate
 * @returns {string|null} Error message or null if valid
 */
export function validateImage(image) {
  const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png']);
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

  if (!image) return null;

  if (!ALLOWED_IMAGE_TYPES.has(image.type)) {
    return 'The optional image must be a JPG, JPEG, or PNG file.';
  }

  if (image.size > MAX_IMAGE_SIZE) {
    return 'The optional image must be 5 MB or smaller.';
  }

  return null;
}

export { MAX_DESCRIPTION_LENGTH };
