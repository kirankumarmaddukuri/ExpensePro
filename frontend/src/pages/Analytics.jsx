import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Doughnut } from 'react-chartjs-2';
import axios from '../api/axios.config';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const BudgetIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>);

export default function Analytics() {
  const { user } = useSelector(state => state.auth);
  const { openModal, refreshKey } = useOutletContext();
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [refreshKey]);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get('/transactions/analytics');
      if (response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: analytics.map(a => a.name),
    datasets: [
      {
        data: analytics.map(a => a.amount),
        backgroundColor: analytics.map(a => a.color || '#7c3aed'),
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#9a9cae', padding: 20, usePointStyle: true }
      }
    },
    cutout: '70%',
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: user?.currencyCode || 'USD',
    }).format(amount);
  };

  return (
    <>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>Analytics & Budgets</h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Analyze your spending and set limits.</p>
          </div>
          
          <button className="btn-primary" onClick={openModal}>
             <BudgetIcon /> Add Transaction
          </button>
      </header>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
         <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>Spending by Category</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
               {analytics.length > 0 ? analytics.map((item, idx) => {
                 const totalSpent = analytics.reduce((acc, curr) => acc + curr.amount, 0);
                 const percentage = ((item.amount / totalSpent) * 100).toFixed(0);
                 
                 return (
                   <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{item.icon}</span>
                            <span style={{ fontWeight: 500 }}>{item.name}</span>
                         </div>
                         <span style={{ color: 'var(--text-secondary)' }}>{formatCurrency(item.amount)} ({percentage}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
                         <div style={{ width: `${percentage}%`, height: '100%', background: item.color || 'var(--gradient-brand)', borderRadius: '6px' }}></div>
                      </div>
                   </div>
                 );
               }) : (
                 <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>No expense data to analyze yet.</p>
               )}
            </div>
         </div>
         
         <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>Category Distribution</h3>
            <div style={{ flex: 1, position: 'relative', minHeight: '300px' }}>
               {analytics.length > 0 ? (
                 <Doughnut data={chartData} options={chartOptions} />
               ) : (
                 <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                   <p style={{ color: 'var(--text-muted)' }}>Add transactions to see distribution</p>
                 </div>
               )}
            </div>
         </div>
      </div>
    </>
  );
}
