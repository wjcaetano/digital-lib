import { useEffect, useState } from 'react';
import { Card, Badge } from '../components/UIElements';
import { LoanService } from '../services/api';

const LoansPage = () => {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLoans();
    }, []);

    const fetchLoans = async () => {
        try {
            const data = await LoanService.getLoans();
            setLoans(data);
        } catch (error) {
            console.error("Error fetching loans:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleReturnAction = async (loanId) => {
        if (!window.confirm("Confirm return for this book?")) return;
        try {
            await LoanService.returnLoan(loanId);
            alert("Book returned successfully!");
            fetchLoans();
        } catch (error) {
            alert("Return failed.");
        }
    };

    if (loading) return <div>Loading Loans Tracker...</div>;

    return (
        <div className="loans-page">
            <div className="page-header" style={{ marginBottom: '2rem' }}>
                <h1 className="page-title" style={{ margin: 0 }}>Active & Delayed Loans Tracker</h1>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Monitoring all currently checked-out assets globally.</p>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {loans.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No active loans.</p>
                ) : (
                    loans.map(loan => {
                        const isDelayed = loan.status === 'DELAYED';
                        return (
                            <Card key={loan.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: isDelayed ? '4px solid var(--danger)' : '1px solid rgba(255,255,255,0.05)' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 0.5rem 0' }}>Loan #{loan.id} (User: {loan.user_id}, Book: {loan.book_id})</h3>
                                    <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                        <span>Borrowed: {new Date(loan.loan_date).toLocaleDateString()}</span>
                                        <span style={{ color: isDelayed ? 'var(--danger-text)' : 'inherit' }}>
                                            Due: {new Date(loan.due_date).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                    <Badge status={loan.status} />
                                    <button
                                        onClick={() => handleReturnAction(loan.id)}
                                        style={{
                                            background: 'rgba(255,255,255,0.1)',
                                            color: 'white',
                                            padding: '0.5rem 1rem',
                                            borderRadius: 'var(--radius-sm)',
                                            fontSize: '0.875rem'
                                        }}
                                    >
                                        Process Return
                                    </button>
                                </div>
                            </Card>
                        )
                    })
                )}
            </div>
        </div>
    );
};

export default LoansPage;
