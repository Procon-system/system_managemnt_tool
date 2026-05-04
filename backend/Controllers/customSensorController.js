const asyncHandler = require('../utils/asyncHandler');

function toNumberOrNull(value) {
    if (value === undefined || value === null || value === '') return null;

    const n = Number(value);
    return Number.isNaN(n) ? null : n;
}

// GET /api/custom-sensors/sources
// For dropdown: list all real MQTT sensors and their tags
const getSourceSensors = asyncHandler(async (req, res) => {
    const Sensor = req.tenantModels.Sensor;

    if (!Sensor) {
        return res.status(503).json({
            success: false,
            error: 'Sensor model not available',
        });
    }

    const sensors = await Sensor.find({})
        .sort({ device_actual_name: 1, device_name: 1 })
        .lean();

    const sources = [];

    for (const sensor of sensors) {
        for (const tag of sensor.tags || []) {
            sources.push({
                device_id: sensor.device_id,
                device_name: sensor.device_name,
                device_actual_name: sensor.device_actual_name,

                tag_id: tag.tag_id,
                tag_name: tag.tag_name,
                tag_actual_name: tag.tag_actual_name,

                sensor_type: tag.sensor_type,
                unit: tag.unit,
                last_value: tag.last_value,
                last_seen_at: tag.last_seen_at,
            });
        }
    }

    res.json({
        success: true,
        data: sources,
    });
});

// POST /api/custom-sensors
const createCustomSensor = asyncHandler(async (req, res) => {
  const CustomSensor = req.tenantModels.CustomSensor;
  const Sensor = req.tenantModels.Sensor;

  if (!CustomSensor || !Sensor) {
    return res.status(503).json({
      success: false,
      error: 'Required sensor models not available',
    });
  }

  const {
    custom_name,
    source_device_id,
    source_tag_id,

    notification_enabled = true,
    notification_min,
    notification_max,

    task_creation_enabled = false,
    task_low_low,
    task_high_high,

    show_on_dashboard = true,
    display_order = 0,
  } = req.body;

  if (!custom_name || !source_device_id || !source_tag_id) {
    return res.status(400).json({
      success: false,
      error: 'custom_name, source_device_id, and source_tag_id are required',
    });
  }

  const sourceSensor = await Sensor.findOne({
    device_id: source_device_id,
    'tags.tag_id': source_tag_id,
  }).lean();

  if (!sourceSensor) {
    return res.status(404).json({
      success: false,
      error: 'Selected source sensor/tag was not found',
    });
  }

  const sourceTag = (sourceSensor.tags || []).find(
    tag => tag.tag_id === source_tag_id
  );

  const nMin = toNumberOrNull(notification_min);
  const nMax = toNumberOrNull(notification_max);
  const lowLow = toNumberOrNull(task_low_low);
  const highHigh = toNumberOrNull(task_high_high);

  if (nMin !== null && nMax !== null && nMin >= nMax) {
    return res.status(400).json({
      success: false,
      error: 'Notification min must be lower than notification max',
    });
  }

  if (task_creation_enabled && lowLow === null && highHigh === null) {
    return res.status(400).json({
      success: false,
      error: 'Enter at least Low Low or High High value for task creation',
    });
  }

  if (lowLow !== null && highHigh !== null && lowLow >= highHigh) {
    return res.status(400).json({
      success: false,
      error: 'Low Low must be lower than High High',
    });
  }

  const customSensor = await CustomSensor.create({
    custom_name: String(custom_name).trim(),

    source_device_id,
    source_device_name: sourceSensor.device_name || source_device_id,
    source_device_actual_name: sourceSensor.device_actual_name || '',

    source_tag_id,
    source_tag_name: sourceTag?.tag_name || source_tag_id,
    source_tag_actual_name: sourceTag?.tag_actual_name || '',

    sensor_type: sourceTag?.sensor_type || '',
    unit: sourceTag?.unit || '',
    display_unit: sourceTag?.unit || '',

    notification_enabled: Boolean(notification_enabled),
    notification_min: nMin,
    notification_max: nMax,

    task_creation_enabled: Boolean(task_creation_enabled),
    task_low_low: task_creation_enabled ? lowLow : null,
    task_high_high: task_creation_enabled ? highHigh : null,

    show_on_dashboard: Boolean(show_on_dashboard),
    display_order: Number(display_order) || 0,
    is_active: true,
  });

  res.status(201).json({
    success: true,
    data: customSensor,
  });
});

// GET /api/custom-sensors
const getCustomSensors = asyncHandler(async (req, res) => {
    const CustomSensor = req.tenantModels.CustomSensor;
    const SensorData = req.tenantModels.SensorData;

    if (!CustomSensor) {
        return res.status(503).json({
            success: false,
            error: 'CustomSensor model not available',
        });
    }

    const customSensors = await CustomSensor.find({ is_active: true })
        .sort({ display_order: 1, custom_name: 1 })
        .lean();

    if (!SensorData) {
        return res.json({
            success: true,
            data: customSensors.map(item => ({ ...item, latest: null })),
        });
    }

    const result = [];

    for (const item of customSensors) {
        const latest = await SensorData.findOne({
            device_id: item.source_device_id,
            tag_id: item.source_tag_id,
        })
            .sort({ timestamp: -1 })
            .lean();

        result.push({
            ...item,
            latest,
        });
    }

    res.json({
        success: true,
        data: result,
    });
});

// GET /api/custom-sensors/:id/data
const getCustomSensorData = asyncHandler(async (req, res) => {
    const CustomSensor = req.tenantModels.CustomSensor;
    const SensorData = req.tenantModels.SensorData;

    if (!CustomSensor || !SensorData) {
        return res.status(503).json({
            success: false,
            error: 'Required models not available',
        });
    }

    const { id } = req.params;
    const { from, to, limit = 500 } = req.query;

    const customSensor = await CustomSensor.findById(id).lean();

    if (!customSensor) {
        return res.status(404).json({
            success: false,
            error: 'Custom sensor not found',
        });
    }

    const filter = {
        device_id: customSensor.source_device_id,
        tag_id: customSensor.source_tag_id,
    };

    if (from || to) {
        filter.timestamp = {};

        if (from) filter.timestamp.$gte = new Date(Number(from));
        if (to) filter.timestamp.$lte = new Date(Number(to));
    }

    const data = await SensorData.find(filter)
        .sort({ timestamp: 1 })
        .limit(Math.min(Number(limit) || 500, 5000))
        .lean();

    res.json({
        success: true,
        data,
    });
});

// GET /api/custom-sensors/:id/latest
const getCustomSensorLatest = asyncHandler(async (req, res) => {
    const CustomSensor = req.tenantModels.CustomSensor;
    const SensorData = req.tenantModels.SensorData;

    if (!CustomSensor || !SensorData) {
        return res.status(503).json({
            success: false,
            error: 'Required models not available',
        });
    }

    const customSensor = await CustomSensor.findById(req.params.id).lean();

    if (!customSensor) {
        return res.status(404).json({
            success: false,
            error: 'Custom sensor not found',
        });
    }

    const latest = await SensorData.findOne({
        device_id: customSensor.source_device_id,
        tag_id: customSensor.source_tag_id,
    })
        .sort({ timestamp: -1 })
        .lean();

    res.json({
        success: true,
        data: latest || null,
    });
});

// PUT /api/custom-sensors/:id
const updateCustomSensor = asyncHandler(async (req, res) => {
  const CustomSensor = req.tenantModels.CustomSensor;

  if (!CustomSensor) {
    return res.status(503).json({
      success: false,
      error: 'CustomSensor model not available',
    });
  }

  const update = {};

  const simpleFields = [
    'custom_name',
    'display_unit',
    'notification_enabled',
    'task_creation_enabled',
    'show_on_dashboard',
    'display_order',
    'is_active',
  ];

  for (const key of simpleFields) {
    if (req.body[key] !== undefined) {
      update[key] = req.body[key];
    }
  }

  if (req.body.notification_min !== undefined) {
    update.notification_min = toNumberOrNull(req.body.notification_min);
  }

  if (req.body.notification_max !== undefined) {
    update.notification_max = toNumberOrNull(req.body.notification_max);
  }

  if (req.body.task_low_low !== undefined) {
    update.task_low_low = toNumberOrNull(req.body.task_low_low);
  }

  if (req.body.task_high_high !== undefined) {
    update.task_high_high = toNumberOrNull(req.body.task_high_high);
  }

  if (update.notification_min !== undefined && update.notification_max !== undefined) {
    if (
      update.notification_min !== null &&
      update.notification_max !== null &&
      update.notification_min >= update.notification_max
    ) {
      return res.status(400).json({
        success: false,
        error: 'Notification min must be lower than notification max',
      });
    }
  }

  if (update.task_low_low !== undefined && update.task_high_high !== undefined) {
    if (
      update.task_low_low !== null &&
      update.task_high_high !== null &&
      update.task_low_low >= update.task_high_high
    ) {
      return res.status(400).json({
        success: false,
        error: 'Low Low must be lower than High High',
      });
    }
  }

  if (update.task_creation_enabled === false) {
    update.task_low_low = null;
    update.task_high_high = null;
  }

  const customSensor = await CustomSensor.findByIdAndUpdate(
    req.params.id,
    { $set: update },
    { new: true }
  );

  if (!customSensor) {
    return res.status(404).json({
      success: false,
      error: 'Custom sensor not found',
    });
  }

  res.json({
    success: true,
    data: customSensor,
  });
});

// DELETE /api/custom-sensors/:id
const deleteCustomSensor = asyncHandler(async (req, res) => {
    const CustomSensor = req.tenantModels.CustomSensor;

    if (!CustomSensor) {
        return res.status(503).json({
            success: false,
            error: 'CustomSensor model not available',
        });
    }

    const customSensor = await CustomSensor.findByIdAndUpdate(
        req.params.id,
        { $set: { is_active: false } },
        { new: true }
    );

    if (!customSensor) {
        return res.status(404).json({
            success: false,
            error: 'Custom sensor not found',
        });
    }

    res.json({
        success: true,
        data: customSensor,
    });
});

module.exports = {
    getSourceSensors,
    createCustomSensor,
    getCustomSensors,
    getCustomSensorData,
    getCustomSensorLatest,
    updateCustomSensor,
    deleteCustomSensor,
};