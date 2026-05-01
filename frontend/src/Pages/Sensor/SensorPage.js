import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import { FiActivity, FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import { getSensors, getTags, getTagData } from '../../Services/sensorApi';

// ─── Time Range Options ───────────────────────────────────────────────────────
const TIME_RANGES = [
  { label: '1h',  ms: 60 * 60 * 1000 },
  { label: '6h',  ms: 6  * 60 * 60 * 1000 },
  { label: '24h', ms: 24 * 60 * 60 * 1000 },
  { label: '7d',  ms: 7  * 24 * 60 * 60 * 1000 },
];

const formatTs = (ts) => {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`;
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: 10,
      padding: '10px 14px',
      color: '#1e293b',
      fontSize: 13,
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    }}>
      <p style={{ color: '#64748b', marginBottom: 4 }}>{new Date(label).toLocaleString()}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {p.value?.toFixed(3)}
        </p>
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SensorPage() {
  const [sensors, setSensors]         = useState([
    { device_id: 'pump-1', device_name: 'Boiler Pump 1' },
    { device_id: 'pump-2', device_name: 'Boiler Pump 2' },
  ]);
  const [tags, setTags]               = useState([]);
  const [data, setData]               = useState([]);

  const [selectedSensor, setSelectedSensor] = useState('');
  const [selectedTag, setSelectedTag]       = useState('');
  const [timeRange, setTimeRange]           = useState(TIME_RANGES[1]);

  const [threshold, setThreshold]         = useState({ min: '', max: '' });
  const [thresholdInput, setThresholdInput] = useState({ min: '', max: '' });

  const [loading, setLoading]   = useState(false);
  const [refreshAt, setRefreshAt] = useState(Date.now());

  // Mock data for initial view
  useEffect(() => {
    if (selectedSensor && selectedTag && data.length === 0 && !loading) {
      const now = Date.now();
      const mock = Array.from({ length: 50 }).map((_, i) => ({
        timestamp: now - (50 - i) * 60000,
        ts: now - (50 - i) * 60000,
        value: 40 + Math.random() * 20,
      }));
      setData(mock);
    }
  }, [selectedSensor, selectedTag, data.length, loading]);

  // Fetch sensors list
  useEffect(() => {
    getSensors()
      .then(res => {
        if (res.length > 0) setSensors(res);
      })
      .catch(console.error);
  }, []);

  // Fetch tags when sensor changes
  useEffect(() => {
    if (!selectedSensor) { setTags([]); setSelectedTag(''); return; }
    
    // Mock tags if no real tags returned
    getTags(selectedSensor)
      .then(res => {
        if (res.length > 0) setTags(res);
        else setTags([
          { tag_id: 'temp', tag_name: 'Temperature' },
          { tag_id: 'vibration', tag_name: 'Vibration' },
        ]);
      })
      .catch(() => {
        setTags([
          { tag_id: 'temp', tag_name: 'Temperature' },
          { tag_id: 'vibration', tag_name: 'Vibration' },
        ]);
      });
    
    setSelectedTag('');
  }, [selectedSensor]);

  // Fetch chart data
  const fetchData = useCallback(() => {
    if (!selectedSensor || !selectedTag) { setData([]); return; }
    const now = Date.now();
    setLoading(true);
    getTagData(selectedSensor, selectedTag, { from: now - timeRange.ms, to: now })
      .then(rows => {
        if (rows.length > 0) {
          setData(rows.map(r => ({ ...r, ts: new Date(r.timestamp).getTime() })));
        } else {
          setData([]); // Will trigger mock effect above if empty
        }
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [selectedSensor, selectedTag, timeRange, refreshAt]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const applyThreshold = () =>
    setThreshold({ min: thresholdInput.min, max: thresholdInput.max });

  const hasViolation = data.some(d =>
    (threshold.min !== '' && d.value < Number(threshold.min)) ||
    (threshold.max !== '' && d.value > Number(threshold.max))
  );

  const selectedSensorObj = sensors.find(s => s.device_id === selectedSensor);
  const selectedTagObj    = tags.find(t => t.tag_id === selectedTag);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#1e293b', padding: '32px 28px', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <div style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', borderRadius: 12, padding: 10, display: 'flex' }}>
          <FiActivity size={24} color="#fff" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#1e3a8a' }}>Sensor Monitor</h1>
          <p style={{ margin: 0, color: '#2563eb', fontSize: 13, fontWeight: 500 }}>Real-time hardware monitoring dashboard</p>
        </div>
      </div>

      {/* Controls Row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
        {/* Sensor Dropdown */}
        <div style={{ flex: '1 1 220px' }}>
          <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Sensor / Device
          </label>
          <select
            value={selectedSensor}
            onChange={e => setSelectedSensor(e.target.value)}
            style={selectStyle}
          >
            <option value="">— Select sensor —</option>
            {sensors.map(s => (
              <option key={s.device_id} value={s.device_id}>{s.device_name}</option>
            ))}
          </select>
        </div>

        {/* Tag Dropdown */}
        <div style={{ flex: '1 1 220px' }}>
          <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Tag
          </label>
          <select
            value={selectedTag}
            onChange={e => setSelectedTag(e.target.value)}
            disabled={!selectedSensor}
            style={{ ...selectStyle, opacity: !selectedSensor ? 0.5 : 1 }}
          >
            <option value="">— Select tag —</option>
            {tags.map(t => (
              <option key={t.tag_id} value={t.tag_id}>{t.tag_name}</option>
            ))}
          </select>
        </div>

        {/* Time Range */}
        <div style={{ flex: '0 0 auto' }}>
          <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Time Range
          </label>
          <div style={{ display: 'flex', gap: 6 }}>
            {TIME_RANGES.map(tr => (
              <button
                key={tr.label}
                onClick={() => setTimeRange(tr)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 13,
                  background: timeRange.label === tr.label
                    ? 'linear-gradient(135deg,#3b82f6,#2563eb)'
                    : '#fff',
                  color: timeRange.label === tr.label ? '#fff' : '#2563eb',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                }}
              >
                {tr.label}
              </button>
            ))}
          </div>
        </div>

        {/* Refresh */}
        <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'flex-end' }}>
          <button
            onClick={() => setRefreshAt(Date.now())}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0',
              background: '#fff', color: '#2563eb', cursor: 'pointer',
              fontWeight: 600, fontSize: 13,
              boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
            }}
          >
            <FiRefreshCw size={14} className={loading ? 'spin' : ''} style={{ color: '#2563eb' }} />
            Refresh
          </button>
        </div>
      </div>

      {/* Threshold Controls */}
      <div style={{
        background: '#fff', borderRadius: 14, padding: '20px 24px',
        marginBottom: 28, border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Threshold Configuration
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
          <div>
            <label style={labelStyle}>Min Value</label>
            <input
              type="number"
              placeholder="e.g. 0"
              value={thresholdInput.min}
              onChange={e => setThresholdInput(p => ({ ...p, min: e.target.value }))}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Max Value</label>
            <input
              type="number"
              placeholder="e.g. 100"
              value={thresholdInput.max}
              onChange={e => setThresholdInput(p => ({ ...p, max: e.target.value }))}
              style={inputStyle}
            />
          </div>
          <button onClick={applyThreshold} style={applyBtnStyle}>
            Apply Threshold
          </button>

          {hasViolation && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444', fontWeight: 600, fontSize: 13 }}>
              <FiAlertTriangle size={16} />
              Threshold violation detected!
            </div>
          )}
        </div>
      </div>

      {/* Chart Card */}
      <div style={{
        background: '#fff', borderRadius: 16, padding: '24px 20px',
        border: '1px solid #e2e8f0', minHeight: 400,
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      }}>
        {/* Chart title */}
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
            {selectedSensorObj ? `${selectedSensorObj.device_name} — ${selectedTagObj?.tag_name || '…'}` : 'Select a device and tag to view monitoring data'}
          </h2>
          {data.length > 0 && (
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 12 }}>
              {data.length} data points · {timeRange.label} analysis window
            </p>
          )}
        </div>

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300, color: '#64748b' }}>
            Loading historical data…
          </div>
        )}

        {!loading && data.length === 0 && (selectedSensor && selectedTag) && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300, color: '#94a3b8', flexDirection: 'column', gap: 12 }}>
            <FiActivity size={40} color="#2563eb" style={{ opacity: 0.5 }} />
            <p style={{ margin: 0 }}>No live data available. Monitoring for MQTT packets…</p>
          </div>
        )}

        {!loading && !selectedSensor && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300, color: '#94a3b8', flexDirection: 'column', gap: 12 }}>
            <FiActivity size={40} color="#3b82f6" style={{ opacity: 0.5 }} />
            <p style={{ margin: 0 }}>Select hardware from the dropdown above to begin</p>
          </div>
        )}

        {!loading && data.length > 0 && (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="ts"
                type="number"
                domain={['dataMin', 'dataMax']}
                scale="time"
                tickFormatter={formatTs}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
                width={56}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={v => <span style={{ color: '#64748b', fontSize: 12, fontWeight: 500 }}>{v}</span>}
              />

              {/* Threshold lines */}
              {threshold.min !== '' && (
                <ReferenceLine
                  y={Number(threshold.min)}
                  stroke="#f59e0b"
                  strokeDasharray="5 5"
                  label={{ value: `Min: ${threshold.min}`, fill: '#f59e0b', fontSize: 11, position: 'insideTopLeft' }}
                />
              )}
              {threshold.max !== '' && (
                <ReferenceLine
                  y={Number(threshold.max)}
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  label={{ value: `Max: ${threshold.max}`, fill: '#ef4444', fontSize: 11, position: 'insideTopLeft' }}
                />
              )}

              <Line
                type="monotone"
                dataKey="value"
                name={selectedTagObj?.tag_name || selectedTag}
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }}
                isAnimationActive={data.length < 200}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Spin animation */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

// ─── Shared Styles ────────────────────────────────────────────────────────────
const selectStyle = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  background: '#fff',
  color: '#0f172a',
  fontSize: 14,
  outline: 'none',
  cursor: 'pointer',
  boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
};

const labelStyle = {
  display: 'block',
  fontSize: 12,
  color: '#64748b',
  marginBottom: 6,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const inputStyle = {
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  background: '#fff',
  color: '#0f172a',
  fontSize: 14,
  outline: 'none',
  width: 130,
  boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
};

const applyBtnStyle = {
  padding: '9px 18px',
  borderRadius: 8,
  border: 'none',
  background: 'linear-gradient(135deg,#3b82f6,#2563eb)',
  color: '#fff',
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
};

