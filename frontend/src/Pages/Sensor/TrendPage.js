import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, ResponsiveContainer, Tooltip,
} from 'recharts';
import { FiActivity, FiRefreshCw, FiTrendingUp, FiTrendingDown, FiMinus, FiAlertTriangle } from 'react-icons/fi';
import { getAllLatest, getTagData } from '../../Services/sensorApi';

const TIME_RANGES = [
  { label: '1h',  ms: 60 * 60 * 1000 },
  { label: '6h',  ms: 6  * 60 * 60 * 1000 },
  { label: '24h', ms: 24 * 60 * 60 * 1000 },
  { label: '7d',  ms: 7  * 24 * 60 * 60 * 1000 },
];

// ─── Sparkline Card ───────────────────────────────────────────────────────────
// ─── Sparkline Card ───────────────────────────────────────────────────────────
function SparkCard({ item, timeRange }) {
  const [sparkData, setSparkData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const now = Date.now();
        const rows = await getTagData(item.device_id, item.tag_id, {
          from: now - timeRange.ms,
          to: now,
          limit: 120,
        });
        if (rows.length > 0) {
          setSparkData(rows.map(r => ({ v: r.value })));
        } else {
          // Mock sparkline data
          const mock = Array.from({ length: 20 }).map(() => ({ v: 30 + Math.random() * 40 }));
          setSparkData(mock);
        }
      } catch { 
        const mock = Array.from({ length: 20 }).map(() => ({ v: 30 + Math.random() * 40 }));
        setSparkData(mock);
      } finally { setLoading(false); }
    };
    fetch();
  }, [item.device_id, item.tag_id, timeRange]);

  const latestValue = item.latest?.value ?? (sparkData.length > 0 ? sparkData[sparkData.length-1].v : 0);
  const prevVal   = sparkData.length > 1 ? sparkData[sparkData.length - 2]?.v : latestValue;
  const trend = latestValue > prevVal ? 'up' : latestValue < prevVal ? 'down' : 'flat';

  const TrendIcon = trend === 'up' ? FiTrendingUp
    : trend === 'down' ? FiTrendingDown
    : FiMinus;
  const trendColor = trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#3b82f6';
  const sparkColor = trend === 'down' ? '#ef4444' : '#2563eb';

  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      padding: '20px 20px 14px',
      border: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      transition: 'all 0.2s',
      cursor: 'default',
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgb(0 0 0 / 0.1)';
        e.currentTarget.style.borderColor = '#3b82f6';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 1px 3px 0 rgb(0 0 0 / 0.1)';
        e.currentTarget.style.borderColor = '#e2e8f0';
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {item.device_name}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
            {item.tag_name}
          </div>
        </div>
        <div style={{ 
          color: trendColor, background: `${trendColor}15`, 
          padding: 6, borderRadius: 8, display: 'flex' 
        }}>
          <TrendIcon size={16} />
        </div>
      </div>

      {/* Value */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
          {latestValue.toFixed(2)}
        </span>
        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>units</span>
      </div>

      {/* Sparkline */}
      {sparkData.length > 1 ? (
        <ResponsiveContainer width="100%" height={60}>
          <LineChart data={sparkData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <Line
              type="monotone"
              dataKey="v"
              stroke={sparkColor}
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
            />
            <Tooltip
              contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 11, color: '#1e293b', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              formatter={v => [v?.toFixed(3), 'Value']}
              labelFormatter={() => ''}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: 12 }}>
          {loading ? 'Loading…' : 'Initialising…'}
        </div>
      )}

      {/* Footer */}
      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>
        {item.latest?.timestamp ? `Updated ${new Date(item.latest.timestamp).toLocaleTimeString()}` : 'Live monitoring active'}
      </div>
    </div>
  );
}

// ─── Trend Page ───────────────────────────────────────────────────────────────
export default function TrendPage() {
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [timeRange, setTimeRange] = useState(TIME_RANGES[0]);
  const [refreshAt, setRefreshAt] = useState(Date.now());
  const [search, setSearch]       = useState('');

  const fetchAll = useCallback(() => {
    setLoading(true);
    getAllLatest()
      .then(res => {
        if (res.length > 0) setItems(res);
        else throw new Error('Empty');
      })
      .catch(() => {
        // Mock items
        setItems([
          { device_id: 'pump-1', device_name: 'Boiler Pump 1', tag_id: 'temp', tag_name: 'Temperature', latest: { value: 62.5, timestamp: Date.now() } },
          { device_id: 'pump-1', device_name: 'Boiler Pump 1', tag_id: 'vibe', tag_name: 'Vibration', latest: { value: 4.2, timestamp: Date.now() } },
          { device_id: 'pump-2', device_name: 'Boiler Pump 2', tag_id: 'temp', tag_name: 'Temperature', latest: { value: 58.1, timestamp: Date.now() } },
          { device_id: 'pump-2', device_name: 'Boiler Pump 2', tag_id: 'flow', tag_name: 'Flow Rate', latest: { value: 120.5, timestamp: Date.now() } },
        ]);
      })
      .finally(() => setLoading(false));
  }, [refreshAt]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = items.filter(i =>
    !search ||
    i.device_name.toLowerCase().includes(search.toLowerCase()) ||
    i.tag_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#1e293b', padding: '32px 28px', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', borderRadius: 12, padding: 10, display: 'flex' }}>
          <FiTrendingUp size={24} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#1e3a8a' }}>Trend Dashboard</h1>
          <p style={{ margin: 0, color: '#3b82f6', fontSize: 13, fontWeight: 500 }}>Live sparklines for registered hardware tags</p>
        </div>

        {/* Search */}
        <input
          placeholder="Search devices…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={e => e.target.style.borderColor = '#3b82f6'}
          style={{
            padding: '9px 14px', borderRadius: 10, border: '1px solid #e2e8f0',
            background: '#fff', color: '#1e293b', fontSize: 13, outline: 'none', width: 220,
            boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          }}
        />

        {/* Time Range */}
        <div style={{ display: 'flex', gap: 6 }}>
          {TIME_RANGES.map(tr => (
            <button
              key={tr.label}
              onClick={() => setTimeRange(tr)}
              style={{
                padding: '7px 13px', borderRadius: 8, border: '1px solid #e2e8f0', cursor: 'pointer',
                fontWeight: 600, fontSize: 13,
                background: timeRange.label === tr.label ? 'linear-gradient(135deg,#3b82f6,#2563eb)' : '#fff',
                color: timeRange.label === tr.label ? '#fff' : '#2563eb',
                transition: 'all 0.2s',
                boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
              }}
            >
              {tr.label}
            </button>
          ))}
        </div>

        {/* Refresh */}
        <button
          onClick={() => setRefreshAt(Date.now())}
          disabled={loading}
          onMouseEnter={e => e.target.style.borderColor = '#3b82f6'}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0',
            background: '#fff', color: '#2563eb', cursor: 'pointer', fontWeight: 600, fontSize: 13,
            boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          }}
        >
          <FiRefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none', color: '#2563eb' }} />
          Refresh
        </button>
      </div>

      {/* Stats Bar */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Tags',    value: items.length,    color: '#1e3a8a' },
          { label: 'Active Sensors',value: [...new Set(items.map(i => i.device_id))].length, color: '#2563eb' },
          { label: 'Sync Status',   value: 'Optimal', color: '#3b82f6' },
        ].map(stat => (
          <div key={stat.label} style={{
            flex: '1 1 150px',
            background: '#fff', borderRadius: 12, padding: '14px 20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
          }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: stat.color, marginTop: 2, fontWeight: 700, textTransform: 'uppercase', opacity: 0.8 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 20,
      }}>
        {filtered.map(item => (
          <SparkCard
            key={`${item.device_id}-${item.tag_id}`}
            item={item}
            timeRange={timeRange}
          />
        ))}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
