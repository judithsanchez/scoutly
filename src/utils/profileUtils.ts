import { IUser } from '@/models/User';

/**
 * Check if a user has completed their profile
 */
export function hasCompleteProfile(user: IUser | null | undefined): boolean {
  if (!user) return false;
  
  // Check for CV
  if (!user.cvUrl) return false;
  
  // Check for basic candidate info
  if (!user.candidateInfo) return false;
  
  // You can add more specific checks here based on your requirements
  // For example, checking for specific fields in candidateInfo
  
  return true;
}

/**
 * Get profile completion status with details
 */
export function getProfileCompletionStatus(user: IUser | null | undefined) {
  if (!user) {
    return {
      isComplete: false,
      missingFields: ['User data not found'],
      completionPercentage: 0,
    };
  }

  const missingFields: string[] = [];
  let totalFields = 2; // CV + candidateInfo
  let completedFields = 0;

  // Check CV
  if (!user.cvUrl) {
    missingFields.push('CV/Resume');
  } else {
    completedFields++;
  }

  // Check candidate info
  if (!user.candidateInfo) {
    missingFields.push('Candidate Information');
  } else {
    completedFields++;
  }

  const completionPercentage = Math.round((completedFields / totalFields) * 100);
  const isComplete = completedFields === totalFields;

  return {
    isComplete,
    missingFields,
    completionPercentage,
  };
}

/**
 * Check if user can access job scouting features
 */
export function canAccessJobScouting(user: IUser | null | undefined): boolean {
  return hasCompleteProfile(user);
}

/**
 * Get user access level
 */
export function getUserAccessLevel(user: IUser | null | undefined, isAdmin: boolean = false) {
  const profileComplete = hasCompleteProfile(user);
  
  return {
    canSignIn: !!user, // User exists in database
    canAccessDashboard: !!user, // Basic dashboard access
    canAccessJobScouting: profileComplete, // Job scouting requires complete profile
    canAccessAdminPanel: isAdmin, // Admin panel access
    profileComplete,
  };
}
