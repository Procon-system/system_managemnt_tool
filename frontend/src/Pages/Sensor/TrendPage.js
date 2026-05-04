import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  FiActivity,
  FiRefreshCw,
  FiTrendingUp,
  FiTrendingDown,
  FiMinus,
  FiX,
  FiInfo,
} from 'react-icons/fi';

import {
  getAllLatest,
  getTagData,
} from '../../Services/sensorApi';

const TIME_RANGES = [
  { label: '1h', ms: 60 * 60 * 1000 },
  { label: '6h', ms: 6 * 60 * 60 * 1000 },
  { label: '24h', ms: 24 * 60 * 60 * 1000 },
  { label: '7d', ms: 7 * 24 * 60 * 60 * 1000 },
];

const displayDeviceName = item =>
  item?.device_actual_name ||
  item?.device_name ||
  item?.device_id ||
  'Unknown device';

const displayTagName = item =>
  item?.tag_actual_name ||
  item?.tag_name ||
  item?.tag_id ||
  'Unknown tag';

const formatTime = timestamp => {
  if (!timestamp) return '—';
  return new Date(timestamp).toLocaleString();
};

const formatChartTime = ts => {
  const d = new Date(ts);

  return `${d.getHours().toString().padStart(2, '0')}:${d
    .getMinutes()
    .toString()
    .padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
};

function SparkCard({ item, timeRange, onClick }) {
  const [sparkData, setSparkData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchSparkline = async () => {
      setLoading(true);

      try {
        const now = Date.now();

        const rows = await getTagData(item.device_id, item.tag_id, {
          from: now - timeRange.ms,
          to: now,
          limit: 120,
        });

        if (!mounted) return;

        const mapped = Array.isArray(rows)
          ? rows
              .filter(row => row.value !== undefined && row.value !== null)
              .map(row => ({
                v: Number(row.value),
                timestamp: row.timestamp,
              }))
              .filter(row => !Number.isNaN(row.v))
          : [];

        setSparkData(mapped);
      } catch (err) {
        console.error('Failed to load sparkline data:', err);

        if (mounted) {
          setSparkData([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchSparkline();

    return () => {
      mounted = false;
    };
  }, [item.device_id, item.tag_id, timeRange]);

  const latestValue =
    item.latest?.value !== undefined && item.latest?.value !== null
      ? Number(item.latest.value)
      : sparkData.length > 0
        ? sparkData[sparkData.length - 1].v
        : null;

  const previousValue =
    sparkData.length > 1
      ? sparkData[sparkData.length - 2]?.v
      : latestValue;

  const trend =
    latestValue === null || previousValue === null
      ? 'flat'
      : latestValue > previousValue
        ? 'up'
        : latestValue < previousValue
          ? 'down'
          : 'flat';

  const TrendIcon =
    trend === 'up'
      ? FiTrendingUp
      : trend === 'down'
        ? FiTrendingDown
        : FiMinus;

  const trendColor =
    trend === 'up'
      ? '#10b981'
      : trend === 'down'
        ? '#ef4444'
        : '#3b82f6';

  const sparkColor = trend === 'down' ? '#ef4444' : '#2563eb';
  const unit = item.unit || '';

  return (
    <div
      style={cardStyle}
      onClick={() => onClick(item)}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgb(0 0 0 / 0.1)';
        e.currentTarget.style.borderColor = '#3b82f6';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 1px 3px 0 rgb(0 0 0 / 0.1)';
        e.currentTarget.style.borderColor = '#e2e8f0';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={cardTopRowStyle}>
        <div>
          <div style={deviceLabelStyle}>
            {displayDeviceName(item)}
          </div>

          <div style={tagTitleStyle}>
            {displayTagName(item)}
          </div>

          <div style={tagIdStyle}>
            {item.tag_id}
          </div>
        </div>

        <div
          style={{
            color: trendColor,
            background: `${trendColor}15`,
            padding: 6,
            borderRadius: 8,
            display: 'flex',
          }}
        >
          <TrendIcon size={16} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={valueStyle}>
          {latestValue === null ? '—' : latestValue.toFixed(2)}
        </span>

        <span style={unitStyle}>
          {unit || 'units'}
        </span>
      </div>

      {sparkData.length > 1 ? (
        <ResponsiveContainer width="100%" height={64}>
          <LineChart
            data={sparkData}
            margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
          >
            <Line
              type="monotone"
              dataKey="v"
              stroke={sparkColor}
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
            />

            <Tooltip
              contentStyle={tooltipContentStyle}
              formatter={value => [Number(value).toFixed(3), 'Value']}
              labelFormatter={() => ''}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div style={sparkEmptyStyle}>
          {loading ? 'Loading history…' : 'No history yet'}
        </div>
      )}

      <div style={footerStyle}>
        {item.latest?.timestamp
          ? `Updated ${new Date(item.latest.timestamp).toLocaleString()}`
          : 'Waiting for MQTT data'}
      </div>

      <div style={clickHintStyle}>
        Click to view detailed chart
      </div>
    </div>
  );
}

function SensorDetailModal({ item, timeRange, onClose }) {
  const [detailData, setDetailData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!item) return undefined;

    let mounted = true;

    const fetchDetailData = async () => {
      setLoading(true);

      try {
        const now = Date.now();

        const rows = await getTagData(item.device_id, item.tag_id, {
          from: now - timeRange.ms,
          to: now,
          limit: 2000,
        });

        if (!mounted) return;

        const mapped = Array.isArray(rows)
          ? rows
              .filter(row => row.timestamp && row.value !== undefined && row.value !== null)
              .map(row => ({
                ...row,
                value: Number(row.value),
                ts: new Date(row.timestamp).getTime(),
              }))
              .filter(row => !Number.isNaN(row.value) && !Number.isNaN(row.ts))
          : [];

        setDetailData(mapped);
      } catch (err) {
        console.error('Failed to load detailed sensor data:', err);

        if (mounted) {
          setDetailData([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchDetailData();

    return () => {
      mounted = false;
    };
  }, [item, timeRange]);

  if (!item) return null;

  const values = detailData.map(row => row.value);
  const latestValue =
    item.latest?.value !== undefined && item.latest?.value !== null
      ? Number(item.latest.value)
      : values.length
        ? values[values.length - 1]
        : null;

  const minValue = values.length ? Math.min(...values) : null;
  const maxValue = values.length ? Math.max(...values) : null;
  const avgValue = values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null;

  const unit = item.unit || '';
  const latestTimestamp = item.latest?.timestamp || detailData[detailData.length - 1]?.timestamp;

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <div>
            <div style={modalKickerStyle}>
              Sensor Detail
            </div>

            <h2 style={modalTitleStyle}>
              {displayTagName(item)}
            </h2>

            <p style={modalSubtitleStyle}>
              {displayDeviceName(item)}
            </p>
          </div>

          <button type="button" style={closeButtonStyle} onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        <div style={detailGridStyle}>
          <DetailBox
            label="Latest"
            value={latestValue === null ? '—' : latestValue.toFixed(2)}
            suffix={unit}
          />

          <DetailBox
            label="Minimum"
            value={minValue === null ? '—' : minValue.toFixed(2)}
            suffix={unit}
          />

          <DetailBox
            label="Maximum"
            value={maxValue === null ? '—' : maxValue.toFixed(2)}
            suffix={unit}
          />

          <DetailBox
            label="Average"
            value={avgValue === null ? '—' : avgValue.toFixed(2)}
            suffix={unit}
          />
        </div>

        <div style={descriptionBoxStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiInfo size={16} color="#2563eb" />
            <strong>Details</strong>
          </div>

          <div style={descriptionGridStyle}>
            <DescriptionItem label="Device ID" value={item.device_id} />
            <DescriptionItem label="Device Name" value={displayDeviceName(item)} />
            <DescriptionItem label="Tag ID" value={item.tag_id} />
            <DescriptionItem label="Tag Name" value={displayTagName(item)} />
            <DescriptionItem label="Sensor Type" value={item.sensor_type || '—'} />
            <DescriptionItem label="Unit" value={unit || '—'} />
            <DescriptionItem label="Latest Update" value={formatTime(latestTimestamp)} />
            <DescriptionItem label="Data Points" value={detailData.length} />
          </div>
        </div>

        <div style={largeChartBoxStyle}>
          <div style={largeChartHeaderStyle}>
            <div>
              <h3 style={largeChartTitleStyle}>
                Historical Trend
              </h3>

              <p style={largeChartSubtitleStyle}>
                Showing {timeRange.label} history for this sensor tag.
              </p>
            </div>
          </div>

          {loading ? (
            <div style={largeChartEmptyStyle}>
              Loading detailed chart…
            </div>
          ) : detailData.length === 0 ? (
            <div style={largeChartEmptyStyle}>
              No historical data available for this sensor.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <LineChart data={detailData} margin={{ top: 20, right: 24, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />

                <XAxis
                  dataKey="ts"
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  scale="time"
                  tickFormatter={formatChartTime}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />

                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                  width={56}
                />

                <Tooltip
                  contentStyle={largeTooltipStyle}
                  labelFormatter={label => new Date(label).toLocaleString()}
                  formatter={value => [
                    `${Number(value).toFixed(3)} ${unit || ''}`,
                    displayTagName(item),
                  ]}
                />

                <Legend
                  formatter={() => (
                    <span style={{ color: '#334155', fontSize: 12, fontWeight: 700 }}>
                      {displayTagName(item)}
                    </span>
                  )}
                />

                <Line
                  type="monotone"
                  dataKey="value"
                  name={displayTagName(item)}
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{
                    r: 6,
                    fill: '#2563eb',
                    stroke: '#fff',
                    strokeWidth: 2,
                  }}
                  isAnimationActive={detailData.length < 200}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailBox({ label, value, suffix }) {
  return (
    <div style={detailBoxStyle}>
      <div style={detailLabelStyle}>{label}</div>

      <div style={detailValueStyle}>
        {value}
        {suffix ? <span style={detailSuffixStyle}> {suffix}</span> : null}
      </div>
    </div>
  );
}

function DescriptionItem({ label, value }) {
  return (
    <div>
      <div style={descriptionLabelStyle}>{label}</div>
      <div style={descriptionValueStyle}>{value || '—'}</div>
    </div>
  );
}

export default function TrendPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState(TIME_RANGES[0]);
  const [refreshAt, setRefreshAt] = useState(Date.now());
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchAll = useCallback(() => {
    setLoading(true);
    setError('');

    getAllLatest()
      .then(rows => {
        setItems(Array.isArray(rows) ? rows : []);
      })
      .catch(err => {
        console.error('Failed to load latest sensor values:', err);
        setItems([]);
        setError('Failed to load latest sensor values.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [refreshAt]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const id = setInterval(() => {
      setRefreshAt(Date.now());
    }, 15000);

    return () => clearInterval(id);
  }, []);

  const filtered = items.filter(item => {
    const q = search.toLowerCase().trim();

    if (!q) return true;

    return (
      displayDeviceName(item).toLowerCase().includes(q) ||
      displayTagName(item).toLowerCase().includes(q) ||
      item.device_id?.toLowerCase().includes(q) ||
      item.tag_id?.toLowerCase().includes(q)
    );
  });

  const activeSensors = new Set(items.map(item => item.device_id)).size;

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div style={iconBoxStyle}>
          <FiTrendingUp size={24} color="#fff" />
        </div>

        <div style={{ flex: 1 }}>
          <h1 style={h1Style}>Trend Dashboard</h1>
          <p style={subtitleStyle}>
            Live trend cards for registered hardware tags
          </p>
        </div>

        <input
          placeholder="Search devices or tags…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={searchStyle}
        />

        <div style={{ display: 'flex', gap: 6 }}>
          {TIME_RANGES.map(range => (
            <button
              key={range.label}
              type="button"
              onClick={() => setTimeRange(range)}
              style={{
                ...rangeButtonStyle,
                background:
                  timeRange.label === range.label
                    ? 'linear-gradient(135deg,#3b82f6,#2563eb)'
                    : '#fff',
                color: timeRange.label === range.label ? '#fff' : '#2563eb',
              }}
            >
              {range.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setRefreshAt(Date.now())}
          disabled={loading}
          style={refreshButtonStyle}
        >
          <FiRefreshCw
            size={14}
            style={{
              animation: loading ? 'spin 1s linear infinite' : 'none',
              color: '#2563eb',
            }}
          />
          Refresh
        </button>
      </div>

      {error && (
        <div style={errorStyle}>
          {error}
        </div>
      )}

      <div style={statsBarStyle}>
        <StatCard
          label="Total Tags"
          value={items.length}
          color="#1e3a8a"
        />

        <StatCard
          label="Active Sensors"
          value={activeSensors}
          color="#2563eb"
        />

        <StatCard
          label="Sync Status"
          value={loading ? 'Loading' : 'Live'}
          color="#3b82f6"
        />
      </div>

      {filtered.length === 0 ? (
        <div style={emptyStateStyle}>
          <FiActivity size={40} color="#3b82f6" style={{ opacity: 0.5 }} />

          <p style={{ margin: 0 }}>
            {loading ? 'Loading sensor values…' : 'No real sensor values found.'}
          </p>

          <p style={{ margin: 0, color: '#94a3b8', fontSize: 13 }}>
            Confirm that sensors, tags, and MQTT values exist in the database.
          </p>
        </div>
      ) : (
        <div style={cardsGridStyle}>
          {filtered.map(item => (
            <SparkCard
              key={`${item.device_id}-${item.tag_id}`}
              item={item}
              timeRange={timeRange}
              onClick={setSelectedItem}
            />
          ))}
        </div>
      )}

      {selectedItem && (
        <SensorDetailModal
          item={selectedItem}
          timeRange={timeRange}
          onClose={() => setSelectedItem(null)}
        />
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={statCardStyle}>
      <div style={{ fontSize: 24, fontWeight: 800, color }}>
        {value}
      </div>

      <div
        style={{
          fontSize: 12,
          color,
          marginTop: 2,
          fontWeight: 800,
          textTransform: 'uppercase',
          opacity: 0.8,
        }}
      >
        {label}
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: '100vh',
  background: '#f8fafc',
  color: '#1e293b',
  padding: '32px 28px',
  fontFamily: 'Inter, sans-serif',
};

const headerStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 12,
  marginBottom: 28,
};

const iconBoxStyle = {
  background: 'linear-gradient(135deg,#3b82f6,#2563eb)',
  borderRadius: 12,
  padding: 10,
  display: 'flex',
};

const h1Style = {
  margin: 0,
  fontSize: 24,
  fontWeight: 800,
  color: '#1e3a8a',
};

const subtitleStyle = {
  margin: 0,
  color: '#3b82f6',
  fontSize: 13,
  fontWeight: 600,
};

const searchStyle = {
  padding: '9px 14px',
  borderRadius: 10,
  border: '1px solid #e2e8f0',
  background: '#fff',
  color: '#1e293b',
  fontSize: 13,
  outline: 'none',
  width: 240,
  boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
};

const rangeButtonStyle = {
  padding: '7px 13px',
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: 13,
  transition: 'all 0.2s',
  boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
};

const refreshButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 14px',
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  background: '#fff',
  color: '#2563eb',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: 13,
  boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
};

const statsBarStyle = {
  display: 'flex',
  gap: 16,
  marginBottom: 28,
  flexWrap: 'wrap',
};

const statCardStyle = {
  flex: '1 1 150px',
  background: '#fff',
  borderRadius: 12,
  padding: '14px 20px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
};

const cardsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: 20,
};

const cardStyle = {
  background: '#fff',
  borderRadius: 16,
  padding: '20px 20px 14px',
  border: '1px solid #e2e8f0',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  transition: 'all 0.2s',
  cursor: 'pointer',
  boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
};

const cardTopRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
};

const deviceLabelStyle = {
  fontSize: 11,
  color: '#64748b',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

const tagTitleStyle = {
  fontSize: 16,
  fontWeight: 800,
  color: '#0f172a',
  marginTop: 2,
};

const tagIdStyle = {
  fontSize: 10,
  color: '#94a3b8',
  marginTop: 3,
};

const valueStyle = {
  fontSize: 32,
  fontWeight: 800,
  color: '#0f172a',
  lineHeight: 1,
};

const unitStyle = {
  fontSize: 12,
  color: '#64748b',
  fontWeight: 600,
};

const sparkEmptyStyle = {
  height: 64,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#cbd5e1',
  fontSize: 12,
};

const footerStyle = {
  fontSize: 10,
  color: '#94a3b8',
  fontWeight: 600,
};

const clickHintStyle = {
  fontSize: 10,
  color: '#2563eb',
  fontWeight: 700,
};

const tooltipContentStyle = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  fontSize: 11,
  color: '#1e293b',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
};

const emptyStateStyle = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  minHeight: 280,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  alignItems: 'center',
  justifyContent: 'center',
  color: '#64748b',
  boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
};

const errorStyle = {
  background: '#fef2f2',
  color: '#b91c1c',
  border: '1px solid #fecaca',
  borderRadius: 10,
  padding: '10px 14px',
  marginBottom: 18,
  fontWeight: 700,
};

const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15, 23, 42, 0.55)',
  zIndex: 9999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
};

const modalStyle = {
  width: 'min(1100px, 96vw)',
  maxHeight: '92vh',
  overflowY: 'auto',
  background: '#fff',
  borderRadius: 20,
  padding: 24,
  boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
};

const modalHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  marginBottom: 20,
};

const modalKickerStyle = {
  fontSize: 11,
  textTransform: 'uppercase',
  color: '#2563eb',
  fontWeight: 800,
  letterSpacing: '0.08em',
};

const modalTitleStyle = {
  margin: '4px 0 0',
  fontSize: 28,
  color: '#0f172a',
};

const modalSubtitleStyle = {
  margin: '4px 0 0',
  color: '#64748b',
  fontWeight: 600,
};

const closeButtonStyle = {
  width: 38,
  height: 38,
  borderRadius: 10,
  border: '1px solid #e2e8f0',
  background: '#fff',
  cursor: 'pointer',
  color: '#0f172a',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const detailGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: 12,
  marginBottom: 18,
};

const detailBoxStyle = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  padding: 14,
};

const detailLabelStyle = {
  fontSize: 11,
  textTransform: 'uppercase',
  color: '#64748b',
  fontWeight: 800,
  marginBottom: 6,
};

const detailValueStyle = {
  fontSize: 24,
  color: '#0f172a',
  fontWeight: 800,
};

const detailSuffixStyle = {
  fontSize: 12,
  color: '#64748b',
  fontWeight: 700,
};

const descriptionBoxStyle = {
  background: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: 14,
  padding: 16,
  marginBottom: 18,
  color: '#1e3a8a',
};

const descriptionGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 12,
  marginTop: 12,
};

const descriptionLabelStyle = {
  fontSize: 11,
  textTransform: 'uppercase',
  color: '#64748b',
  fontWeight: 800,
};

const descriptionValueStyle = {
  fontSize: 13,
  color: '#0f172a',
  fontWeight: 700,
  wordBreak: 'break-word',
};

const largeChartBoxStyle = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 18,
};

const largeChartHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: 12,
};

const largeChartTitleStyle = {
  margin: 0,
  fontSize: 18,
  fontWeight: 800,
  color: '#0f172a',
};

const largeChartSubtitleStyle = {
  margin: '4px 0 0',
  color: '#64748b',
  fontSize: 12,
};

const largeChartEmptyStyle = {
  height: 360,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#94a3b8',
};

const largeTooltipStyle = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 10,
  fontSize: 12,
  color: '#1e293b',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
};