"use client";
import axios from "axios";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HandlerAdmin() {
    const router = useRouter();
    const [isAuth, setIsAuth] = useState(false);
    const [userRole, setUserRole] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const verifyAdmin = async () => {
            try {
                const res = await axios.get("http://localhost:3033/api/auth/verify-session", {
                    withCredentials: true
                });

                if (res.data.authenticated && res.data.user.role === "OWNER") {
                    setIsAuth(true);
                    setUserRole(res.data.user.role);
                } else {
                    // Redirect to unauthorized page if user is not admin
                    router.push("/unauthorized");
                }
            } catch (err) {
                console.log('session verification error', err);
                // Redirect to login page if there's an error
                // router.push("/unauthorized");
            } finally {
                setIsLoading(false);
            }
        }
        verifyAdmin();
    }, [router]); // Remove isAuth from dependencies to prevent infinite loop

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return isAuth && userRole === "OWNER" ? (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
            <div className="w-full max-w-xs">
                <Link href="/Transaksi">
                    <button
                        className="w-full px-4 py-2 mb-2 text-black bg-white border-2 border-black rounded hover:bg-blue-500 hover:text-white focus:bg-blue-500 focus:text-white transition duration-200"
                    >
                        Transaksi
                    </button>
                </Link>
                <Link href="/managementStock">
                    <button
                        className="w-full px-4 py-2 mb-2 text-black bg-white border-2 border-black rounded hover:bg-blue-500 hover:text-white focus:bg-blue-500 focus:text-white transition duration-200"
                    >
                        Management stock
                    </button>
                </Link>
                <Link href="/Laporan">
                    <button
                        className="w-full px-4 py-2 mb-2 text-black bg-white border-2 border-black rounded hover:bg-blue-500 hover:text-white focus:bg-blue-500 focus:text-white transition duration-200"
                    >
                        Laporan Penjualan
                    </button>
                </Link>

            </div>
        </div>
    ) : null;
}