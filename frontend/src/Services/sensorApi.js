import axiosInstance from '../api/axiosConfig';

const BASE = '/sensors';

export const getSensors = () =>
  axiosInstance.get(BASE).then(r => r.data.data);

export const createSensor = payload =>
  axiosInstance.post(BASE, payload).then(r => r.data.data);

export const updateSensor = (deviceId, payload) =>
  axiosInstance.put(`${BASE}/${deviceId}`, payload).then(r => r.data.data);

export const getTags = deviceId =>
  axiosInstance.get(`${BASE}/${deviceId}/tags`).then(r => r.data.data);

export const addTagToSensor = (deviceId, payload) =>
  axiosInstance.post(`${BASE}/${deviceId}/tags`, payload).then(r => r.data.data);

export const updateTag = (deviceId, tagId, payload) =>
  axiosInstance.put(`${BASE}/${deviceId}/tags/${tagId}`, payload).then(r => r.data.data);

export const getTagData = (deviceId, tagId, { from, to, limit = 500 } = {}) => {
  const params = { limit };

  if (from) params.from = from;
  if (to) params.to = to;

  return axiosInstance
    .get(`${BASE}/${deviceId}/tags/${tagId}/data`, { params })
    .then(r => r.data.data);
};

export const getLatestTagValue = (deviceId, tagId) =>
  axiosInstance
    .get(`${BASE}/${deviceId}/tags/${tagId}/latest`)
    .then(r => r.data.data);

export const getAllLatest = () =>
  axiosInstance.get(`${BASE}/all-latest`).then(r => r.data.data);