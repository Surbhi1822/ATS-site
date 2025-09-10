/**
 * Utility functions for processing resume and job description files
 */

/**
 * Validate file type and size
 * @param {File} file - File to validate
 * @param {number} maxSize - Maximum file size in bytes
 * @returns {Object} - Validation result
 */
export const validateFile = (file, maxSize = 200 * 1024 * 1024) => {
  const errors = [];
  
  // Check file size
  if (file.size > maxSize) {
    errors.push(`File exceeds maximum size of ${Math.round(maxSize / (1024 * 1024))}MB`);
  }
  
  // Check file type
  const validTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (!validTypes.includes(file.type)) {
    errors.push('Only PDF and DOCX files are supported');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate multiple files
 * @param {FileList|File[]} files - Files to validate
 * @param {number} maxSize - Maximum file size per file
 * @returns {Object} - Validation result with valid files and errors
 */
export const validateFiles = (files, maxSize = 200 * 1024 * 1024) => {
  const allErrors = [];
  const validFiles = [];
  
  Array.from(files).forEach(file => {
    const validation = validateFile(file, maxSize);
    if (validation.isValid) {
      validFiles.push(file);
    } else {
      allErrors.push(`${file.name}: ${validation.errors.join(', ')}`);
    }
  });
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    validFiles
  };
};

/**
 * Remove duplicate files based on name and size
 * @param {FileList|File[]} files - Files to deduplicate
 * @returns {File[]} - Array of unique files
 */
export const removeDuplicateFiles = (files) => {
  const uniqueFiles = new Map();
  
  Array.from(files).forEach(file => {
    const key = `${file.name}-${file.size}`;
    if (!uniqueFiles.has(key)) {
      uniqueFiles.set(key, file);
    }
  });
  
  return Array.from(uniqueFiles.values());
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};