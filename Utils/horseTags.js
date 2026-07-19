// Utils/horseTags.js
// Predefined tag categories and helper functions for horse-related content

export const TAG_CATEGORIES = {
  BREED: "breed",
  DISCIPLINE: "discipline",
  ACTIVITY: "activity",
  HEALTH: "health",
  EQUIPMENT: "equipment",
};

export const BREED_TAGS = [
  "Arabian",
  "Thoroughbred",
  "Quarter Horse",
  "Appaloosa",
  "Paint",
  "Morgan",
  "Warmblood",
  "Andalusian",
  "Friesian",
  "Draft",
  "Mustang",
  "Tennessee Walking Horse",
];

export const DISCIPLINE_TAGS = [
  "Dressage",
  "Show Jumping",
  "Cross Country",
  "Western Pleasure",
  "Barrel Racing",
  "Trail Riding",
  "Polo",
  "Endurance",
  "Reining",
  "Hunter/Jumper",
  "Rodeo",
];

export const ACTIVITY_TAGS = [
  "Training",
  "Competition",
  "Trail Ride",
  "Lesson",
  "Grooming",
  "Farrier Visit",
  "Vet Visit",
  "Turnout",
  "Bath",
  "Hack",
];

export const HEALTH_TAGS = [
  "Vaccination",
  "Deworming",
  "Dental",
  "Farrier",
  "Injury",
  "Recovery",
  "Wellness Check",
  "Surgery",
  "Chiropractic",
];

export const EQUIPMENT_TAGS = [
  "Saddle",
  "Bridle",
  "Blanket",
  "Boots",
  "Helmet",
  "Girth",
  "Stirrups",
  "Halter",
  "Lead Rope",
];

export const ALL_TAGS = [
  ...BREED_TAGS,
  ...DISCIPLINE_TAGS,
  ...ACTIVITY_TAGS,
  ...HEALTH_TAGS,
  ...EQUIPMENT_TAGS,
];

/**
 * Returns the category of a given tag.
 * @param {string} tag
 * @returns {string|null} category key or null if not found
 */
export function getTagCategory(tag) {
  if (BREED_TAGS.includes(tag)) return TAG_CATEGORIES.BREED;
  if (DISCIPLINE_TAGS.includes(tag)) return TAG_CATEGORIES.DISCIPLINE;
  if (ACTIVITY_TAGS.includes(tag)) return TAG_CATEGORIES.ACTIVITY;
  if (HEALTH_TAGS.includes(tag)) return TAG_CATEGORIES.HEALTH;
  if (EQUIPMENT_TAGS.includes(tag)) return TAG_CATEGORIES.EQUIPMENT;
  return null;
}

/**
 * Filters a list of tags by category.
 * @param {string[]} tags
 * @param {string} category
 * @returns {string[]}
 */
export function filterTagsByCategory(tags, category) {
  return tags.filter((tag) => getTagCategory(tag) === category);
}

/**
 * Returns suggested tags based on a search string.
 * @param {string} query
 * @returns {string[]}
 */
export function suggestTags(query) {
  if (!query || query.trim() === "") return [];
  const lower = query.toLowerCase();
  return ALL_TAGS.filter((tag) => tag.toLowerCase().includes(lower));
}

/**
 * Validates that all provided tags exist in the known tag list.
 * @param {string[]} tags
 * @returns {{ valid: string[], invalid: string[] }}
 */
export function validateTags(tags) {
  const valid = [];
  const invalid = [];
  tags.forEach((tag) => {
    if (ALL_TAGS.includes(tag)) {
      valid.push(tag);
    } else {
      invalid.push(tag);
    }
  });
  return { valid, invalid };
}
