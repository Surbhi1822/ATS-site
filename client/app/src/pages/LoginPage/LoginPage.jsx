import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Form from "../../components/Form/Form";
import { loginUser } from "../../services/auth";

function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if already logged in
    const token = localStorage.getItem("ACCESS_TOKEN");
    if (token) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const loginFields = [
    { name: "email", type: "email", placeholder: "E-mail", required: true },
    {
      name: "password",
      type: "password",
      placeholder: "Password",
      required: true,
    },
  ];

  return (
    <Form
      heading="Login"
      fields={loginFields}
      submitFunc={loginUser}
      successRedirect="/dashboard"
    />
  );
}

export default Login;
