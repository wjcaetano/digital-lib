import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Book } from 'lucide-react';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await login(email, password);
        } catch (err) {
            setError('Invalid email or password.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-primary)',
            padding: '1rem'
        }}>
            <div className="premium-card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                        <div style={{
                            width: '64px', height: '64px', borderRadius: '50%',
                            background: 'var(--accent-light)', color: 'var(--accent-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Book size={32} />
                        </div>
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)' }}>Welcome Back</h2>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Sign in to manage the Digital Library.</p>
                </div>

                {error && (
                    <div style={{
                        background: 'var(--danger-bg)', color: 'var(--danger-text)',
                        padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem',
                        fontSize: '0.875rem', textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            className="form-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{ width: '100%' }}
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{ width: '100%' }}
                        />
                    </div>
                    <button type="submit" className="btn-primary" disabled={isLoading} style={{ marginTop: '1.5rem' }}>
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
