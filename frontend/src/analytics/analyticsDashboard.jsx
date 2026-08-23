/**
 * Analytics Dashboard Component
 * Provides insights into user behavior and app performance
 * Privacy-focused with data visualization
 */

import React, { useState, useEffect } from 'react';
import './analyticsDashboard.css';

const AnalyticsDashboard = ({ isVisible, onClose }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isVisible) {
      loadAnalyticsData();
    }
  }, [isVisible, timeRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // In a real app, this would fetch from analytics API
      const mockData = await getMockAnalyticsData(timeRange);
      setAnalyticsData(mockData);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMockAnalyticsData = (range) => {
    const days = parseInt(range.replace('d', ''));
    return {
      overview: {
        totalUsers: 1247,
        activeUsers: 892,
        newUsers: 156,
        totalSessions: 3421,
        avgSessionDuration: 245000, // milliseconds
        bounceRate: 0.32,
        pageViews: 15642,
        conversionRate: 0.18
      },
      userBehavior: {
        topPages: [
          { path: '/', views: 5421, avgTime: 180000 },
          { path: '/gallery', views: 3892, avgTime: 420000 },
          { path: '/upload', views: 2156, avgTime: 320000 },
          { path: '/search', views: 1567, avgTime: 89000 },
          { path: '/settings', views: 423, avgTime: 156000 }
        ],
        featureUsage: {
          photo_upload: 1567,
          photo_view: 8923,
          search: 2341,
          filter: 1876,
          tag_add: 1234,
          theme_change: 456
        },
        deviceStats: {
          desktop: 0.62,
          mobile: 0.34,
          tablet: 0.04
        },
        browserStats: {
          chrome: 0.48,
          safari: 0.23,
          firefox: 0.12,
          edge: 0.11,
          other: 0.06
        }
      },
      performance: {
        avgLoadTime: 2340,
        coreWebVitals: {
          lcp: 1892, // Largest Contentful Paint (ms)
          fid: 78,   // First Input Delay (ms)
          cls: 0.08  // Cumulative Layout Shift
        },
        errorRate: 0.023,
        apiResponseTime: {
          '/api/photos': 145,
          '/api/upload': 2340,
          '/api/search': 89,
          '/api/auth': 234
        }
      },
      conversions: {
        user_registered: 892,
        first_photo_upload: 723,
        photo_organized: 456,
        feature_discovery: 234,
        conversionFunnel: [
          { step: 'Visit', count: 1247, rate: 1.0 },
          { step: 'Sign Up', count: 892, rate: 0.72 },
          { step: 'Upload Photo', count: 723, rate: 0.81 },
          { step: 'Organize Photos', count: 456, rate: 0.63 },
          { step: 'Use Advanced Features', count: 234, rate: 0.51 }
        ]
      }
    };
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatTime = (ms) => {
    if (ms < 1000) return ms + 'ms';
    if (ms < 60000) return (ms / 1000).toFixed(1) + 's';
    return (ms / 60000).toFixed(1) + 'm';
  };

  const formatPercentage = (num) => {
    return (num * 100).toFixed(1) + '%';
  };

  if (!isVisible) return null;

  return (
    <div className="analytics-dashboard-overlay">
      <div className="analytics-dashboard">
        <div className="analytics-header">
          <h2>Analytics Dashboard</h2>
          <div className="analytics-controls">
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="time-range-select"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <button onClick={onClose} className="close-button">×</button>
          </div>
        </div>

        <div className="analytics-tabs">
          {['overview', 'behavior', 'performance', 'conversions'].map(tab => (
            <button
              key={tab}
              className={`tab-button ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="analytics-content">
          {loading ? (
            <div className="loading-spinner">Loading analytics data...</div>
          ) : (
            <>
              {activeTab === 'overview' && <OverviewTab data={analyticsData.overview} />}
              {activeTab === 'behavior' && <BehaviorTab data={analyticsData.userBehavior} />}
              {activeTab === 'performance' && <PerformanceTab data={analyticsData.performance} />}
              {activeTab === 'conversions' && <ConversionsTab data={analyticsData.conversions} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const OverviewTab = ({ data }) => (
  <div className="overview-grid">
    <div className="metric-card">
      <h3>Total Users</h3>
      <p className="metric-value">{data.totalUsers.toLocaleString()}</p>
      <p className="metric-change positive">+12.3%</p>
    </div>
    <div className="metric-card">
      <h3>Active Users</h3>
      <p className="metric-value">{data.activeUsers.toLocaleString()}</p>
      <p className="metric-change positive">+8.7%</p>
    </div>
    <div className="metric-card">
      <h3>Avg Session Duration</h3>
      <p className="metric-value">{formatTime(data.avgSessionDuration)}</p>
      <p className="metric-change negative">-2.1%</p>
    </div>
    <div className="metric-card">
      <h3>Bounce Rate</h3>
      <p className="metric-value">{formatPercentage(data.bounceRate)}</p>
      <p className="metric-change positive">-5.4%</p>
    </div>
    <div className="metric-card">
      <h3>Page Views</h3>
      <p className="metric-value">{data.pageViews.toLocaleString()}</p>
      <p className="metric-change positive">+15.2%</p>
    </div>
    <div className="metric-card">
      <h3>Conversion Rate</h3>
      <p className="metric-value">{formatPercentage(data.conversionRate)}</p>
      <p className="metric-change positive">+3.1%</p>
    </div>
  </div>
);

const BehaviorTab = ({ data }) => (
  <div className="behavior-grid">
    <div className="behavior-section">
      <h3>Top Pages</h3>
      <div className="pages-list">
        {data.topPages.map((page, index) => (
          <div key={index} className="page-item">
            <span className="page-path">{page.path}</span>
            <span className="page-views">{formatNumber(page.views)} views</span>
            <span className="page-time">{formatTime(page.avgTime)}</span>
          </div>
        ))}
      </div>
    </div>

    <div className="behavior-section">
      <h3>Feature Usage</h3>
      <div className="features-list">
        {Object.entries(data.featureUsage).map(([feature, count]) => (
          <div key={feature} className="feature-item">
            <span className="feature-name">{feature.replace('_', ' ')}</span>
            <div className="feature-bar">
              <div 
                className="feature-bar-fill" 
                style={{ width: `${(count / Math.max(...Object.values(data.featureUsage))) * 100}%` }}
              />
            </div>
            <span className="feature-count">{formatNumber(count)}</span>
          </div>
        ))}
      </div>
    </div>

    <div className="behavior-section">
      <h3>Device Distribution</h3>
      <div className="device-stats">
        {Object.entries(data.deviceStats).map(([device, percentage]) => (
          <div key={device} className="device-item">
            <span className="device-name">{device}</span>
            <span className="device-percentage">{formatPercentage(percentage)}</span>
          </div>
        ))}
      </div>
    </div>

    <div className="behavior-section">
      <h3>Browser Distribution</h3>
      <div className="browser-stats">
        {Object.entries(data.browserStats).map(([browser, percentage]) => (
          <div key={browser} className="browser-item">
            <span className="browser-name">{browser}</span>
            <span className="browser-percentage">{formatPercentage(percentage)}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const PerformanceTab = ({ data }) => (
  <div className="performance-grid">
    <div className="performance-section">
      <h3>Core Web Vitals</h3>
      <div className="vitals-list">
        <div className="vital-item">
          <span className="vital-name">Largest Contentful Paint</span>
          <span className="vital-value good">{data.coreWebVitals.lcp}ms</span>
        </div>
        <div className="vital-item">
          <span className="vital-name">First Input Delay</span>
          <span className="vital-value good">{data.coreWebVitals.fid}ms</span>
        </div>
        <div className="vital-item">
          <span className="vital-name">Cumulative Layout Shift</span>
          <span className="vital-value good">{data.coreWebVitals.cls}</span>
        </div>
      </div>
    </div>

    <div className="performance-section">
      <h3>API Response Times</h3>
      <div className="api-list">
        {Object.entries(data.apiResponseTime).map(([endpoint, time]) => (
          <div key={endpoint} className="api-item">
            <span className="api-endpoint">{endpoint}</span>
            <span className="api-time">{time}ms</span>
          </div>
        ))}
      </div>
    </div>

    <div className="performance-section">
      <h3>Error Rate</h3>
      <div className="error-rate">
        <span className="error-percentage">{formatPercentage(data.errorRate)}</span>
        <span className="error-trend negative">↑ 0.3%</span>
      </div>
    </div>
  </div>
);

const ConversionsTab = ({ data }) => (
  <div className="conversions-grid">
    <div className="conversions-section">
      <h3>Conversion Events</h3>
      <div className="conversions-list">
        {Object.entries(data).map(([event, count]) => (
          <div key={event} className="conversion-item">
            <span className="conversion-name">{event.replace('_', ' ')}</span>
            <span className="conversion-count">{count.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>

    <div className="conversions-section">
      <h3>Conversion Funnel</h3>
      <div className="funnel-chart">
        {data.conversionFunnel.map((step, index) => (
          <div key={index} className="funnel-step">
            <div className="funnel-step-info">
              <span className="funnel-step-name">{step.step}</span>
              <span className="funnel-step-count">{step.count}</span>
              <span className="funnel-step-rate">{formatPercentage(step.rate)}</span>
            </div>
            <div className="funnel-bar">
              <div 
                className="funnel-bar-fill" 
                style={{ width: `${step.rate * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default AnalyticsDashboard;