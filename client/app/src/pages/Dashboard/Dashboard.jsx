import React, { useState, useEffect } from "react";
import {
  processResumes,
  filterByKeywords,
  createProcessingFormData,
} from "../../services/ats";
import {
  validateFiles,
  removeDuplicateFiles,
} from "../../utils/fileProcessing";
import { getScoreColor, calculateStatistics } from "../../utils/scoring";
import { downloadCSV, downloadAnalysisReport } from "../../utils/downloadUtils";
import LoadingIndicator from "../../components/LoadingIndicator/LoadingIndicator";
import "./Dashboard.css";

const Dashboard = () => {
  // State management
  const [resumes, setResumes] = useState([]);
  const [jobDescription, setJobDescription] = useState(null);
  const [jobRole, setJobRole] = useState("");
  const [keywords, setKeywords] = useState("");
  const [keywordWeight, setKeywordWeight] = useState(0.5);
  const [minScore, setMinScore] = useState(50);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [keywordFiltered, setKeywordFiltered] = useState([]);
  const [processingStatus, setProcessingStatus] = useState("");
  const [statistics, setStatistics] = useState(null);
  const [errors, setErrors] = useState({});

  const jobRoles = [
    "Software Engineer",
    "Sales Manager",
    "Data Scientist",
    "HR Manager",
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!resumes || resumes.length === 0) {
      newErrors.resumes = "Please upload at least one resume";
    }

    if (!jobDescription) {
      newErrors.jd = "Please upload a job description";
    }

    if (!jobRole) {
      newErrors.jobRole = "Please select a job role";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Main processing function
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    // Validate files before processing
    const resumeValidation = validateFiles(resumes);
    const jdValidation = validateFiles([jobDescription]);

    if (!resumeValidation.isValid) {
      setErrors({ ...errors, resumes: resumeValidation.errors.join(", ") });
      return;
    }

    if (!jdValidation.isValid) {
      setErrors({ ...errors, jd: jdValidation.errors.join(", ") });
      return;
    }

    setLoading(true);
    setResults([]);
    setKeywordFiltered([]);
    setStatistics(null);
    setErrors({}); // Clear any previous errors
    setProcessingStatus("Uploading files...");

    try {
      // Remove duplicates
      const uniqueResumes = removeDuplicateFiles(resumes);
      setProcessingStatus(
        `Processing ${uniqueResumes.length} unique resumes...`
      );

      // Create form data for API
      const formData = createProcessingFormData(
        uniqueResumes,
        jobDescription,
        jobRole,
        keywordWeight
      );

      setProcessingStatus("Calculating Resumes scores...");

      // Call backend API
      const response = await processResumes(formData);

      setProcessingStatus("Finalizing results...");

      console.log("Processing response:", response);

      // Set results and calculate statistics
      if (response.results && response.results.length > 0) {
        setResults(response.results);
        setStatistics(calculateStatistics(response.results));
        console.log(
          "Results set successfully:",
          response.results.length,
          "resumes processed"
        );
      } else {
        console.warn("No results returned from processing");
        setErrors({
          general:
            "No results were generated. Please check your files and try again.",
        });
      }

      setProcessingStatus("");
    } catch (error) {
      console.error("Error processing resumes:", error);

      // Handle different error formats
      let errorMessage = "Error processing resumes. Please try again.";

      if (error.error) {
        errorMessage = error.error;
      } else if (error.detail) {
        errorMessage = error.detail;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      setErrors({ general: errorMessage });
      setProcessingStatus("");
    } finally {
      setLoading(false);
    }
  };

  // Handle keyword filtering with debounce
  useEffect(() => {
    if (keywords.trim() && results.length > 0) {
      const timeoutId = setTimeout(async () => {
        try {
          const response = await filterByKeywords(results, keywords);
          setKeywordFiltered(response.filtered_results);
        } catch (error) {
          console.error("Keyword filtering error:", error);

          // Handle keyword filtering errors gracefully
          let errorMessage = "Error filtering keywords. Please try again.";

          if (error.error) {
            errorMessage = error.error;
          } else if (error.detail) {
            errorMessage = error.detail;
          } else if (error.message) {
            errorMessage = error.message;
          }

          // Set error state to show user the filtering failed
          setErrors({ general: errorMessage });
          setKeywordFiltered([]);
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      setKeywordFiltered([]);
    }
  }, [keywords, results]);

  // Filtering functions
  const filtered = results.filter((result) => result.score >= minScore);

  // Download functions
  const handleDownload = (type) => {
    let dataToDownload;
    let filename;

    switch (type) {
      case "score":
        dataToDownload = filtered;
        filename = `score_filtered_results_${
          new Date().toISOString().split("T")[0]
        }`;
        break;
      case "keyword":
        dataToDownload = keywordFiltered;
        filename = `keyword_filtered_results_${
          new Date().toISOString().split("T")[0]
        }`;
        break;
      case "all":
        dataToDownload = results;
        filename = `all_results_${new Date().toISOString().split("T")[0]}`;
        break;
      case "report":
        downloadAnalysisReport(results, filtered, jobRole, minScore);
        return;
      default:
        return;
    }

    if (dataToDownload.length === 0) {
      alert("No data to download");
      return;
    }

    downloadCSV(dataToDownload, filename, type === "keyword");
  };

  // Handle file uploads with validation
  const handleResumeUpload = (e) => {
    const files = Array.from(e.target.files);
    const validation = validateFiles(files);

    if (!validation.isValid) {
      setErrors({ ...errors, resumes: validation.errors.join(", ") });
      return;
    }

    const uniqueFiles = removeDuplicateFiles(files);
    setResumes(uniqueFiles);
    setErrors({ ...errors, resumes: null });
  };

  const handleJDUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validation = validateFiles([file]);

    if (!validation.isValid) {
      setErrors({ ...errors, jd: validation.errors.join(", ") });
      return;
    }

    setJobDescription(file);
    setErrors({ ...errors, jd: null });
  };

  return (
    <div className="combined-container">
      {/* Left Section - Form */}
      <div className="main-content form-panel">
        <div className="main-header">
          <h2>Resume Score Calculator</h2>
          <p>Upload Resumes and JD to calculate scores</p>
        </div>

        <div className="form">
          {errors.general && <div className="error-text">{errors.general}</div>}

          <div className={`form-section ${errors.resumes ? "error-dash" : ""}`}>
            <h3>
              Upload Resumes<span style={{ color: "red" }}> *</span>
            </h3>
            <div className="upload">
              <p>Limit 200MB per file PDF, DOCX</p>
              <input
                type="file"
                multiple
                accept=".pdf,.docx"
                onChange={handleResumeUpload}
              />
              {resumes.length > 0 && (
                <div className="file-info">
                  {resumes.length} file(s) selected
                </div>
              )}
            </div>
            {errors.resumes && (
              <div className="error-text">{errors.resumes}</div>
            )}
          </div>

          <div className={`form-section ${errors.jd ? "error-dash" : ""}`}>
            <h3>
              Upload Job Description<span style={{ color: "red" }}> *</span>
            </h3>
            <div className="upload">
              <p>Limit 200MB per file PDF, DOCX</p>
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={handleJDUpload}
              />
              {jobDescription && (
                <div className="file-info">{jobDescription.name} selected</div>
              )}
            </div>
            {errors.jd && <div className="error-text">{errors.jd}</div>}
          </div>

          <div className="horizontal">
            <div
              className={`form-section flex ${
                errors.jobRole ? "error-dash" : ""
              }`}
            >
              <h3>
                Job Role<span style={{ color: "red" }}> *</span>
              </h3>
              <select
                value={jobRole}
                onChange={(e) => {
                  setJobRole(e.target.value);
                  setErrors({ ...errors, jobRole: null });
                }}
              >
                <option value="">Select Job Role</option>
                {jobRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              {errors.jobRole && (
                <div className="error-text">{errors.jobRole}</div>
              )}
            </div>

            <div className="form-section flex">
              <h3>Keyword Search</h3>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className="search"
                placeholder="Enter keywords to filter (comma separated)"
              />
              {keywordFiltered.length > 0 && (
                <div className="file-info">
                  {keywordFiltered.length} matches found
                </div>
              )}
            </div>
          </div>

          <div className="horizontal">
            <div className="form-section flex">
              <h3>Keyword Weight</h3>
              <input
                type="range"
                min="0"
                max="0.9"
                step="0.05"
                value={keywordWeight}
                onChange={(e) => setKeywordWeight(parseFloat(e.target.value))}
                className="weight-slider"
              />
              <p>
                Keyword Weight: <span>{keywordWeight.toFixed(2)}</span>
              </p>
              <p>
                Semantic Weight: <span>{(1 - keywordWeight).toFixed(2)}</span>
              </p>
            </div>

            <div className="form-section flex">
              <h3>Minimum Score</h3>
              <input
                type="number"
                className="search"
                placeholder="Minimum score threshold"
                value={minScore}
                min="0"
                max="100"
                onChange={(e) => setMinScore(Number(e.target.value))}
              />
            </div>
          </div>

          <button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "⏳ Processing..." : "🚀 Calculate Scores"}
          </button>
        </div>
      </div>

      {/* Right Section - Results */}
      <div className="main-content results-panel">
        <div className="main-header">
          <h2>Results Analysis</h2>
          <p>Resume scores and filtered results</p>
        </div>

        <div className="form">
          {loading ? (
            <div className="loading-spinner">
              <LoadingIndicator />
              <p>{processingStatus || "Processing resumes..."}</p>
            </div>
          ) : results.length > 0 ? (
            <>
              {statistics && (
                <div className="statistics-grid">
                  <div className="stat-card">
                    <div className="stat-value">{statistics.total}</div>
                    <div className="stat-label">Total Resumes</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{statistics.average}%</div>
                    <div className="stat-label">Average Score</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{statistics.highest}%</div>
                    <div className="stat-label">Highest Score</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{filtered.length}</div>
                    <div className="stat-label">Qualified</div>
                  </div>
                </div>
              )}

              <div className="form-section">
                <h3>📊 All Scores</h3>
                <div className="results-scrollable">
                  <table className="results-table">
                    <thead>
                      <tr>
                        <th>Resume</th>
                        <th>Overall Score</th>
                        <th>Keyword Score</th>
                        <th>Semantic Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result, index) => (
                        <tr key={index}>
                          <td className="f-name" title={result.resume}>
                            {result.resume}
                          </td>
                          <td>
                            <div
                              className={`score ${getScoreColor(result.score)}`}
                            >
                              {result.score}%
                            </div>
                          </td>
                          <td>{result.keywordScore}%</td>
                          <td>{result.semanticScore}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="form-section">
                <h3>✅ Filtered Results (Score ≥ {minScore})</h3>
                <div className="filtered-results">
                  {filtered.length > 0 ? (
                    <ul className="filtered-list">
                      {filtered.map((result, index) => (
                        <li key={index}>
                          <span className="resume-name">{result.resume}</span>
                          <span
                            className={`score ${getScoreColor(result.score)}`}
                          >
                            {result.score}%
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No resumes meet the minimum score criteria.</p>
                  )}
                </div>
              </div>

              {keywords && keywordFiltered.length > 0 && (
                <div className="form-section">
                  <h3>🔍 Keyword Filtered Results</h3>
                  <div className="filtered-results">
                    <ul className="filtered-list">
                      {keywordFiltered.map((result, index) => (
                        <li key={index}>
                          <span className="resume-name">{result.resume}</span>
                          <span
                            className={`score ${getScoreColor(result.score)}`}
                          >
                            {result.score}%
                          </span>
                          <div className="matched-keywords">
                            Keywords: {result.matchedKeywords?.join(", ") || ""}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="buttons">
                {results.length > 0 && (
                  <button
                    className="submit-btn"
                    style={{ fontSize: "15px" }}
                    onClick={() => handleDownload("all")}
                  >
                    📥 Download All Results
                  </button>
                )}
                {filtered.length > 0 && (
                  <button
                    className="submit-btn"
                    style={{ fontSize: "15px" }}
                    onClick={() => handleDownload("score")}
                  >
                    📥 Download Score Filtered
                  </button>
                )}
                {keywordFiltered.length > 0 && (
                  <button
                    className="submit-btn"
                    style={{ fontSize: "15px" }}
                    onClick={() => handleDownload("keyword")}
                  >
                    📥 Download Keyword Filtered
                  </button>
                )}
                {results.length > 0 && (
                  <button
                    className="submit-btn"
                    style={{ fontSize: "15px" }}
                    onClick={() => handleDownload("report")}
                  >
                    📊 Download Analysis Report
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="no-results">
              <h3>No results yet</h3>
              <p>
                Upload resumes and job description, then click "Calculate
                Scores" to see results here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
