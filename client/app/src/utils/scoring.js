/**
 * Scoring utilities for resume analysis
 */

/**
 * Get score color class based on score value
 * @param {number} score - Score value (0-100)
 * @returns {string} - CSS class name for score color
 */
export const getScoreColor = (score) => {
  if (score >= 80) return "high";
  if (score >= 60) return "mid-high";
  if (score >= 40) return "mid-low";
  return "low";
};

/**
 * Get score description based on score value
 * @param {number} score - Score value (0-100)
 * @returns {string} - Score description
 */
export const getScoreDescription = (score) => {
  if (score >= 90) return "Excellent Match";
  if (score >= 80) return "Very Good Match";
  if (score >= 70) return "Good Match";
  if (score >= 60) return "Fair Match";
  if (score >= 50) return "Partial Match";
  return "Poor Match";
};

/**
 * Calculate statistics from results
 * @param {Array} results - Array of result objects
 * @returns {Object} - Statistics object
 */
export const calculateStatistics = (results) => {
  if (!results || results.length === 0) {
    return {
      total: 0,
      average: 0,
      highest: 0,
      lowest: 0,
      distribution: { excellent: 0, good: 0, fair: 0, poor: 0 }
    };
  }
  
  const scores = results.map(r => r.score);
  const total = results.length;
  const average = Math.round(scores.reduce((sum, score) => sum + score, 0) / total);
  const highest = Math.max(...scores);
  const lowest = Math.min(...scores);
  
  const distribution = {
    excellent: results.filter(r => r.score >= 80).length,
    good: results.filter(r => r.score >= 60 && r.score < 80).length,
    fair: results.filter(r => r.score >= 40 && r.score < 60).length,
    poor: results.filter(r => r.score < 40).length
  };
  
  return { total, average, highest, lowest, distribution };
};