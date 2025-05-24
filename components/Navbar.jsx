"use client";

import Link from "next/link"; // Import Link for navigation
import { Menu, X } from "lucide-react"; // Assuming these icons are available

export default function Navbar({ isOpen, setIsOpen }) {
  return (
    <nav className="w-full bg-gray-300 shadow px-4 py-3 flex justify-between items-center z-30 fixed top-0 left-0 right-0">
      {/* Mobile sidebar toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-800 md:hidden p-2 rounded-md hover:bg-gray-400 transition-colors"
        aria-label="Toggle sidebar"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* App Title */}
      <h1 className="text-xl font-bold text-purple-900 flex-grow text-center md:text-left md:ml-4">
        ShelfLife
      </h1>

      {/* Login/Signup Buttons (visible on all screen sizes) */}
      <div className="flex items-center space-x-2">
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
      </div>
    </nav>
  );
}
