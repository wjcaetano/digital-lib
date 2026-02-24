import { useEffect, useState } from 'react';
import { Card, Badge } from '../components/UIElements';
import { Modal } from '../components/Modal';
import { BookService, UserService, LoanService } from '../services/api';
import './BooksPage.css';

const BooksPage = () => {
    const [books, setBooks] = useState([]);
    const [authors, setAuthors] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Add Book Modal
    const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newIsbn, setNewIsbn] = useState('');
    const [selectedAuthor, setSelectedAuthor] = useState('');
    const [modalError, setModalError] = useState('');
    const [submitLoading, setSubmitLoading] = useState(false);

    // Borrow Modal
    const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);
    const [borrowBook, setBorrowBook] = useState(null);
    const [selectedUser, setSelectedUser] = useState('');
    const [borrowError, setBorrowError] = useState('');
    const [borrowLoading, setBorrowLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [booksData, authorsData, usersData] = await Promise.all([
                BookService.getBooks(),
                BookService.getAuthors(),
                UserService.getUsers(0, 100),
            ]);
            setBooks(booksData);
            setAuthors(authorsData);
            setUsers(usersData);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddBook = async (e) => {
        e.preventDefault();
        if (!selectedAuthor) {
            setModalError('Please select an author.');
            return;
        }
        setSubmitLoading(true);
        setModalError('');
        try {
            await BookService.createBook({
                title: newTitle,
                isbn: newIsbn || null,
                author_id: parseInt(selectedAuthor),
            });
            setIsAddBookModalOpen(false);
            setNewTitle('');
            setNewIsbn('');
            setSelectedAuthor('');
            fetchData();
        } catch (error) {
            const detail = error.response?.data?.detail || '';
            setModalError(
                detail.toLowerCase().includes('isbn')
                    ? 'ISBN already registered for another book.'
                    : 'Failed to create book. Check the data and try again.'
            );
        } finally {
            setSubmitLoading(false);
        }
    };

    const openBorrowModal = (book) => {
        setBorrowBook(book);
        setSelectedUser('');
        setBorrowError('');
        setIsBorrowModalOpen(true);
    };

    const handleBorrow = async (e) => {
        e.preventDefault();
        if (!selectedUser) {
            setBorrowError('Please select a member.');
            return;
        }
        setBorrowLoading(true);
        setBorrowError('');
        try {
            await LoanService.createLoan({
                user_id: parseInt(selectedUser),
                book_id: borrowBook.id,
            });
            setIsBorrowModalOpen(false);
            setBorrowBook(null);
            fetchData();
        } catch (error) {
            const detail = error.response?.data?.detail || '';
            setBorrowError(
                detail || 'Could not create loan. Check if the member already has 3 active loans.'
            );
        } finally {
            setBorrowLoading(false);
        }
    };

    if (loading) return <div>Loading Books Catalog...</div>;

    return (
        <div className="books-page">
            <div className="page-header">
                <h1 className="page-title">Books Catalog</h1>
                <button
                    className="btn-primary"
                    style={{ width: 'auto', marginTop: 0 }}
                    onClick={() => setIsAddBookModalOpen(true)}
                >
                    Add Book
                </button>
            </div>

            {/* ── Add Book Modal ── */}
            <Modal
                isOpen={isAddBookModalOpen}
                onClose={() => setIsAddBookModalOpen(false)}
                title="Register New Book"
            >
                {modalError && (
                    <div style={{ color: 'var(--danger-text)', background: 'var(--danger-bg)', padding: '0.5rem', borderRadius: '4px', marginBottom: '1rem' }}>
                        {modalError}
                    </div>
                )}
                <form onSubmit={handleAddBook}>
                    <div className="form-group">
                        <label>Book Title</label>
                        <input
                            type="text"
                            className="form-input"
                            value={newTitle}
                            onChange={e => setNewTitle(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>ISBN (Optional)</label>
                        <input
                            type="text"
                            className="form-input"
                            value={newIsbn}
                            onChange={e => setNewIsbn(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Author</label>
                        <select
                            className="form-input"
                            value={selectedAuthor}
                            onChange={e => setSelectedAuthor(e.target.value)}
                            required
                        >
                            <option value="">Select an Author</option>
                            {authors.map(author => (
                                <option key={author.id} value={author.id}>
                                    {author.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                        <button type="button" className="btn-secondary" onClick={() => setIsAddBookModalOpen(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={submitLoading} style={{ width: 'auto' }}>
                            {submitLoading ? 'Saving...' : 'Confirm Registration'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ── Borrow Modal ── */}
            <Modal
                isOpen={isBorrowModalOpen}
                onClose={() => setIsBorrowModalOpen(false)}
                title={`Borrow: ${borrowBook?.title || ''}`}
            >
                {borrowError && (
                    <div style={{ color: 'var(--danger-text)', background: 'var(--danger-bg)', padding: '0.5rem', borderRadius: '4px', marginBottom: '1rem' }}>
                        {borrowError}
                    </div>
                )}
                <form onSubmit={handleBorrow}>
                    <div className="form-group">
                        <label>Select Member</label>
                        <select
                            className="form-input"
                            value={selectedUser}
                            onChange={e => setSelectedUser(e.target.value)}
                            required
                        >
                            <option value="">Select a member</option>
                            {users.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.name} — {user.email}
                                </option>
                            ))}
                        </select>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.5rem 0 1.5rem' }}>
                        Loan period: 14 days · Late fee: R$ 2.00/day
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button type="button" className="btn-secondary" onClick={() => setIsBorrowModalOpen(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={borrowLoading} style={{ width: 'auto' }}>
                            {borrowLoading ? 'Processing...' : 'Confirm Loan'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ── Books Grid ── */}
            <div className="books-grid">
                {books.length === 0 && (
                    <p style={{ color: 'var(--text-muted)' }}>No books registered yet.</p>
                )}
                {books.map(book => (
                    <Card key={book.id} className="book-card">
                        <div className="book-cover">
                            <span className="book-cover-title">{book.title.substring(0, 2).toUpperCase()}</span>
                        </div>
                        <div className="book-info">
                            <h3>{book.title}</h3>
                            <p style={{ margin: '0.2rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                {book.author?.name || '—'}
                            </p>
                            <p className="isbn" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                ISBN: {book.isbn || 'N/A'}
                            </p>
                            <div className="book-status" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                                <Badge status={book.is_available ? 'Available' : 'Unavailable'} />
                                {book.is_available && (
                                    <button
                                        onClick={() => openBorrowModal(book)}
                                        style={{
                                            background: 'var(--accent, #6366f1)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: 'var(--radius-sm)',
                                            padding: '0.3rem 0.7rem',
                                            fontSize: '0.8rem',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Borrow
                                    </button>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default BooksPage;
