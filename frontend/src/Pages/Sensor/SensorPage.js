import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  FiActivity,
  FiRefreshCw,
  FiPlusCircle,
  FiLink,
} from 'react-icons/fi';

import {
  getSensors,
  getTags,
} from '../../Services/sensorApi';

import {
  getCustomSensors,
  createCustomSensor,
  getCustomSensorData,
} from '../../Services/customSensorApi';

const TIME_RANGES = [
  { label: '1h', ms: 60 * 60 * 1000 },
  { label: '6h', ms: 6 * 60 * 60 * 1000 },
  { label: '24h', ms: 24 * 60 * 60 * 1000 },
  { label: '7d', ms: 7 * 24 * 60 * 60 * 1000 },
];

const formatTs = ts => {
  const d = new Date(ts);

  return `${d.getHours().toString().padStart(2, '0')}:${d
    .getMinutes()
    .toString()
    .padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
};

const displayDeviceName = sensor =>
  sensor?.device_actual_name ||
  sensor?.device_name ||
  sensor?.device_id ||
  'Unknown device';

const displayTagName = tag =>
  tag?.tag_actual_name ||
  tag?.tag_name ||
  tag?.tag_id ||
  'Unknown tag';

const displayCustomSensorName = sensor =>
  sensor?.custom_name ||
  sensor?.source_tag_actual_name ||
  sensor?.source_tag_name ||
  sensor?._id ||
  'Custom sensor';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div style={tooltipStyle}>
      <p style={{ color: '#64748b', margin: '0 0 4px' }}>
        {new Date(label).toLocaleString()}
      </p>

      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color, fontWeight: 700, margin: 0 }}>
          {p.name}: {Number(p.value).toFixed(3)}
        </p>
      ))}
    </div>
  );
};

export default function SensorPage() {
  const [sourceSensors, setSourceSensors] = useState([]);
  const [sourceTags, setSourceTags] = useState([]);
  const [customSensors, setCustomSensors] = useState([]);
  const [data, setData] = useState([]);

  const [sourceDeviceId, setSourceDeviceId] = useState('');
  const [sourceTagId, setSourceTagId] = useState('');
 const [customForm, setCustomForm] = useState({
    custom_name: '',

    notification_enabled: true,
    notification_min: '',
    notification_max: '',

    task_creation_enabled: false,
    task_low_low: '',
    task_high_high: '',
  });

  const [selectedCustomSensorId, setSelectedCustomSensorId] = useState('');
  const [timeRange, setTimeRange] = useState(TIME_RANGES[1]);

  const [loadingSources, setLoadingSources] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);
  const [loadingCustomSensors, setLoadingCustomSensors] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [refreshAt, setRefreshAt] = useState(Date.now());

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const loadSourceSensors = useCallback(async () => {
    setLoadingSources(true);

    try {
      const rows = await getSensors();
      setSourceSensors(Array.isArray(rows) ? rows : []);
    } catch (err) {
      console.error(err);
      setSourceSensors([]);
      setError('Failed to load existing MQTT sensors.');
    } finally {
      setLoadingSources(false);
    }
  }, []);

  const loadCustomSensors = useCallback(async () => {
    setLoadingCustomSensors(true);

    try {
      const rows = await getCustomSensors();
      setCustomSensors(Array.isArray(rows) ? rows : []);
    } catch (err) {
      console.error(err);
      setCustomSensors([]);
      setError('Failed to load custom sensors.');
    } finally {
      setLoadingCustomSensors(false);
    }
  }, []);

  useEffect(() => {
    loadSourceSensors();
    loadCustomSensors();
  }, [loadSourceSensors, loadCustomSensors]);

  useEffect(() => {
    if (!sourceDeviceId) {
      setSourceTags([]);
      setSourceTagId('');
      return;
    }

    let mounted = true;

    setLoadingTags(true);
    setSourceTags([]);
    setSourceTagId('');

    getTags(sourceDeviceId)
      .then(rows => {
        if (!mounted) return;
        setSourceTags(Array.isArray(rows) ? rows : []);
      })
      .catch(err => {
        console.error(err);
        if (!mounted) return;
        setSourceTags([]);
        setError('Failed to load tags for selected source device.');
      })
      .finally(() => {
        if (mounted) setLoadingTags(false);
      });

    return () => {
      mounted = false;
    };
  }, [sourceDeviceId]);

  const selectedSourceSensor = sourceSensors.find(
    sensor => sensor.device_id === sourceDeviceId
  );

  const selectedSourceTag = sourceTags.find(
    tag => tag.tag_id === sourceTagId
  );

  const selectedCustomSensor = customSensors.find(
    sensor => sensor._id === selectedCustomSensorId
  );

 const submitCustomSensor = async e => {
  e.preventDefault();
  clearMessages();

  if (!sourceDeviceId) {
    setError('Select an existing source device first.');
    return;
  }

  if (!sourceTagId) {
    setError('Select an existing source tag first.');
    return;
  }

  if (!customForm.custom_name.trim()) {
    setError('Enter a custom sensor name.');
    return;
  }

  if (
    customForm.notification_min !== '' &&
    customForm.notification_max !== '' &&
    Number(customForm.notification_min) >= Number(customForm.notification_max)
  ) {
    setError('Notification min must be lower than notification max.');
    return;
  }

  if (customForm.task_creation_enabled) {
    if (
      customForm.task_low_low === '' &&
      customForm.task_high_high === ''
    ) {
      setError('Enter at least Low Low or High High value for task creation.');
      return;
    }

    if (
      customForm.task_low_low !== '' &&
      customForm.task_high_high !== '' &&
      Number(customForm.task_low_low) >= Number(customForm.task_high_high)
    ) {
      setError('Low Low must be lower than High High.');
      return;
    }
  }

  setSaving(true);

  try {
    const created = await createCustomSensor({
      custom_name: customForm.custom_name.trim(),

      source_device_id: sourceDeviceId,
      source_tag_id: sourceTagId,

      notification_enabled: customForm.notification_enabled,
      notification_min: customForm.notification_min,
      notification_max: customForm.notification_max,

      task_creation_enabled: customForm.task_creation_enabled,
      task_low_low: customForm.task_creation_enabled
        ? customForm.task_low_low
        : '',
      task_high_high: customForm.task_creation_enabled
        ? customForm.task_high_high
        : '',

      show_on_dashboard: true,
    });

    setSuccess('Custom sensor created successfully.');

    setCustomForm({
      custom_name: '',

      notification_enabled: true,
      notification_min: '',
      notification_max: '',

      task_creation_enabled: false,
      task_low_low: '',
      task_high_high: '',
    });

    setSourceTagId('');

    await loadCustomSensors();

    if (created?._id) {
      setSelectedCustomSensorId(created._id);
    }
  } catch (err) {
    console.error(err);
    setError(err?.response?.data?.error || 'Failed to create custom sensor.');
  } finally {
    setSaving(false);
  }
};

  const fetchData = useCallback(() => {
    if (!selectedCustomSensorId) {
      setData([]);
      return;
    }

    const now = Date.now();
    const from = now - timeRange.ms;

    setLoadingData(true);
    setError('');

    getCustomSensorData(selectedCustomSensorId, {
      from,
      to: now,
      limit: 2000,
    })
      .then(rows => {
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

        setData(mapped);
      })
      .catch(err => {
        console.error(err);
        setData([]);
        setError('Failed to load custom sensor history.');
      })
      .finally(() => {
        setLoadingData(false);
      });
  }, [selectedCustomSensorId, timeRange, refreshAt]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!selectedCustomSensorId) return undefined;

    const id = setInterval(() => {
      setRefreshAt(Date.now());
    }, 15000);

    return () => clearInterval(id);
  }, [selectedCustomSensorId]);

  const currentUnit =
    selectedCustomSensor?.display_unit ||
    selectedCustomSensor?.unit ||
    '';

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div style={iconBoxStyle}>
          <FiActivity size={24} color="#fff" />
        </div>

        <div>
          <h1 style={h1Style}>Sensor Page</h1>
          <p style={subtitleStyle}>
            Create custom sensors from existing MQTT data and monitor their real history.
          </p>
        </div>
      </div>

      {(error || success) && (
        <div
          style={{
            ...messageStyle,
            background: error ? '#fef2f2' : '#ecfdf5',
            color: error ? '#b91c1c' : '#047857',
            borderColor: error ? '#fecaca' : '#a7f3d0',
          }}
        >
          {error || success}
        </div>
      )}

<div style={cardStyle}>
  <div style={sectionHeaderStyle}>
    <FiPlusCircle size={18} color="#2563eb" />
    <h2 style={sectionTitleStyle}>Create Custom Sensor</h2>
  </div>

  <form onSubmit={submitCustomSensor}>
    <div style={createGridStyle}>
      <div>
        <label style={labelStyle}>Existing Source Device</label>
        <select
          style={inputFullStyle}
          value={sourceDeviceId}
          onChange={e => setSourceDeviceId(e.target.value)}
          disabled={loadingSources}
        >
          <option value="">
            {loadingSources ? 'Loading devices…' : 'Select existing device'}
          </option>

          {sourceSensors.map(sensor => (
            <option key={sensor.device_id} value={sensor.device_id}>
              {displayDeviceName(sensor)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={labelStyle}>Existing Source Tag</label>
        <select
          style={{
            ...inputFullStyle,
            opacity: !sourceDeviceId || loadingTags ? 0.6 : 1,
          }}
          value={sourceTagId}
          onChange={e => setSourceTagId(e.target.value)}
          disabled={!sourceDeviceId || loadingTags}
        >
          <option value="">
            {loadingTags ? 'Loading tags…' : 'Select existing tag'}
          </option>

          {sourceTags.map(tag => (
            <option key={tag.tag_id} value={tag.tag_id}>
              {displayTagName(tag)}
              {tag.unit ? ` (${tag.unit})` : ''}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={labelStyle}>Custom Sensor Name</label>
        <input
          style={inputFullStyle}
          placeholder="Main Boiler Temperature"
          value={customForm.custom_name}
          onChange={e =>
            setCustomForm(prev => ({
              ...prev,
              custom_name: e.target.value,
            }))
          }
        />
      </div>
    </div>

    <div style={thresholdGridStyle}>
      <div style={thresholdBoxStyle}>
        <h3 style={smallTitleStyle}>Notification Threshold</h3>

        <label style={checkboxStyle}>
          <input
            type="checkbox"
            checked={customForm.notification_enabled}
            onChange={e =>
              setCustomForm(prev => ({
                ...prev,
                notification_enabled: e.target.checked,
              }))
            }
          />
          Enable notification
        </label>

        <div style={twoColumnStyle}>
          <div>
            <label style={labelStyle}>Min</label>
            <input
              type="number"
              style={inputFullStyle}
              placeholder="e.g. 10"
              value={customForm.notification_min}
              onChange={e =>
                setCustomForm(prev => ({
                  ...prev,
                  notification_min: e.target.value,
                }))
              }
              disabled={!customForm.notification_enabled}
            />
          </div>

          <div>
            <label style={labelStyle}>Max</label>
            <input
              type="number"
              style={inputFullStyle}
              placeholder="e.g. 80"
              value={customForm.notification_max}
              onChange={e =>
                setCustomForm(prev => ({
                  ...prev,
                  notification_max: e.target.value,
                }))
              }
              disabled={!customForm.notification_enabled}
            />
          </div>
        </div>
      </div>

      <div style={thresholdBoxStyle}>
        <h3 style={smallTitleStyle}>Task Creation Threshold</h3>

        <label style={checkboxStyle}>
          <input
            type="checkbox"
            checked={customForm.task_creation_enabled}
            onChange={e =>
              setCustomForm(prev => ({
                ...prev,
                task_creation_enabled: e.target.checked,
                task_low_low: e.target.checked ? prev.task_low_low : '',
                task_high_high: e.target.checked ? prev.task_high_high : '',
              }))
            }
          />
          Create task when value reaches critical level
        </label>

        {customForm.task_creation_enabled && (
          <div style={twoColumnStyle}>
            <div>
              <label style={labelStyle}>Low Low</label>
              <input
                type="number"
                style={inputFullStyle}
                placeholder="e.g. 5"
                value={customForm.task_low_low}
                onChange={e =>
                  setCustomForm(prev => ({
                    ...prev,
                    task_low_low: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <label style={labelStyle}>High High</label>
              <input
                type="number"
                style={inputFullStyle}
                placeholder="e.g. 95"
                value={customForm.task_high_high}
                onChange={e =>
                  setCustomForm(prev => ({
                    ...prev,
                    task_high_high: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>

    <button
      disabled={
        saving ||
        !sourceDeviceId ||
        !sourceTagId ||
        !customForm.custom_name.trim()
      }
      style={{
        ...buttonStyle,
        marginTop: 18,
        opacity:
          saving ||
          !sourceDeviceId ||
          !sourceTagId ||
          !customForm.custom_name.trim()
            ? 0.65
            : 1,
      }}
    >
      {saving ? 'Saving…' : 'Create Custom Sensor'}
    </button>
  </form>

  {selectedSourceSensor && selectedSourceTag && (
    <div style={sourcePreviewStyle}>
      <FiLink size={14} color="#2563eb" />
      <span>
        Mapping custom sensor to:{' '}
        <strong>{displayDeviceName(selectedSourceSensor)}</strong>
        {' / '}
        <strong>{displayTagName(selectedSourceTag)}</strong>
      </span>
    </div>
  )}
</div>

      <div style={monitorCardStyle}>
        <div style={sectionHeaderStyle}>
          <FiActivity size={18} color="#2563eb" />
          <h2 style={sectionTitleStyle}>Monitor Custom Sensor</h2>
        </div>

        <div style={controlsStyle}>
          <div style={{ flex: '1 1 320px' }}>
            <label style={labelStyle}>Custom Sensor</label>
            <select
              value={selectedCustomSensorId}
              onChange={e => setSelectedCustomSensorId(e.target.value)}
              style={selectStyle}
              disabled={loadingCustomSensors}
            >
              <option value="">
                {loadingCustomSensors ? 'Loading custom sensors…' : 'Select custom sensor'}
              </option>

              {customSensors.map(sensor => (
                <option key={sensor._id} value={sensor._id}>
                  {displayCustomSensorName(sensor)}
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: '0 0 auto' }}>
            <label style={labelStyle}>Time Range</label>
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
          </div>

          <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setRefreshAt(Date.now())}
              disabled={loadingData}
              style={refreshButtonStyle}
            >
              <FiRefreshCw
                size={14}
                className={loadingData ? 'spin' : ''}
                style={{ color: '#2563eb' }}
              />
              Refresh
            </button>
          </div>
        </div>

        <div style={chartCardStyle}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={chartTitleStyle}>
              {selectedCustomSensor
                ? displayCustomSensorName(selectedCustomSensor)
                : 'Select a custom sensor to view monitoring data'}
            </h2>

            {selectedCustomSensor && (
              <p style={chartSubTextStyle}>
                Source:{' '}
                {selectedCustomSensor.source_device_actual_name ||
                  selectedCustomSensor.source_device_name ||
                  selectedCustomSensor.source_device_id}
                {' / '}
                {selectedCustomSensor.source_tag_actual_name ||
                  selectedCustomSensor.source_tag_name ||
                  selectedCustomSensor.source_tag_id}
                {currentUnit ? ` · Unit: ${currentUnit}` : ''}
              </p>
            )}

            {data.length > 0 && (
              <p style={chartSubTextStyle}>
                {data.length} data points · {timeRange.label} window
              </p>
            )}
          </div>

          {loadingData && <CenteredState text="Loading historical data…" />}

          {!loadingData && selectedCustomSensorId && data.length === 0 && (
            <CenteredState
              icon={<FiActivity size={40} color="#2563eb" style={{ opacity: 0.5 }} />}
              text="No historical data available for this custom sensor yet."
              subText="Confirm the selected source device/tag has values in sensordatas."
            />
          )}

          {!loadingData && !selectedCustomSensorId && (
            <CenteredState
              icon={<FiActivity size={40} color="#3b82f6" style={{ opacity: 0.5 }} />}
              text="Create or select a custom sensor above."
            />
          )}

          {!loadingData && data.length > 0 && (
            <ResponsiveContainer width="100%" height={340}>
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
                  formatter={value => (
                    <span style={{ color: '#64748b', fontSize: 12, fontWeight: 600 }}>
                      {value}
                    </span>
                  )}
                />

                <Line
                  type="monotone"
                  dataKey="value"
                  name={selectedCustomSensor ? displayCustomSensorName(selectedCustomSensor) : 'Value'}
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{
                    r: 6,
                    fill: '#2563eb',
                    stroke: '#fff',
                    strokeWidth: 2,
                  }}
                  isAnimationActive={data.length < 200}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

function CenteredState({ icon, text, subText }) {
  return (
    <div style={centeredStyle}>
      {icon}
      <p style={{ margin: 0 }}>{text}</p>
      {subText && (
        <p style={{ margin: 0, color: '#cbd5e1', fontSize: 12 }}>
          {subText}
        </p>
      )}
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
  alignItems: 'center',
  gap: 12,
  marginBottom: 26,
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
  color: '#2563eb',
  fontSize: 13,
  fontWeight: 600,
};

const messageStyle = {
  border: '1px solid',
  borderRadius: 10,
  padding: '10px 14px',
  marginBottom: 18,
  fontWeight: 700,
};

const cardStyle = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 22,
  boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.08)',
  marginBottom: 24,
};

const monitorCardStyle = {
  ...cardStyle,
  padding: 24,
};

const sectionHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 16,
};

const sectionTitleStyle = {
  margin: 0,
  fontSize: 18,
  color: '#0f172a',
  fontWeight: 800,
};

const createGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 16,
  alignItems: 'end',
};

const labelStyle = {
  display: 'block',
  fontSize: 12,
  color: '#64748b',
  marginTop: 10,
  marginBottom: 6,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const inputFullStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  background: '#fff',
  color: '#0f172a',
  fontSize: 14,
  outline: 'none',
};

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
};

const buttonStyle = {
  width: '100%',
  padding: '10px 16px',
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontWeight: 800,
  cursor: 'pointer',
};

const sourcePreviewStyle = {
  marginTop: 16,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  background: '#eff6ff',
  color: '#1e40af',
  border: '1px solid #bfdbfe',
  borderRadius: 10,
  padding: '10px 12px',
  fontSize: 13,
};

const controlsStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 16,
  marginBottom: 22,
};

const rangeButtonStyle = {
  padding: '8px 14px',
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: 13,
  transition: 'all 0.2s',
};

const refreshButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 16px',
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  background: '#fff',
  color: '#2563eb',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: 13,
};

const chartCardStyle = {
  background: '#fff',
  borderRadius: 16,
  padding: '24px 20px',
  border: '1px solid #e2e8f0',
  minHeight: 420,
};

const chartTitleStyle = {
  margin: 0,
  fontSize: 16,
  fontWeight: 800,
  color: '#0f172a',
};

const chartSubTextStyle = {
  margin: '4px 0 0',
  color: '#64748b',
  fontSize: 12,
};

const centeredStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: 300,
  color: '#94a3b8',
  flexDirection: 'column',
  gap: 12,
};

const tooltipStyle = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 10,
  padding: '10px 14px',
  color: '#1e293b',
  fontSize: 13,
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
};

const thresholdGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 16,
  marginTop: 18,
};

const thresholdBoxStyle = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  padding: 16,
};

const smallTitleStyle = {
  margin: '0 0 12px',
  fontSize: 13,
  fontWeight: 800,
  color: '#475569',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

const twoColumnStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12,
};

const checkboxStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  color: '#334155',
  fontSize: 14,
  fontWeight: 600,
  marginBottom: 10,
};