import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            if (window.location.pathname !== '/login') {
                localStorage.removeItem('@DigitalLib:token');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export const BookService = {
    getBooks: async (skip = 0, limit = 100) => {
        const response = await api.get(`/books/?skip=${skip}&limit=${limit}`);
        return response.data;
    },
    getAuthors: async (skip = 0, limit = 100) => {
        const response = await api.get(`/books/authors/?skip=${skip}&limit=${limit}`);
        return response.data;
    },
    createAuthor: async (data) => {
        const response = await api.post('/books/authors/', data);
        return response.data;
    },
    createBook: async (data) => {
        const response = await api.post('/books/', data);
        return response.data;
    },
};

export const UserService = {
    getUsers: async (skip = 0, limit = 100) => {
        const response = await api.get(`/users/?skip=${skip}&limit=${limit}`);
        return response.data;
    },
    createUser: async (data) => {
        const response = await api.post('/users/', data);
        return response.data;
    },
    getUserLoans: async (userId) => {
        const response = await api.get(`/users/${userId}/loans`);
        return response.data;
    }
};

export const LoanService = {
    getLoans: async (skip = 0, limit = 100) => {
        const response = await api.get(`/loans/active-delayed?skip=${skip}&limit=${limit}`);
        return response.data;
    },
    createLoan: async (data) => {
        const response = await api.post('/loans/', data);
        return response.data;
    },
    returnLoan: async (loanId) => {
        const response = await api.post(`/loans/${loanId}/return`);
        return response.data;
    }
};
