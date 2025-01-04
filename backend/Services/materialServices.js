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
    if (!response || !response.ok) {
      throw new Error('Failed to save created material to the database');
    }

    return newMaterial;
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
const getAllAvailableMaterials = async () => {
  try {
    const response = await db.find({
      selector: {
        type: 'material', // Filter by type
        amount_available: { $gt: 0 }, // Only include materials with amount_available > 0
      },
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
    // Step 1: Fetch the existing material from the database
    const material = await db.get(id);
    
    // Step 2: Check if the document is a material (additional validation)
    if (material.type !== 'material') {
      throw new Error('Document is not a material');
    }

    // Step 3: Merge the original material data with the updated fields
    const updatedMaterial = {
      ...material,
      ...updateData,    // Spread the updated data over the existing material
      updated_at: new Date().toISOString(), // Include the update timestamp
    };

    // Step 4: Try inserting the updated material back into the database
    const response = await db.insert(updatedMaterial);
    
    // If the insertion fails, handle it by throwing an error
    if (!response || !response.ok) {
      throw new Error('Failed to save updated material to the database');
    }

    // Step 5: Return the fully updated material object
    return updatedMaterial; 

  } catch (error) {
    // Step 6: Log the error (you may want to send logs to a monitoring service)
    console.error('Error updating material:', error.message);

    // Throw an error with a clear message for the client
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
  getAllAvailableMaterials,
};
