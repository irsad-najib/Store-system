"use client"
import React, { useState } from "react"
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Register() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleMouseDown = (field) => {
        if (field === 'password') setShowPassword(true);
        if (field === 'confirmPassword') setShowConfirmPassword(true);
    };

    const handleMouseUp = (field) => {
        if (field === 'password') setShowPassword(false);
        if (field === 'confirmPassword') setShowConfirmPassword(false);
    };

    const handleTouchStart = (field) => {
        if (field === 'password') setShowPassword(true);
        if (field === 'confirmPassword') setShowConfirmPassword(true);
    };

    const handleTouchEnd = (field) => {
        if (field === 'password') setShowPassword(false);
        if (field === 'confirmPassword') setShowConfirmPassword(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError('');
    };

    const validateForm = () => {
        if (!formData.email || !formData.password || !formData.confirmPassword) {
            setError('All fields are required');
            return false;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return false;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!validateForm()) {
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post('http://localhost:3033/api/auth/register', {
                email: formData.email,
                password: formData.password
            }, {
                headers: {
                    "Content-Type": 'application/json'
                },
            });

            if (response.data) {
                router.push("/");
            }
        } catch (error) {
            if (error.response) {
                // Tangani response error dari server
                setError(error.response.data.error || 'Registration failed');
            } else if (error.request) {
                // Tangani error network/koneksi
                setError('Connection error. Please try again');
            } else {
                setError('An error occurred. Please try again');
            }
            console.error('Registration error:', error.response?.data);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="min-h-screen flex items-center bg-gray-100">
                <div className="bg-gray-100 flex justify-center items-center flex-1 flex-col pt-10 pb-10">
                    <h1 className="text-[10vw] font-bold text-green-600 mb-[3%] md:text-[5vw] lg:text-4xl">
                        E-Commerce
                    </h1>
                    <div className="pt-10 bg-white p-12 rounded-lg shadow-lg w-full max-w-md">

                        <h2 className="text-[7vw] text-green-600 font-bold mb-[4%] text-center md:text-[3vw] lg:text-2xl">Register</h2>

                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-[3%] lg:px-3 py-[3%] lg:py-3 rounded mb-[3%] lg:mb-3">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-gray-700 text-[3.5vw] md:text-[2.5vw] lg:text-xl font-bold mb-[1%] lg:mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="shadow appearance-none border rounded w-full py-[2%] lg:py-2 px-[3%] lg:px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    placeholder="Enter email"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 text-[3.5vw] md:text-[2.5vw] lg:text-xl font-bold mb-[1%] lg:mb-1">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="shadow appearance-none border rounded w-full py-[2%] lg:py-2 px-[3%] lg:px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        placeholder="Enter password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
                                        onMouseDown={() => handleMouseDown('password')}
                                        onMouseUp={() => handleMouseUp('password')}
                                        onMouseLeave={() => handleMouseUp('password')}
                                        onTouchStart={() => handleTouchStart('password')}
                                        onTouchEnd={() => handleTouchEnd('password')}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-700 text-[3.5vw] md:text-[2.5vw] lg:text-xl font-bold mb-[1%] lg:mb-1">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="shadow appearance-none border rounded w-full py-[2%] lg:py-2 px-[3%] lg:px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        placeholder="Confirm password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
                                        onMouseDown={() => handleMouseDown('confirmPassword')}
                                        onMouseUp={() => handleMouseUp('confirmPassword')}
                                        onMouseLeave={() => handleMouseUp('confirmPassword')}
                                        onTouchStart={() => handleTouchStart('confirmPassword')}
                                        onTouchEnd={() => handleTouchEnd('confirmPassword')}
                                    >
                                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-[2%] lg:py-2 px-[4%] lg:px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-50 text-[4vw] md:text-[3vw] lg:text-xl"
                            >
                                {loading ? "Loading..." : "Sign Up"}
                            </button>
                        </form>

                        <p className="mt-[6%] text-gray-500 text-center text-[3vw] md:text-[2vw] lg:text-lg lg:mt-6">
                            Already have an account?{" "}
                            <Link href="/" className="text-blue-500 hover:text-blue-700">Login here</Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}