import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isVerified, setIsVerified] = useState(false);

    useEffect(() => {
        const savedUser = localStorage.getItem("authUser");
        const savedVerified = localStorage.getItem("isVerified");
        if (savedUser) {
            setUser(JSON.parse(savedUser));
            setIsVerified(savedVerified === "true");
        }
        setLoading(false);
    }, []);

    const loginAsEmployee = (employeeData) => {
        const userData = {
            type: "employee",
            ...employeeData
        };
        setUser(userData);
        localStorage.setItem("authUser", JSON.stringify(userData));
    };

    const loginAsAdmin = (adminData) => {
        const userData = {
            type: "admin",
            ...adminData
        };
        setUser(userData);
        setIsVerified(true);
        localStorage.setItem("authUser", JSON.stringify(userData));
        localStorage.setItem("isVerified", "true");
    };

    const markAsVerified = () => {
        setIsVerified(true);
        localStorage.setItem("isVerified", "true");
    };

    const logout = () => {
        setUser(null);
        setIsVerified(false);
        localStorage.removeItem("authUser");
        localStorage.removeItem("isVerified");
    };

    const isAdmin = () => user?.type === "admin";
    const isEmployee = () => user?.type === "employee";
    const isAuthenticated = () => !!user;

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                isVerified,
                loginAsEmployee,
                loginAsAdmin,
                markAsVerified,
                logout,
                isAdmin,
                isEmployee,
                isAuthenticated
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
