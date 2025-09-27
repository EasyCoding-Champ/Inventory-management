import axios from "axios";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SERVER_URL } from "../../router";
import background from "../../assets/Bhawani.png";

function SignupScreen() {
  const navigator = useNavigate();

  const [formData, setData] = useState({
    name: "",
    email: "",
    password: "",
  });

  function handInputChange(e) {
    setData({ ...formData, [e.target.id]: e.target.value });
  }

  async function handleSignIN(e) {
    e.preventDefault();
    try {
      const { status } = await axios.post(
        `${SERVER_URL}/api/v1/users/new`,
        formData
      );

      if (status === 201) {
        navigator("/auth", { replace: true });
      } else {
        alert("Something went wrong");
      }
    } catch (e) {
      console.log(e);
      alert("User already exists with same email");
    }
  }

  return (
    <div
      className="flex items-center min-h-screen p-4 lg:justify-center bg-cover bg-center relative"
      style={{ backgroundImage: `url(${background})` }}
    >
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm"></div>

      <div className="relative flex flex-col md:flex-row md:flex-1 overflow-hidden rounded-lg shadow-2xl lg:max-w-screen-md bg-white/90">
        {/* Left Sidebar with Background */}
        <div
          className="relative text-white md:w-80 flex flex-col justify-end bg-cover bg-center"
          style={{ backgroundImage: `url(${background})` }}
        >
          <div className="absolute inset-0 bg-black/50"></div>

          <div className="relative z-10 p-6 text-center">
            <p className="text-yellow-300">Already have an account?</p>
            <Link
              to={"/auth"}
              className="underline font-semibold text-yellow-300 block mt-1 hover:text-yellow-200 transition"
            >
              Login
            </Link>
          </div>
        </div>

        {/* Right Form Section */}
        <div className="flex-1 p-6 md:p-8 flex flex-col justify-center bg-white/95">
          <h3 className="mb-6 text-2xl font-bold text-gray-700">
            Account Signup
          </h3>
          <form className="flex flex-col space-y-5" onSubmit={handleSignIN}>
            <div className="flex flex-col space-y-1">
              <label
                htmlFor="name"
                className="text-sm font-medium text-gray-600"
              >
                User Name
              </label>
              <input
                type="text"
                id="name"
                autoFocus
                onChange={handInputChange}
                required
                className="px-4 py-2 border border-gray-300 rounded 
                           focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-600"
              >
                Email address
              </label>
              <input
                type="email"
                id="email"
                onChange={handInputChange}
                required
                className="px-4 py-2 border border-gray-300 rounded 
                           focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-600"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                onChange={handInputChange}
                required
                className="px-4 py-2 border border-gray-300 rounded 
                           focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 text-yellow-400 rounded focus:ring-yellow-400"
              />
              <label htmlFor="remember" className="text-sm text-gray-600">
                Remember me
              </label>
            </div>

            <button
              type="submit"
              className="w-full px-4 py-3 text-lg font-semibold text-black 
                         bg-gradient-to-r from-[#D4AF37] via-[#E6A700] to-[#B87333] 
                         rounded-md shadow-md hover:brightness-110 
                         transition-all focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              Sign Up
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SignupScreen;
