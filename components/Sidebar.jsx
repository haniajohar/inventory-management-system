"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation"; // Import useRouter

// Assuming Menu and X icons are used in a parent component to toggle the sidebar
// import { Menu, X } from "lucide-react";

export default function Sidebar({ isOpen, setIsOpen }) {
  const sidebarRef = useRef();
  const router = useRouter(); // Initialize useRouter

  // Effect to manage body overflow when sidebar is open/closed
  // This prevents scrolling of the main page content when the sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    // Cleanup function to ensure overflow is reset if component unmounts
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Effect to handle clicks outside the sidebar to close it
  useEffect(() => {
    function handleClickOutside(event) {
      // If the sidebar is open and the click is outside the sidebar element
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      // Add event listener when sidebar is open
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      // Remove event listener when sidebar is closed
      document.removeEventListener("mousedown", handleClickOutside);
    }

    // Cleanup function to remove the event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, setIsOpen]); // Added setIsOpen to dependency array for completeness

  return (
    <>
      {/* Sidebar container */}
      {/*
        On mobile (default): fixed, starts below Navbar, full remaining height, slides in/out.
        On medium screens (md): static, takes up space in the document flow, full remaining height.
        Adjusted 'top' and 'h' to account for the fixed Navbar.
      */}
      <div
        ref={sidebarRef}
        className={`
          fixed top-[64px] left-0 h-[calc(100vh-64px)] w-64 bg-gray-200 text-gray-800 shadow-2xl z-30
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static md:shadow-none md:w-64 md:h-auto md:min-h-screen
          flex flex-col
        `}
      >
        {/* Sidebar Header/Branding */}
        <div className="p-6 border-b border-gray-300 flex items-center justify-center">
          <h2 className="text-2xl font-bold text-purple-700">Shelf Life</h2>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-2">
          {[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Inventory", href: "/inventory" },
            { label: "Reports", href: "/sales/record" },
            
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                block p-3 rounded-lg text-lg font-medium
                hover:bg-purple-400 hover:text-white
                transition-colors duration-200 ease-in-out
                focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50
                ${router.pathname === item.href ? 'bg-purple-400 text-white' : 'text-gray-700'}
              `}
              onClick={() => setIsOpen(false)} // Close sidebar on navigation click
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Optional: Footer section for sidebar (e.g., version info, logout) */}
        <div className="p-4 border-t border-gray-300 text-sm text-gray-500 text-center">
          © 2025 Your Company
        </div>
      </div>

      {/* Mobile overlay for closing sidebar */}
      <div
        className={`
          fixed inset-0 bg-black z-20 transition-opacity duration-300
          ${isOpen ? "opacity-50 visible" : "opacity-0 invisible"}
          md:hidden
        `}
        onClick={() => setIsOpen(false)} // Close sidebar when overlay is clicked
      />
    </>
  );
}
