import React, { useState, useEffect } from 'react';
import axios from '../api/axios.config';

export default function TransactionModal({ isOpen, onClose, onSuccess, initialData }) {
  const selectStyle = {
    width: '100%',
    padding: '12px',
    borderRadius: '12px',
    background: 'rgba(7, 10, 20, 0.95)',
    border: '1px solid rgba(124, 58, 237, 0.45)',
    color: '#f2f2f5',
    colorScheme: 'dark'
  };

  const optionStyle = {
    backgroundColor: '#0b1020',
    color: '#f2f2f5'
  };

  const formatPaymentLabel = (method) => method.replaceAll('_', ' ');

  const getLocalDateString = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().split('T')[0];
  };

  const getDefaultFormData = () => ({
    amount: '',
    type: 'EXPENSE',
    categoryId: '',
    transactionDate: getLocalDateString(),
    description: '',
    paymentMethod: 'CASH'
  });

  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState(getDefaultFormData());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isEditMode = Boolean(initialData?.id);

  useEffect(() => {
    if (isOpen) {
      const fetchCategories = async () => {
        try {
          const response = await axios.get('/categories');
          if (response.data.success) {
            const allCategories = response.data.data;
            setCategories(allCategories);

            if (isEditMode) {
              setFormData({
                amount: initialData.amount ?? '',
                type: initialData.type || 'EXPENSE',
                categoryId: initialData.category?.id ?? '',
                transactionDate: initialData.transactionDate || getLocalDateString(),
                description: initialData.description || '',
                paymentMethod: initialData.paymentMethod || 'CASH'
              });
              return;
            }

            const defaultCategoryId = allCategories.find(c => c.type === 'EXPENSE')?.id || allCategories[0]?.id || '';
            setFormData({
              ...getDefaultFormData(),
              categoryId: defaultCategoryId
            });
          }
        } catch (err) {
          console.error('Error fetching categories:', err);
        }
      };
      fetchCategories();
      setError(null);
    }
  }, [isOpen, initialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'type') {
      // Re-set category when type changes
      const firstCatOfType = categories.find(c => c.type === value);
      setFormData({ ...formData, type: value, categoryId: firstCatOfType?.id || '' });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // Ensure numeric amount and long categoryId
      const submissionData = {
        ...formData,
        amount: parseFloat(formData.amount),
        categoryId: parseInt(formData.categoryId)
      };
      const response = isEditMode
        ? await axios.put(`/transactions/${initialData.id}`, submissionData)
        : await axios.post('/transactions', submissionData);
      if (response.data.success) {
        onSuccess?.();
        onClose();
        setFormData(getDefaultFormData());
      }
    } catch (err) {
      console.error('Error saving transaction:', err);
      setError(err.response?.data?.message || 'Error occurred while saving transaction.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
       <div className="glass-panel" style={{ padding: '32px', width: '500px', borderRadius: '24px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '20px', margin: 0 }}>{isEditMode ? 'Edit Transaction' : 'Add Transaction'}</h3>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '24px' }}>&times;</button>
          </div>

          {error && (
            <div style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
             <button className={formData.type === 'EXPENSE' ? 'btn-primary' : ''} style={{ flex: 1, padding: '10px', borderRadius: '12px', background: formData.type === 'EXPENSE' ? '' : 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} onClick={() => handleInputChange({ target: { name: 'type', value: 'EXPENSE' }})}>Expense</button>
             <button className={formData.type === 'INCOME' ? 'btn-primary' : ''} style={{ flex: 1, padding: '10px', borderRadius: '12px', background: formData.type === 'INCOME' ? '' : 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} onClick={() => handleInputChange({ target: { name: 'type', value: 'INCOME' }})}>Income</button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
             <div>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Amount</label>
                <input type="number" name="amount" required value={formData.amount} onChange={handleInputChange} placeholder="0.00" style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '24px', fontWeight: 600 }} />
             </div>
             <div>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Description</label>
                <input type="text" name="description" value={formData.description} onChange={handleInputChange} placeholder="What was this for?" style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
             </div>
             <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Category</label>
                  <select className="tx-select" name="categoryId" value={formData.categoryId} onChange={handleInputChange} style={selectStyle}>
                    {categories.filter(c => c.type === formData.type).map(cat => (
                      <option key={cat.id} value={cat.id} style={optionStyle}>{cat.icon} {cat.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Date</label>
                  <input type="date" name="transactionDate" value={formData.transactionDate} onChange={handleInputChange} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--surface-color)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                </div>
             </div>
             <div>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Payment Method</label>
                <select className="tx-select" name="paymentMethod" value={formData.paymentMethod} onChange={handleInputChange} style={selectStyle}>
                  {['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'NET_BANKING'].map((method) => (
                    <option key={method} value={method} style={optionStyle}>
                      {formatPaymentLabel(method)}
                    </option>
                  ))}
                </select>
             </div>
             <button type="submit" className="btn-primary" disabled={loading || !formData.categoryId} style={{ marginTop: '16px', padding: '14px', width: '100%', opacity: (!formData.categoryId) ? 0.6 : 1, cursor: (!formData.categoryId) ? 'not-allowed' : 'pointer' }}>
               {loading ? 'Saving...' : (isEditMode ? 'Update Transaction' : 'Save Transaction')}
             </button>
          </form>
       </div>
    </div>
  );
}
