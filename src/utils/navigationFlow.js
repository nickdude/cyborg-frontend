/**
 * Determines the next route for user based on their profile completion status
 * @param {Object} user - User object from auth context
 * @returns {string} - Next route path
 */
export function getNextRoute(user) {
  if (!user) return "/login";

  // Doctors go directly to concierge
  if (user.userType === "doctor") {
    return "/concierge";
  }

  // For regular users, check completion status in order
  
  // 1. Check if subscription/plan purchased
  if (!user.hasActiveSubscription) {
    return "/membership";
  }

  // 2. Check if hear-about-us data stored
  if (!user.whereYouHeardAboutUs) {
    return "/hear-about-us";
  }

  // 3. Check if first login (welcome screen shown once)
  if (!user.hasSeenWelcome) {
    return "/welcome";
  }

  // 4. Check if onboarding completed
  if (!user.onboardingCompleted) {
    return "/onboarding";
  }

  // 5. All steps complete, go to blood reports
  return `/blood-reports/${user.id}`;
}
