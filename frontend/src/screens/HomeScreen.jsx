import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Home from "../components/Home.jsx";
import Cookies from "js-cookie";
import Header from "../components/Header.jsx";
const HomeScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const userDataFromCookie = Cookies.get("userData");

    if (userDataFromCookie) {
      navigate("/dashboard");
    }
  }, [navigate]);

  return (
    <>
      <Header />
      <Home />
    </>
  );
};

export default HomeScreen;
