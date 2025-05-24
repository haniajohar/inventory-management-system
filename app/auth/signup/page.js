'use client';
import { useState } from 'react';
import Link from 'next/link';
import { FiUser, FiPhone, FiMail, FiLock } from 'react-icons/fi';
import Navbar from "/components/Navbar";
import Sidebar from "/components/Sidebar";
import Footer from "/components/Footer";

import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter(); 
  const [formData, setFormData] = useState({
    username: '',
    mobileNumber: '',
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
  
      const data = await res.json();
  
      if (res.ok) {
        alert('Signup successful!');
        router.push('/dashboard'); // navigate after success
      } else {
        alert(data.message || 'Signup failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const handleGetStarted = () => {
    console.log('Getting started...');
    // You can add any additional logic you want here before form submission
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-300 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-purple-900 p-6 text-white">
          <h1 className="text-2xl font-bold text-center">Create Account</h1>
          <p className="text-center text-purple-100 mt-1">Enter your information below</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiUser className="text-purple-900" />
              </div>
              <input
                type="text"
                name="username"
                placeholder="Your username"
                className="w-full pl-10 pr-4 py-2 border text-black border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiPhone className="text-purple-900" />
              </div>
              <input
                type="tel"
                name="mobileNumber"
                placeholder="Your mobile number"
                className="w-full pl-10 pr-4 py-2 border text-black border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={formData.mobileNumber}
                onChange={handleChange}
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiMail className="text-purple-900" />
              </div>
              <input
                type="email"
                name="email"
                placeholder="Your email address"
                className="w-full pl-10 pr-4 py-2 text-black border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="text-purple-900" />
              </div>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                className="w-full pl-10 pr-4 py-2 text-black border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button
            onClick={handleGetStarted}
            type="submit"
            className="w-full bg-purple-900 hover:bg-purple-700 text-white py-2 px-4 rounded-md transition duration-200"
          >
            Sign Up
          </button>
        </form>

        <div className="px-6 pb-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-purple-900 hover:underline font-medium">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
