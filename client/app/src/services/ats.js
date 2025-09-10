import api from "./api";

/**
 * Process resumes and calculate ATS scores
 * @param {FormData} formData - Form data containing resumes, JD, and parameters
 * @returns {Promise<Object>} - Processing results
 */
export const processResumes = async (formData) => {
  try {
    console.log("Starting resume processing...");
    const response = await api.post("/process-resumes/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 300000, // 5 minutes timeout for large file processing
    });

    console.log("Resume processing completed:", response.data);
    return response.data;
  } catch (error) {
    console.error("Resume processing error:", error);

    if (error.response?.data) {
      console.error("Server error response:", error.response.data);
      // Handle standardized error responses - check detail first
      if (error.response.data.detail) {
        throw { error: error.response.data.detail };
      } else if (error.response.data.error) {
        throw { error: error.response.data.error };
      } else if (error.response.data.message) {
        throw { error: error.response.data.message };
      } else {
        throw { error: "Server error occurred during resume processing." };
      }
    } else if (error.request) {
      console.error("Network error - no response received");
      throw {
        error: "Network error. Please check your connection and try again.",
      };
    } else {
      console.error("Request setup error:", error.message);
      throw { error: "Request setup error occurred during processing." };
    }
  }
};

/**
 * Filter resumes by keywords
 * @param {Array} results - Array of resume results
 * @param {string} keywords - Comma-separated keywords
 * @returns {Promise<Object>} - Filtered results
 */
export const filterByKeywords = async (results, keywords) => {
  try {
    const response = await api.post("/filter-keywords/", {
      results,
      keywords,
    });

    return response.data;
  } catch (error) {
    console.error("Keyword filtering error:", error);

    if (error.response?.data) {
      // Handle standardized error responses - check detail first
      if (error.response.data.detail) {
        throw { error: error.response.data.detail };
      } else if (error.response.data.error) {
        throw { error: error.response.data.error };
      } else if (error.response.data.message) {
        throw { error: error.response.data.message };
      } else {
        throw { error: "Server error occurred during keyword filtering." };
      }
    } else if (error.request) {
      throw {
        error: "Network error. Please check your connection and try again.",
      };
    } else {
      throw { error: "Request setup error occurred during filtering." };
    }
  }
};

/**
 * Create FormData for resume processing
 * @param {File[]} resumes - Resume files
 * @param {File} jobDescription - Job description file
 * @param {string} jobRole - Selected job role
 * @param {number} keywordWeight - Keyword weight (0-1)
 * @returns {FormData} - Formatted form data
 */
export const createProcessingFormData = (
  resumes,
  jobDescription,
  jobRole,
  keywordWeight
) => {
  const formData = new FormData();

  // Add resume files
  resumes.forEach((resume) => {
    formData.append("resumes", resume);
  });

  // Add job description
  formData.append("job_description", jobDescription);

  // Add parameters
  formData.append("job_role", jobRole);
  formData.append("keyword_weight", keywordWeight.toString());

  return formData;
};
