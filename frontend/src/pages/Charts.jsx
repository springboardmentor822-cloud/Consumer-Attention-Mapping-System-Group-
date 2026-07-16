import React from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const Charts = ({ stores }) => {
  const barData = {
    labels: stores.length > 0 ? stores.map(store => store.name) : ['No Stores'],
    datasets: [
      {
        label: 'Active Stores',
        data: stores.length > 0 ? stores.map(store => store.is_active ? 1 : 0) : [0],
        backgroundColor: 'rgba(102, 126, 234, 0.8)',
        borderColor: 'rgba(102, 126, 234, 1)',
        borderWidth: 2,
        borderRadius: 8,
      },
      {
        label: 'Inactive Stores',
        data: stores.length > 0 ? stores.map(store => store.is_active ? 0 : 1) : [0],
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 2,
        borderRadius: 8,
      }
    ]
  };

  const doughnutData = {
    labels: ['Active Stores', 'Inactive Stores'],
    datasets: [
      {
        data: [
          stores.filter(s => s.is_active).length || 1,
          stores.filter(s => !s.is_active).length || 0
        ],
        backgroundColor: [
          'rgba(52, 211, 153, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgba(52, 211, 153, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 2,
      }
    ]
  };

  const lineData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Store Growth',
        data: [0, 1, 2, 3, 5, stores.length || 0],
        borderColor: 'rgba(102, 126, 234, 1)',
        backgroundColor: 'rgba(102, 126, 234, 0.2)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(102, 126, 234, 1)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 6,
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.05)',
        }
      },
      x: {
        grid: {
          display: false,
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
        }
      }
    },
    cutout: '60%',
  };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.05)',
        }
      },
      x: {
        grid: {
          display: false,
        }
      }
    }
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
      gap: '24px',
      marginBottom: '32px'
    }}>
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#1f2937', fontSize: '16px' }}>
          📊 Store Status by Name
        </h3>
        <div style={{ height: '250px' }}>
          <Bar data={barData} options={options} />
        </div>
      </div>

      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#1f2937', fontSize: '16px' }}>
          🍩 Store Status Distribution
        </h3>
        <div style={{ height: '250px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '200px', height: '200px' }}>
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#1f2937', fontSize: '16px' }}>
          📈 Store Growth Trend
        </h3>
        <div style={{ height: '250px' }}>
          <Line data={lineData} options={lineOptions} />
        </div>
      </div>
    </div>
  );
};

export default Charts;