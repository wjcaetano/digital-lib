import { useEffect, useState } from 'react';
import { Card, Badge } from '../components/UIElements';
import { LoanService } from '../services/api';

const daysOverdue = (dueDateStr) => {
    const due = new Date(dueDateStr);
    const now = new Date();
    const diff = Math.floor((now - due) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
};

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
            const returned = await LoanService.returnLoan(loanId);
            const fee = returned.late_fee;
            if (fee > 0) {
                alert(`Book returned successfully!\nLate fee charged: R$ ${fee.toFixed(2)}`);
            } else {
                alert("Book returned successfully! No late fee.");
            }
            fetchLoans();
        } catch (error) {
            const detail = error.response?.data?.detail || "Return failed.";
            alert(detail);
        }
    };

    if (loading) return <div>Loading Loans Tracker...</div>;

    return (
        <div className="loans-page">
            <div className="page-header" style={{ marginBottom: '2rem' }}>
                <h1 className="page-title" style={{ margin: 0 }}>Active &amp; Overdue Loans</h1>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    Monitoring all currently checked-out books. Overdue loans are highlighted in red.
                </p>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {loans.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No active loans.</p>
                ) : (
                    loans.map(loan => {
                        const isOverdue = loan.status === 'OVERDUE';
                        const overdueDays = isOverdue ? daysOverdue(loan.due_date) : 0;
                        const accruedFee = overdueDays * 2.0;

                        return (
                            <Card
                                key={loan.id}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderLeft: isOverdue ? '4px solid var(--danger)' : '1px solid rgba(255,255,255,0.05)',
                                }}
                            >
                                <div>
                                    <h3 style={{ margin: '0 0 0.4rem 0' }}>
                                        Loan #{loan.id}
                                        <span style={{ fontWeight: 400, fontSize: '0.9rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                                            · User #{loan.user_id} · Book #{loan.book_id}
                                        </span>
                                    </h3>

                                    <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem', flexWrap: 'wrap' }}>
                                        <span>Borrowed: {new Date(loan.loan_date).toLocaleDateString()}</span>
                                        <span style={{ color: isOverdue ? 'var(--danger-text, #f87171)' : 'inherit' }}>
                                            Due: {new Date(loan.due_date).toLocaleDateString()}
                                        </span>
                                        {loan.return_date && (
                                            <span>Returned: {new Date(loan.return_date).toLocaleDateString()}</span>
                                        )}
                                    </div>

                                    {isOverdue && overdueDays > 0 && (
                                        <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem', color: 'var(--danger-text, #f87171)' }}>
                                            {overdueDays} day{overdueDays !== 1 ? 's' : ''} overdue
                                            · Accrued fine: R$ {accruedFee.toFixed(2)}
                                        </p>
                                    )}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', minWidth: '130px' }}>
                                    <Badge status={loan.status} />
                                    <button
                                        onClick={() => handleReturnAction(loan.id)}
                                        style={{
                                            background: 'rgba(255,255,255,0.1)',
                                            color: 'white',
                                            border: '1px solid rgba(255,255,255,0.15)',
                                            padding: '0.4rem 0.9rem',
                                            borderRadius: 'var(--radius-sm)',
                                            fontSize: '0.875rem',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Process Return
                                    </button>
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default LoansPage;
