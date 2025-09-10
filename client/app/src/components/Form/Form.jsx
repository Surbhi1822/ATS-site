import React, { useState } from "react";
import LoadingIndicator from "../LoadingIndicator/LoadingIndicator";
import "./Form.css";

const Form = ({
  heading,
  fields,
  submitFunc,
  successRedirect,
  showPasswordInstructions = false,
}) => {
  const initialState = {};
  fields.forEach((field) => (initialState[field.name] = ""));

  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [showPassword, setShowPassword] = useState(
    fields.reduce((acc, field) => {
      if (field.type === "password") {
        acc[field.name] = false;
      }
      return acc;
    }, {})
  );

  const togglePasswordVisibility = (fieldName) => {
    setShowPassword((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear field-specific error when user starts typing
    if (fieldErrors[e.target.name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[e.target.name];
        return newErrors;
      });
    }
    // Clear general error when user makes changes
    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setFieldErrors({});

    try {
      const data = await submitFunc(formData);

      // Handle password change requirement for first-time login
      if (data.must_change_password) {
        setLoading(false);
        window.location.href = "/change-password";
        return;
      }

      if (successRedirect) {
        setLoading(false);
        window.location.href = successRedirect;
      } else {
        setSuccess("Success!");
        setLoading(false);
      }
    } catch (err) {
      // Handle password change requirement
      if (err.must_change_password) {
        setLoading(false);
        window.location.href = "/change-password";
        return;
      }

      // Parse and display errors more effectively
      let errorMessage = "An unexpected error occurred";
      let newFieldErrors = {};

      if (err.detail) {
        errorMessage = err.detail;
      } else if (err.error) {
        // Handle ATS service errors
        errorMessage = err.error;
      } else if (typeof err === "object" && err !== null) {
        // Separate field-specific errors from general errors
        const generalErrors = [];
        Object.entries(err).forEach(([field, messages]) => {
          const errorMessage = Array.isArray(messages) ? messages[0] : messages;

          // Check if this field exists in our form
          const fieldExists = fields.some((f) => f.name === field);

          if (fieldExists) {
            newFieldErrors[field] = errorMessage;
          } else {
            // Handle common Django error field names
            if (field === 'non_field_errors' || field === 'detail') {
              generalErrors.push(errorMessage);
            } else if (field === 'old_password') {
              // Map Django field names to form field names
              newFieldErrors['oldPassword'] = errorMessage;
            } else if (field === 'new_password') {
              newFieldErrors['newPassword'] = errorMessage;
            } else if (field === 'confirm_password') {
              newFieldErrors['confirmPassword'] = errorMessage;
            } else {
              // For unknown fields, add to general errors with field name
              generalErrors.push(`${field.replace(/_/g, ' ')}: ${errorMessage}`);
            }
          }
        });

        if (generalErrors.length > 0) {
          errorMessage = generalErrors.join(", ");
        } else if (Object.keys(newFieldErrors).length > 0) {
          errorMessage = "Please check the highlighted fields";
        } else {
          // If no specific errors found, show a generic message
          errorMessage = "Please check your input and try again";
        }
      } else if (typeof err === "string") {
        errorMessage = err;
      }

      setFieldErrors(newFieldErrors);
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <div className="heading">{heading}</div>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <form onSubmit={handleSubmit} className="form">
        {fields.map((field) =>
          field.type === "password" ? (
            <div
              key={field.name}
              className="password-wrapper"
              style={field.style || {}}
            >
              <input
                required={field.required}
                className={`input ${
                  fieldErrors[field.name] ? "error-field" : ""
                }`}
                type={showPassword[field.name] ? "text" : "password"}
                name={field.name}
                placeholder={field.placeholder}
                value={formData[field.name]}
                onChange={handleChange}
                autoComplete={
                  field.name === "oldPassword"
                    ? "current-password"
                    : field.name === "newPassword" ||
                      field.name === "confirmPassword"
                    ? "new-password"
                    : "current-password"
                }
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => togglePasswordVisibility(field.name)}
              >
                {showPassword[field.name] ? "🔓" : "🔒"}
              </button>
              {fieldErrors[field.name] && (
                <p className="field-error">{fieldErrors[field.name]}</p>
              )}
            </div>
          ) : (
            <div key={field.name} style={field.style || {}}>
              <input
                required={field.required}
                className={`input ${
                  fieldErrors[field.name] ? "error-field" : ""
                }`}
                type={field.type}
                name={field.name}
                placeholder={field.placeholder}
                value={formData[field.name]}
                onChange={handleChange}
                autoComplete={field.type === "email" ? "email" : "off"}
              />
              {fieldErrors[field.name] && (
                <p className="field-error">{fieldErrors[field.name]}</p>
              )}
            </div>
          )
        )}

        {showPasswordInstructions && (
          <div className="inst">
            <ul>
              <li>
                Password can't be too similar to other personal information
              </li>
              <li>Password can't be a commonly used password</li>
              <li>
                Password must be 12+ characters with at least:
                <ol>
                  <li>1 uppercase</li>
                  <li>1 digit</li>
                  <li>1 special character</li>
                </ol>
              </li>
            </ul>
          </div>
        )}

        {loading && (
          <div className="loader-container">
            <LoadingIndicator />
          </div>
        )}
        <button className="button" type="submit">
          {heading}
        </button>
      </form>
    </div>
  );
};

export default Form;
