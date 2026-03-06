import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from "jwt-decode";
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                const isExpired = decoded.exp && decoded.exp * 1000 < Date.now();
                if (isExpired) {
                    localStorage.removeItem('token');
                } else {
                    setUser({ id: decoded.id, name: decoded.name, role: decoded.role, mobile: decoded.mobile });
                }
            } catch (error) {
                console.error("Invalid token:", error);
                localStorage.removeItem('token');
            }
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        const onLogout = () => setUser(null);
        window.addEventListener('auth-logout', onLogout);
        return () => window.removeEventListener('auth-logout', onLogout);
    }, []);

    const login = async (mobile, password) => {
        const response = await api.post('/auth/login', { mobile, password });
        const { token, user: userData } = response.data;
        localStorage.setItem('token', token);
        setUser(userData);
        return userData;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
