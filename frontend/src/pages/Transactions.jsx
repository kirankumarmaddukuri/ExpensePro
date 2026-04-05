import React, { useState, useEffect } from 'react';
import axios from '../api/axios.config';
import { useOutletContext } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PlusIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>);
const TrashIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>);
const EditIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>);

export default function Transactions() {
  const { user } = useSelector(state => state.auth);
  const { openModal, refreshKey } = useOutletContext();
  const [transactions, setTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, [refreshKey]);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get('/transactions?sort=transactionDate,desc&sort=id,desc');
      if (response.data.success) {
        setTransactions(response.data.data.content);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await axios.delete(`/transactions/${id}`);
        fetchTransactions();
      } catch (err) {
        console.error('Error deleting transaction:', err);
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: user?.currencyCode || 'USD',
    }).format(amount);
  };

  const filteredTransactions = transactions.filter(tx => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      (tx.description || '').toLowerCase().includes(query) ||
      (tx.category?.name || '').toLowerCase().includes(query) ||
      (tx.paymentMethod || '').toLowerCase().includes(query) ||
      String(tx.amount || '').toLowerCase().includes(query) ||
      String(tx.transactionDate || '').toLowerCase().includes(query);

    const matchesType = typeFilter === 'ALL' || tx.type === typeFilter;

    return matchesSearch && matchesType;
  });

  return (
    <>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>Transactions</h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>View and manage all your income and expenses.</p>
          </div>
          
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button className="btn-primary" onClick={openModal}>
              <PlusIcon /> Add Transaction
            </button>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(45deg, #f59e0b, #ef4444)', cursor: 'pointer', border: '2px solid rgba(255,255,255,0.2)' }}></div>
          </div>
      </header>
      
      <div className="glass-panel" style={{ padding: '24px', flex: 1 }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transactions..."
              style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', width: '300px' }}
            />
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{ padding: '12px 16px', borderRadius: '12px', background: 'var(--surface-color)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
              >
                <option value="ALL">All Types</option>
                <option value="INCOME">Income</option>
                <option value="EXPENSE">Expense</option>
              </select>
            </div>
         </div>

         {loading ? (
           <p style={{ textAlign: 'center', padding: '40px' }}>Loading transactions...</p>
         ) : (
           <div style={{ width: '100%', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '16px', fontWeight: 500 }}>Transaction</th>
                    <th style={{ padding: '16px', fontWeight: 500 }}>Category</th>
                    <th style={{ padding: '16px', fontWeight: 500 }}>Date</th>
                    <th style={{ padding: '16px', fontWeight: 500, textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: '16px', fontWeight: 500, textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length > 0 ? filteredTransactions.map(tx => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 500 }}>{tx.description || 'No description'}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{tx.paymentMethod}</div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: `${tx.category.color}20`, padding: '4px 12px', borderRadius: '20px' }}>
                           <span>{tx.category.icon}</span> {tx.category.name}
                        </div>
                      </td>
                      <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{tx.transactionDate}</td>
                      <td style={{ padding: '16px', fontWeight: 600, textAlign: 'right', color: tx.type === 'INCOME' ? 'var(--color-income)' : 'inherit' }}>
                        {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button onClick={() => openModal(tx)} style={{ background: 'transparent', border: 'none', color: '#60a5fa', cursor: 'pointer', opacity: 0.85 }}>
                            <EditIcon />
                          </button>
                          <button onClick={() => handleDelete(tx.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.7 }}>
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No transactions found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
           </div>
         )}
      </div>
    </>
  );
}
