import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import adminLogo from "../assets/admin-logo.svg";
import userLogo from "../assets/user-logo.svg";
import headerBg from "../assets/Bhawani.png";

function HeaderBar({ user }) {
  const [showMenu, setShowMenu] = useState(false);
  const navigator = useNavigate();
  const [isLoading, setLoading] = useState(false);

  const handleMenuClick = () => {
    setShowMenu(!showMenu);
  };

  return (
    <>
      {isLoading && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
          <div className="w-16 h-16 border-4 border-t-gray-400 border-b-gray-400 border-r-transparent rounded-full animate-spin"></div>
          <h2 className="text-white ml-2">Loading please wait...</h2>
        </div>
      )}

      {!isLoading && (
        <header
  className="fixed top-0 left-0 right-0 z-20 shadow-md"
  style={{
    backgroundImage: `url(${headerBg})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    height: "80px", // you can adjust (e.g., 100px) for better visibility
  }}
>
  <div className="h-full px-6 py-3 grid grid-cols-10 items-center bg-black bg-opacity-50">
    {/* Shop title */}
    <h1 className="text-2xl font-bold col-span-2 text-yellow-300 tracking-wide">
      Bhawani Traders
    </h1>

    <div className="col-span-6"></div>

    {/* User profile section */}
    <div className="col-span-2 flex items-center justify-end">
      <img
        src={user.role === "user" ? userLogo : adminLogo}
        alt="User Logo"
        className="h-10 w-10 rounded-full border-2 border-yellow-400 bg-yellow-100 p-1"
      />
      <div className="ml-3">
        <h3 className="text-md text-white font-semibold">{user.name}</h3>
        <span className="text-sm text-gray-200">{user.email}</span>
      </div>
    </div>
  </div>
</header>

      )}
    </>
  );
}

export default HeaderBar;
