"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";

export default function Navbar({ isOpen, setIsOpen }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  // Check login state on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      setIsLoggedIn(!!token);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user_id");
    setIsLoggedIn(false);
    router.push("/auth/login");
  };

  return (
    <nav className="w-full bg-gray-300 shadow px-4 py-3 flex justify-between items-center z-30 fixed top-0 left-0 right-0">
      {/* Sidebar Toggle for Mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-800 md:hidden p-2 rounded-md hover:bg-gray-400 transition-colors"
        aria-label="Toggle sidebar"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Title */}
      <h1 className="text-xl font-bold text-purple-900 flex-grow text-center md:text-left md:ml-4">
        ShelfLife
      </h1>

      {/* Auth Buttons */}
      <div className="flex items-center space-x-2">
        {!isLoggedIn ? (
          <>
            <Link
              href="/auth/login"
              className="px-4 py-2 bg-purple-400 text-white rounded-md hover:bg-purple-500 transition-colors shadow-sm"
            >
              Login
            </Link>
            <Link
              href="/auth/signup"
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors shadow-sm"
            >
              Sign Up
            </Link>
          </>
        ) : (
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors shadow-sm"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
