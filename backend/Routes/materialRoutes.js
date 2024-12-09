// routes/materialRoutes.js
const express = require('express');
const materialController = require('../Controllers/materialControllers'); // Adjust path as needed
const {
    authenticateUser,
    isServicePersonal,
    isFreeAccess,
  } = require('../Middleware/authMiddleware');
  
const router = express.Router();
router.post('/create-materials',authenticateUser, isFreeAccess, materialController.createMaterial);
router.get('/get-all-materials',authenticateUser,isServicePersonal,materialController.getAllMaterials);
router.get('/get-materials-id/:id', authenticateUser, isServicePersonal,materialController.getMaterialById);
router.put('/update-materials/:id',authenticateUser, isFreeAccess, materialController.updateMaterial);
router.delete('/delete-materials/:id',authenticateUser, isFreeAccess, materialController.deleteMaterial);

module.exports = router;
