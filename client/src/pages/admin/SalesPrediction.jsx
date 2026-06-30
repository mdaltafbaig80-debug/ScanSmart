import { useState, useEffect } from 'react';
import { salesService } from '../../services/api';
import { Line, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { FiTrendingUp, FiInfo } from 'react-icons/fi';
import './Admin.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const SalesPrediction = () => {
    const [salesData, setSalesData] = useState([]);
    const [dailySales, setDailySales] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [salesRes, dailyRes] = await Promise.all([
                salesService.getSalesByProduct(),
                salesService.getDailySales(30)
            ]);
            setSalesData(salesRes.data);
            setDailySales(dailyRes.data);
        } catch (error) {
            console.error('Failed to fetch sales data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Generate simple linear regression prediction
    const generatePredictions = (data) => {
        if (data.length < 2) return [];

        const n = data.length;
        const x = data.map((_, i) => i + 1);
        const y = data.map(d => d.totalRevenue || d.totalQuantity || 0);

        // Calculate linear regression
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
        const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // Predict next 7 days
        return Array.from({ length: 7 }, (_, i) => ({
            day: n + i + 1,
            predicted: Math.max(0, slope * (n + i + 1) + intercept)
        }));
    };

    const predictions = generatePredictions(dailySales);

    const salesChartData = {
        labels: [...dailySales.map((_, i) => `Day ${i + 1}`), ...predictions.map((_, i) => `Day ${dailySales.length + i + 1}`)],
        datasets: [
            {
                label: 'Actual Sales',
                data: [...dailySales.map(d => d.totalRevenue), ...Array(predictions.length).fill(null)],
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                fill: true,
                tension: 0.4
            },
            {
                label: 'Predicted Sales',
                data: [...Array(dailySales.length).fill(null), ...predictions.map(p => p.predicted)],
                borderColor: '#10b981',
                borderDash: [5, 5],
                tension: 0.4
            }
        ]
    };

    const productChartData = {
        labels: salesData.slice(0, 10).map(d => d.productName),
        datasets: [
            {
                label: 'Total Revenue',
                data: salesData.slice(0, 10).map(d => d.totalRevenue),
                backgroundColor: [
                    '#2563eb', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444',
                    '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1'
                ]
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top'
            }
        },
        scales: {
            y: {
                beginAtZero: true
            }
        }
    };

    if (loading) {
        return (
            <div className="admin-page page">
                <div className="container">
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p>Loading predictions...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page page">
            <div className="container">
                <div className="admin-header">
                    <div>
                        <h1 className="page-title">Sales Prediction</h1>
                        <p className="page-subtitle">AI-powered insights using Linear Regression</p>
                    </div>
                </div>

                <div className="prediction-info card mb-lg">
                    <FiInfo size={20} />
                    <div>
                        <strong>Linear Regression Analysis</strong>
                        <p>This module uses Linear Regression to analyze past sales data and predict future demand. The predictions help optimize inventory management and stock reordering.</p>
                    </div>
                </div>

                <div className="charts-grid">
                    <div className="chart-card card">
                        <h3><FiTrendingUp /> Sales Trend & Prediction</h3>
                        <div className="chart-container">
                            <Line data={salesChartData} options={chartOptions} />
                        </div>
                        <div className="chart-legend">
                            <span className="legend-item actual">● Actual Sales (Past 30 Days)</span>
                            <span className="legend-item predicted">--- Predicted Sales (Next 7 Days)</span>
                        </div>
                    </div>

                    <div className="chart-card card">
                        <h3>Top Products by Revenue</h3>
                        <div className="chart-container">
                            <Bar data={productChartData} options={chartOptions} />
                        </div>
                    </div>
                </div>

                <div className="predictions-table card">
                    <h3>Predicted Demand (Next 7 Days)</h3>
                    <table className="products-table">
                        <thead>
                            <tr>
                                <th>Day</th>
                                <th>Predicted Revenue</th>
                                <th>Recommendation</th>
                            </tr>
                        </thead>
                        <tbody>
                            {predictions.map((pred, index) => (
                                <tr key={index}>
                                    <td>Day {pred.day}</td>
                                    <td>₹{pred.predicted.toFixed(2)}</td>
                                    <td>
                                        {pred.predicted > (predictions[0]?.predicted || 0) * 1.1
                                            ? <span className="badge badge-success">High Demand Expected</span>
                                            : <span className="badge badge-primary">Normal Demand</span>
                                        }
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SalesPrediction;
