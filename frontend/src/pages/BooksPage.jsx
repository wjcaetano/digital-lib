import { useEffect, useState } from 'react';
import { Card, Badge } from '../components/UIElements';
import { Modal } from '../components/Modal';
import { BookService } from '../services/api';
import './BooksPage.css';

const BooksPage = () => {
    const [books, setBooks] = useState([]);
    const [authors, setAuthors] = useState([]);
    const [loading, setLoading] = useState(true);

    // Add Book Modal State
    const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newIsbn, setNewIsbn] = useState('');
    const [selectedAuthor, setSelectedAuthor] = useState('');
    const [modalError, setModalError] = useState('');
    const [submitLoading, setSubmitLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [booksData, authorsData] = await Promise.all([
                BookService.getBooks(),
                BookService.getAuthors()
            ]);
            setBooks(booksData);
            setAuthors(authorsData);
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
                isbn: newIsbn,
                author_id: parseInt(selectedAuthor)
            });
            setIsAddBookModalOpen(false);
            setNewTitle('');
            setNewIsbn('');
            setSelectedAuthor('');
            fetchData(); // Refresh the list
        } catch (error) {
            setModalError('Failed to create book. It might be a duplicate ISBN or invalid data.');
        } finally {
            setSubmitLoading(false);
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

            <div className="books-grid">
                {books.map(book => (
                    <Card key={book.id} className="book-card">
                        <div className="book-cover">
                            <span className="book-cover-title">{book.title.substring(0, 2)}</span>
                        </div>
                        <div className="book-info">
                            <h3>{book.title}</h3>
                            <p className="isbn">ISBN: {book.isbn}</p>
                            <div className="book-status">
                                <Badge status={book.is_available ? 'Available' : 'Unavailable'} />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default BooksPage;
