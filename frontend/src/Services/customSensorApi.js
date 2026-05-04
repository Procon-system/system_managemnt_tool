import axiosInstance from '../api/axiosConfig';

const BASE = '/custom-sensors';

export const getSourceSensors = () =>
  axiosInstance.get(`${BASE}/sources`).then(r => r.data.data);

export const createCustomSensor = payload =>
  axiosInstance.post(BASE, payload).then(r => r.data.data);

export const getCustomSensors = () =>
  axiosInstance.get(BASE).then(r => r.data.data);

export const updateCustomSensor = (id, payload) =>
  axiosInstance.put(`${BASE}/${id}`, payload).then(r => r.data.data);

export const deleteCustomSensor = id =>
  axiosInstance.delete(`${BASE}/${id}`).then(r => r.data.data);

export const getCustomSensorData = (id, { from, to, limit = 500 } = {}) => {
  const params = { limit };

  if (from) params.from = from;
  if (to) params.to = to;

  return axiosInstance
    .get(`${BASE}/${id}/data`, { params })
    .then(r => r.data.data);
};

export const getCustomSensorLatest = id =>
  axiosInstance.get(`${BASE}/${id}/latest`).then(r => r.data.data);