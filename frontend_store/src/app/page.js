"use client";
import React, { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleMouseDown = () => setShowPassword(true);
  const handleMouseUp = () => setShowPassword(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value.trim() }));
    setError("");
  };

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await axios.get('http://localhost:3033/api/auth/verify-session', {
          withCredentials: true
        });

        if (response.data.authenticated) {
          setIsLoggedIn(true);
          const path = response.data.user.role === "OWNER" ? '/handlerAdmin' : '/Transaksi';
          router.replace(path); // Gunakan replace daripada push untuk login
        }
      } catch (error) {
        console.error("session verification failed", error);
        setIsLoggedIn(false);
      }
    };
    checkAuthStatus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!formData.email || !formData.password) {
      setError("Email and Password are required");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:3033/api/auth/login",
        formData,
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
          timeout: 10000
        }
      );

      if (response.data.success) {
        setIsLoggedIn(true);
        const path = response.data.user.role === "OWNER" ? '/handlerAdmin' : '/Transaksi';
        router.replace(path);
      } else {
        setError(response.data.message || "Login failed");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "An unexpected error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center bg-gray-100">
        <div className="flex justify-center items-center flex-1 p-[6%] lg:p-38">
          <div className="bg-white p-8 rounded-lg shadow-lg w-96">
            <h2 className="text-green-600 text-2xl font-bold mb-6 text-center">Log in</h2>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Email
                </label>
                <input
                  type="text"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Enter Email or Username"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Enter password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setShowPassword(true);
                    }}
                    onMouseUp={(e) => {
                      e.preventDefault();
                      setShowPassword(false);
                    }}
                    onMouseLeave={(e) => {
                      e.preventDefault();
                      setShowPassword(false);
                    }}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`
    w-full py-2 px-4 rounded font-bold
    ${loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                  }
    text-white focus:outline-none focus:shadow-outline
  `}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                      {/* Add loading spinner SVG */}
                    </svg>
                    Loading...
                  </span>
                ) : (
                  'Log in'
                )}
              </button>
            </form>

            <p className="mt-6 text-center">
              <a href="#" className="text-green-500 hover:text-green-700 text-sm">
                Forgotten password?
              </a>
            </p>

            <div className="text-center mt-6">
              <a
                href="../register"
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                Create new account
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}