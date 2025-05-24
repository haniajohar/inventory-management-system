"use client";

import { useRouter } from "next/navigation";
import Navbar from "/components/Navbar";
import Sidebar from "/components/Sidebar";
import Footer from "/components/Footer";

export default function OnboardingPage() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/auth/signup");
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/sunset.jpg"  // Make sure the image is correctly placed inside the public folder
          alt="Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
      </div>

      {/* Content over image */}
      <div className="relative z-10 flex flex-col flex-1">
        {/* Navbar */}
        <Navbar />

        <div className="flex flex-1 min-h-[calc(100vh-128px)]"> {/* Adjusting for navbar + footer height */}
          {/* Sidebar with fixed width */}
          <Sidebar />

          <main className="flex-1 flex items-center justify-center px-6 py-12">
            <div className="max-w-xl text-center space-y-6 bg-white bg-opacity-80 p-8 rounded-xl shadow-lg">
              <h1 className="text-4xl font-bold text-gray-800">
                Welcome to <span className="text-purple-900">ShelfLife</span>
              </h1>
              <p className="text-lg text-gray-700">
                Simplify your inventory and keep track of expiry dates effortlessly.
              </p>
              <button
                onClick={handleGetStarted}
                className="mt-6 px-6 py-3 bg-purple-900 text-white rounded-xl text-lg hover:bg-purple-700 transition duration-200"
              >
                Get Started
              </button>
            </div>
          </main>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
