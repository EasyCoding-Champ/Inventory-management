import axios from "axios";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SERVER_URL } from "../../router";
import background from "../../assets/Bhawani.png";

function LoginScreen() {
  const [formData, setData] = useState({
    email: "",
    password: "",
  });

  const history = useNavigate();

  function handInputChange(e) {
    setData({ ...formData, [e.target.id]: e.target.value });
  }

  async function handleSignIn(e) {
    e.preventDefault();
    try {
      const { status } = await axios.post(
        `${SERVER_URL}/api/v1/users/login`,
        formData,
        {
          withCredentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (status === 201) {
        history("/");
      } else {
        alert("Wrong credentials. Check Email and password ");
      }
    } catch (error) {
      console.error("Something went wrong:", error);
      alert("Something went wrong");
    }
  }

  return (
    <div
      className="flex items-center min-h-screen p-4 lg:justify-center bg-cover bg-center relative"
      style={{ backgroundImage: `url(${background})` }}
    >
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm"></div>

      <div className="relative flex flex-col overflow-hidden rounded-lg shadow-2xl md:flex-row md:flex-1 lg:max-w-screen-md bg-white/90">
        {/* Left Sidebar */}
        <div className="relative text-white md:w-80 flex flex-col justify-end bg-cover bg-center"
             style={{ backgroundImage: `url(${background})` }}>
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50"></div>

          {/* Bottom Content */}
          <div className="relative z-10 text-center pb-10 px-4">
            <p className="text-sm text-gray-200">Don’t have an account?</p>
            <Link
              to={"signup"}
              className="mt-1 inline-block font-semibold underline text-yellow-300 hover:text-yellow-200 transition"
            >
              Sign Up
            </Link>
          </div>
        </div>

        {/* Right Form Section */}
        <div className="flex-1 p-8 flex flex-col justify-center">
          <h3 className="mb-6 text-2xl font-bold text-gray-700">Account Login</h3>
          <form className="flex flex-col space-y-5" onSubmit={handleSignIn}>
            <div className="flex flex-col space-y-1">
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-600"
              >
                Email address
              </label>
              <input
                onChange={handInputChange}
                type="email"
                id="email"
                value={formData.email}
                autoFocus
                required
                className="px-4 py-2 border border-gray-300 rounded-md 
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
                onChange={handInputChange}
                id="password"
                value={formData.password}
                required
                className="px-4 py-2 border border-gray-300 rounded-md 
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
              Log in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;
