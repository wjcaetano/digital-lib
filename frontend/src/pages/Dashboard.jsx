import { useEffect, useState } from 'react';
import { Card, Badge } from '../components/UIElements';
import { BookService, LoanService, UserService } from '../services/api';
import { Book, Users as UsersIcon, Clock, AlertTriangle } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalBooks: 0,
        totalUsers: 0,
        activeLoans: 0,
        delayedLoans: 0
    });

    const [recentLoans, setRecentLoans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [books, users, loans] = await Promise.all([
                    BookService.getBooks(0, 1000),
                    UserService.getUsers(0, 1000),
                    LoanService.getLoans(0, 100)
                ]);

                const active = loans.filter(l => l.status === 'ACTIVE').length;
                const delayed = loans.filter(l => l.status === 'DELAYED').length;

                setStats({
                    totalBooks: books.length,
                    totalUsers: users.length,
                    activeLoans: active,
                    delayedLoans: delayed
                });

                setRecentLoans(loans.slice(0, 5));
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) return <div>Loading dashboard...</div>;

    return (
        <div className="dashboard">
            <h1 className="page-title">Library Overview</h1>

            <div className="stats-grid">
                <Card className="stat-card">
                    <div className="stat-icon bg-blue"><Book size={24} /></div>
                    <div className="stat-info">
                        <span className="stat-label">Total Books</span>
                        <span className="stat-value">{stats.totalBooks}</span>
                    </div>
                </Card>

                <Card className="stat-card">
                    <div className="stat-icon bg-emerald"><UsersIcon size={24} /></div>
                    <div className="stat-info">
                        <span className="stat-label">Registered Members</span>
                        <span className="stat-value">{stats.totalUsers}</span>
                    </div>
                </Card>

                <Card className="stat-card">
                    <div className="stat-icon bg-amber"><Clock size={24} /></div>
                    <div className="stat-info">
                        <span className="stat-label">Active Loans</span>
                        <span className="stat-value">{stats.activeLoans}</span>
                    </div>
                </Card>

                <Card className="stat-card">
                    <div className="stat-icon bg-red"><AlertTriangle size={24} /></div>
                    <div className="stat-info">
                        <span className="stat-label">Delayed Loans</span>
                        <span className="stat-value">{stats.delayedLoans}</span>
                    </div>
                </Card>
            </div>

            <div className="dashboard-content">
                <Card className="recent-activity">
                    <h3>Recent Loan Activity</h3>
                    <div className="activity-list">
                        {recentLoans.length === 0 ? (
                            <p className="text-muted">No recent activity.</p>
                        ) : (
                            recentLoans.map(loan => (
                                <div key={loan.id} className="activity-item">
                                    <div className="activity-details">
                                        <span className="activity-title">Loan #{loan.id}</span>
                                        <span className="activity-time">Due: {new Date(loan.due_date).toLocaleDateString()}</span>
                                    </div>
                                    <Badge status={loan.status} />
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
