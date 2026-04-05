import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Line } from 'react-chartjs-2';
import axios from '../api/axios.config';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const PlusIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>);

export default function Dashboard() {
  const { user } = useSelector(state => state.auth);
  const { openModal, refreshKey } = useOutletContext();
  const [summary, setSummary] = useState({
    balance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    recentTransactions: [],
    monthlyTrend: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, [refreshKey]);

  const fetchSummary = async () => {
    try {
      const response = await axios.get('/transactions/summary');
      if (response.data.success) {
        setSummary(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (monthNum) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthNum - 1] || monthNum;
  };

  const chartData = {
    labels: summary.monthlyTrend.length > 0 
      ? summary.monthlyTrend.map(d => getMonthName(d[0]))
      : ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'],
    datasets: [
      {
        label: 'Expenses',
        data: summary.monthlyTrend.length > 0 
          ? summary.monthlyTrend.map(d => d[1])
          : [0, 0, 0, 0, 0, summary.totalExpenses],
        borderColor: '#7c3aed',
        backgroundColor: 'rgba(124, 58, 237, 0.15)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#7c3aed',
        borderWidth: 3
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: {
      y: { display: false },
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9a9cae' } }
    }
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
            <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>Overview</h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Welcome back {user?.name || 'User'}, track your expenses easily.</p>
          </div>
          
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button className="btn-primary" onClick={openModal}>
              <PlusIcon /> Add Transaction
            </button>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(45deg, #f59e0b, #ef4444)', cursor: 'pointer', border: '2px solid rgba(255,255,255,0.2)' }}></div>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '24px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px', fontWeight: 500 }}>Total Balance</p>
            <h2 style={{ fontSize: '32px', margin: '0 0 16px 0', letterSpacing: '-1px' }}>{formatCurrency(summary.balance)}</h2>
            <div style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
              <span style={{ color: 'var(--color-income)', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>+0%</span>
              <span style={{ color: 'var(--text-muted)' }}>vs last month</span>
            </div>
          </div>
          
          <div className="glass-panel" style={{ padding: '24px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px', fontWeight: 500 }}>Income</p>
            <h2 style={{ fontSize: '32px', margin: '0 0 16px 0', letterSpacing: '-1px' }}>{formatCurrency(summary.totalIncome)}</h2>
            <div style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
              <span style={{ color: 'var(--color-income)', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>+0%</span>
              <span style={{ color: 'var(--text-muted)' }}>vs last month</span>
            </div>
          </div>
          
          <div className="glass-panel" style={{ padding: '24px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px', fontWeight: 500 }}>Expenses</p>
            <h2 style={{ fontSize: '32px', margin: '0 0 16px 0', letterSpacing: '-1px' }}>{formatCurrency(summary.totalExpenses)}</h2>
             <div style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
              <span style={{ color: 'var(--color-expense)', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>+0%</span>
              <span style={{ color: 'var(--text-muted)' }}>vs last month</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', flex: 1 }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
             <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>Spending Analytics</h3>
             <div style={{ height: '260px', width: '100%', position: 'relative' }}>
                <Line options={chartOptions} data={chartData} />
             </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', margin: 0 }}>Recent</h3>
              <a href="/transactions" style={{ color: 'var(--accent-primary)', fontSize: '14px', textDecoration: 'none' }}>View all</a>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {summary.recentTransactions.length > 0 ? summary.recentTransactions.map(tx => (
                <div key={tx.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${tx.category.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>{tx.category.icon}</div>
                    <div>
                      <h4 style={{ margin: '0 0 2px 0', fontSize: '15px' }}>{tx.category.name}</h4>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{tx.transactionDate}</span>
                    </div>
                  </div>
                  <div style={{ fontWeight: 600, color: tx.type === 'INCOME' ? 'var(--color-income)' : 'inherit' }}>
                    {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </div>
                </div>
              )) : (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', padding: '20px' }}>No transactions yet.</p>
              )}
            </div>
          </div>
        </div>
    </>
  );
}
