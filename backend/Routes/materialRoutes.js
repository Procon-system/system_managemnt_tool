// routes/materialRoutes.js
const express = require('express');
const materialController = require('../Controllers/materialControllers'); // Adjust path as needed
const {
    authenticateUser,
    isRandomUser,
    isServicePersonal,
    isManager,
    isFreeAccess,
    isAdmin,
  } = require('../Middleware/authMiddleware');
  
const router = express.Router();

// router.post('/create-materials',authenticateUser, isFreeAccess, materialController.createMaterial);
// router.get('/get-all-materials',authenticateUser,isServicePersonal, materialController.getAllMaterials);
// router.get('/get-materials-id/:id',authenticateUser, isServicePersonal, materialController.getMaterialById);
// router.put('/update-materials/:id',authenticateUser, isFreeAccess, materialController.updateMaterial);
// router.delete('/delete-materials/:id',authenticateUser, isFreeAccess, materialController.deleteMaterial);
router.post('/create-materials', materialController.createMaterial);
router.get('/get-all-materials', materialController.getAllMaterials);
router.get('/get-materials-id/:id', materialController.getMaterialById);
router.put('/update-materials/:id', materialController.updateMaterial);
router.delete('/delete-materials/:id', materialController.deleteMaterial);

module.exports = router;
