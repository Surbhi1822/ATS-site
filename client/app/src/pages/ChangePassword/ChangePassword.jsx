import React from "react";
import Form from "../../components/Form/Form";
import { changePassword } from "../../services/auth";

const ChangePassword = () => {
  const passwordFields = [
    {
      name: "oldPassword",
      type: "password",
      placeholder: "Current Password",
      required: true,
    },
    {
      name: "newPassword",
      type: "password",
      placeholder: "New Password",
      required: true,
      style: { marginTop: "25px" },
    },
    {
      name: "confirmPassword",
      type: "password",
      placeholder: "Confirm Password",
      required: true,
      style: { marginTop: "25px" },
    },
  ];

  return (
    <Form
      heading="Change Password"
      fields={passwordFields}
      submitFunc={changePassword}
      successRedirect="/login"
      showPasswordInstructions={true}
    />
  );
};

export default ChangePassword;
