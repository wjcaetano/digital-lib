import { Link, useLocation } from 'react-router-dom';
import { Home, Book, Users, ClipboardList } from 'lucide-react';
import './Layout.css';

const Layout = ({ children }) => {
    const location = useLocation();

    const navItems = [
        { path: '/', icon: Home, label: 'Dashboard' },
        { path: '/books', icon: Book, label: 'Books Catalog' },
        { path: '/users', icon: Users, label: 'Members' },
        { path: '/loans', icon: ClipboardList, label: 'Loans & Returns' },
    ];

    return (
        <div className="layout-container">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <Book className="logo-icon" size={28} />
                    <h2>BTG Library</h2>
                </div>
                <nav className="sidebar-nav">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`nav-item ${isActive ? 'active' : ''}`}
                            >
                                <Icon size={20} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>
            <main className="main-content">
                <header className="top-header">
                    <div className="header-breadcrumbs">
                        <span>{navItems.find(n => n.path === location.pathname)?.label || 'Digital Library'}</span>
                    </div>
                    <div className="header-profile">
                        <div className="avatar">A</div>
                        <span>Admin Portal</span>
                    </div>
                </header>
                <div className="page-wrapper">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
