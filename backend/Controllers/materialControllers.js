// controllers/materialController.js
const materialService = require('../Services/materialServices'); // Adjust path as needed

// Create a new material
const createMaterial = async (req, res) => {
  try {
    const newMaterial = await materialService.createMaterial(req.body);
    res.status(201).json(newMaterial);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create material', details: error.message });
  }
};

// Get all materials
const getAllMaterials = async (req, res) => {
  try {
    const materials = await materialService.getAllMaterials();
    res.status(200).json(materials);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch materials', details: error.message });
  }
};

// Get a material by ID
const getMaterialById = async (req, res) => {
  try {
    const material = await materialService.getMaterialById(req.params.id);
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }
    res.status(200).json(material);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch material', details: error.message });
  }
};

// Update a material by ID
const updateMaterial = async (req, res) => {
  try {
    const updatedMaterial = await materialService.updateMaterial(req.params.id, req.body);
    if (!updatedMaterial) {
      return res.status(404).json({ error: 'Material not found' });
    }
    res.status(200).json(updatedMaterial);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update material', details: error.message });
  }
};

// Delete a material by ID
const deleteMaterial = async (req, res) => {
  try {
    const deletedMaterial = await materialService.deleteMaterial(req.params.id);
    if (!deletedMaterial) {
      return res.status(404).json({ error: 'Material not found' });
    }
    res.status(200).json({ message: 'Material deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete material', details: error.message });
  }
};

module.exports = {
  createMaterial,
  getAllMaterials,
  getMaterialById,
  updateMaterial,
  deleteMaterial,
};
