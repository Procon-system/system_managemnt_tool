
const express = require('express');
const machineController = require('../Controllers/machineControllers'); // Adjust path as needed
const {
    authenticateUser,
    isServicePersonal,
    isFreeAccess,
  } = require('../Middleware/authMiddleware');
  
const router = express.Router();
router.post('/create-machines',authenticateUser,  isFreeAccess,machineController.createMachine);
router.get('/get-all-machines', authenticateUser,isServicePersonal, machineController.getAllMachines);
router.get('/get-machines-id/:id',authenticateUser, isServicePersonal,machineController.getMachineById);
router.put('/update-machines/:id',  authenticateUser, isFreeAccess,machineController.updateMachine);
router.delete('/delete-machines/:id',authenticateUser,  isFreeAccess,machineController.deleteMachine);

module.exports = router;
