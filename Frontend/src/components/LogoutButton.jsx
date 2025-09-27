import React, { useState } from "react";
import { IoIosLogOut } from "react-icons/io";
import LoadingIndicator from "./LoadingIndicator";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { SERVER_URL } from "../router";

function LogoutButton() {
  const [isLoading, setLoading] = useState(false);
  const navigator = useNavigate();

  const handleLogout = async () => {
    try {
      setLoading(true);
      const { status } = await axios.get(
        `${SERVER_URL}/api/v1/users/logout`,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (status === 200) {
        navigator("/", { replace: true });
        window.location.reload();
      }
    } catch (error) {
      console.error("Something went wrong:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className={`flex items-center justify-center gap-2 w-full px-4 py-2 
        font-semibold text-black rounded-md shadow-md transition-all
        bg-gradient-to-r from-[#D4AF37] via-[#E6A700] to-[#B87333] 
        hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-yellow-400 
        ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
    >
      {isLoading ? (
        <span className="w-5 h-5">
          <LoadingIndicator />
        </span>
      ) : (
        <>
          <IoIosLogOut className="text-lg" />
          <span>Log out</span>
        </>
      )}
    </button>
  );
}

export default LogoutButton;
