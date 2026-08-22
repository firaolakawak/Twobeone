export interface Question {
  id: string;
  category: string;
  verse: string;
  verseReference: string;
  prompts: string[];
  date: string;
}

// All questions are now managed through the Admin Panel
// No hardcoded questions - create them via Admin > Q&A Questions
export const questions: Question[] = [];

// Helper function to get today's question (now fetches from backend)
export function getTodaysQuestion(): Question | null {
  // This function is deprecated - use the backend API to fetch questions
  return null;
}

// Get all questions by category (now fetches from backend)
export function getQuestionsByCategory(category: string): Question[] {
  // This function is deprecated - use the backend API to fetch questions
  return [];
}

// Get all unique categories (now fetches from backend)
export function getCategories(): string[] {
  // This function is deprecated - use the backend API to fetch questions
  return [];
}
