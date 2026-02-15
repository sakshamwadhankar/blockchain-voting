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
    const [voterToken, setVoterTokenState] = useState(null);

    // Check if user is already logged in (from localStorage)
    useEffect(() => {
        const savedUser = localStorage.getItem("authUser");
        const savedVerified = localStorage.getItem("isVerified");
        const savedToken = localStorage.getItem("voterToken");
        if (savedUser) {
            setUser(JSON.parse(savedUser));
            setIsVerified(savedVerified === "true");
        }
        if (savedToken) {
            setVoterTokenState(savedToken);
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
        setIsVerified(true); // Admin is always verified
        localStorage.setItem("authUser", JSON.stringify(userData));
        localStorage.setItem("isVerified", "true");
    };

    const markAsVerified = (token = null) => {
        setIsVerified(true);
        localStorage.setItem("isVerified", "true");
        if (token) {
            setVoterTokenState(token);
            localStorage.setItem("voterToken", token);
        }
    };

    const logout = () => {
        setUser(null);
        setIsVerified(false);
        setVoterTokenState(null);
        localStorage.removeItem("authUser");
        localStorage.removeItem("isVerified");
        localStorage.removeItem("voterToken");
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
                isAuthenticated,
                voterToken // Expose voterToken
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
