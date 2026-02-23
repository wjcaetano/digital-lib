import { useEffect, useState } from 'react';
import { Card, Badge } from '../components/UIElements';
import { BookService } from '../services/api';
import './BooksPage.css';

const BooksPage = () => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBooks();
    }, []);

    const fetchBooks = async () => {
        try {
            const data = await BookService.getBooks();
            setBooks(data);
        } catch (error) {
            console.error("Error fetching books:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading Books Catalog...</div>;

    return (
        <div className="books-page">
            <div className="page-header">
                <h1 className="page-title">Books Catalog</h1>
                <button className="btn-primary" style={{ width: 'auto', marginTop: 0 }}>Add Book</button>
            </div>

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
