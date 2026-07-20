// Curated food-photo map for the Day Review takeaway cards (step 3).
// Photos exported from the Figma frame into /public/assets/insights/.
// Runtime alternatives outside this map fall back to the emoji+gradient card.

const INSIGHT_FOOD_IMAGES = {
  "macadamia milk": "/assets/insights/macadamia-milk.webp",
  "cucumber & celery juice": "/assets/insights/cucumber-celery-juice.webp",
  "cucumber and celery juice": "/assets/insights/cucumber-celery-juice.webp",
  "cucumber celery juice": "/assets/insights/cucumber-celery-juice.webp",
  "chia seed pudding": "/assets/insights/chia-seed-pudding.webp",
  "chia pudding": "/assets/insights/chia-seed-pudding.webp",
  "almond butter": "/assets/insights/almond-butter.webp",
};

export function insightFoodImage(name = "") {
  const key = String(name)
    .toLowerCase()
    .replace(/[“”"'’‘]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return INSIGHT_FOOD_IMAGES[key] || null;
}

// Story-slide backdrops (stable variant, steps 2-3).
export const STORY_SLIDE_IMAGES = [
  "/assets/insights/story-slide-1.webp",
  "/assets/insights/story-slide-2.webp",
];
