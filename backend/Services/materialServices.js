
const Material = require('../Models/MaterialsSchema'); 

const createMaterial = async (materialData) => {
  const material = new Material(materialData);
  return await material.save();
};

const getAllMaterials = async () => {
  return await Material.find();
};

const getMaterialById = async (id) => {
  return await Material.findById(id);
};

const updateMaterial = async (id, updateData) => {
  return await Material.findByIdAndUpdate(id, updateData, { new: true });
};

const deleteMaterial = async (id) => {
  return await Material.findByIdAndDelete(id);
};

module.exports = {
  createMaterial,
  getAllMaterials,
  getMaterialById,
  updateMaterial,
  deleteMaterial,
};
