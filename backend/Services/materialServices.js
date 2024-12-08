const { db } = require('../config/couchdb'); // Import CouchDB instance
const MaterialModel = require('../Models/MaterialsSchema'); // Material schema structure

// Create a new material
const createMaterial = async (materialData) => {
  try {
    const newMaterial = {
      ...MaterialModel,
      _id: `material:${Date.now()}`, // Unique ID for the material
      material_name: materialData.material_name,
      amount_available: materialData.amount_available || 0,
      material_description: materialData.material_description || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const response = await db.insert(newMaterial);
    return response;
  } catch (error) {
    throw new Error(`Failed to create material: ${error.message}`);
  }
};

// Get all materials
const getAllMaterials = async () => {
  try {
    const response = await db.find({
      selector: { type: 'material' }, // Fetch only material documents
    });

    return response.docs;
  } catch (error) {
    throw new Error(`Failed to fetch materials: ${error.message}`);
  }
};

// Get a material by ID
const getMaterialById = async (id) => {
  try {
    const material = await db.get(id);
    if (material.type !== 'material') {
      throw new Error('Document is not a material');
    }
    return material;
  } catch (error) {
    throw new Error(`Failed to fetch material: ${error.message}`);
  }
};

// Update a material by ID
const updateMaterial = async (id, updateData) => {
  try {
    const material = await db.get(id);

    if (material.type !== 'material') {
      throw new Error('Document is not a material');
    }

    const updatedMaterial = {
      ...material,
      ...updateData,
      updated_at: new Date().toISOString(),
    };

    const response = await db.insert(updatedMaterial);
    return response;
  } catch (error) {
    throw new Error(`Failed to update material: ${error.message}`);
  }
};

// Delete a material by ID
const deleteMaterial = async (id) => {
  try {
    const material = await db.get(id);

    if (material.type !== 'material') {
      throw new Error('Document is not a material');
    }

    const response = await db.destroy(id, material._rev);
    return response;
  } catch (error) {
    throw new Error(`Failed to delete material: ${error.message}`);
  }
};

module.exports = {
  createMaterial,
  getAllMaterials,
  getMaterialById,
  updateMaterial,
  deleteMaterial,
};
