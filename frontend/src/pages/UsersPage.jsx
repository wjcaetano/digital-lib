import { useEffect, useState } from 'react';
import { Card, Badge } from '../components/UIElements';
import { Modal } from '../components/Modal';
import { UserService } from '../services/api';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const data = await UserService.getUsers(0, 100);
            setUsers(data);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await UserService.createUser(formData);
            setIsModalOpen(false);
            setFormData({ name: '', email: '', password: '' });
            fetchUsers(); // Refresh list
        } catch (error) {
            alert("Failed to create user. " + (error.response?.data?.detail || ""));
        }
    };

    if (loading) return <div>Loading Members...</div>;

    return (
        <div className="users-page">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h1 className="page-title" style={{ margin: 0 }}>Library Members</h1>
                <button className="btn-primary" style={{ width: 'auto', marginTop: 0 }} onClick={() => setIsModalOpen(true)}>
                    Register Member
                </button>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {users.map(user => (
                    <Card key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ margin: '0 0 0.25rem 0' }}>{user.name}</h3>
                            <p style={{ margin: 0, color: 'var(--text-muted)' }}>{user.email}</p>
                        </div>
                        <div>
                            <Badge status={user.is_active ? 'Active' : 'Inactive'} />
                        </div>
                    </Card>
                ))}
                {users.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No members found.</p>}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register New Member">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input
                            type="text"
                            className="form-input"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            className="form-input"
                            required
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            className="form-input"
                            required
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                    <button type="submit" className="btn-primary">Create Account</button>
                </form>
            </Modal>
        </div>
    );
};

export default UsersPage;
