import { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [userToken, setUserToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('@DigitalLib:token');
        if (token) {
            setUserToken(token);
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            // OAuth2PasswordRequestForm requires form-urlencoded data
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);

            const response = await api.post('/login', formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            const { access_token } = response.data;
            localStorage.setItem('@DigitalLib:token', access_token);
            api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
            setUserToken(access_token);
            navigate('/');
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('@DigitalLib:token');
        delete api.defaults.headers.common['Authorization'];
        setUserToken(null);
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ signed: !!userToken, userToken, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
