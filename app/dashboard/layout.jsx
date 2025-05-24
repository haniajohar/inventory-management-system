"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import "../globals.css";

export default function LayoutWrapper({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800">
      <Navbar isOpen={isOpen} setIsOpen={setIsOpen} />
      <div className="flex flex-1 pt-[70px] pb-[50px] overflow-hidden">
        <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
        <main className="flex-1 p-4 overflow-y-auto">{children}</main>
      </div>
      <Footer />
    </div>
  );
}
