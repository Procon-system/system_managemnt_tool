
const express = require('express');
const machineController = require('../Controllers/machineControllers'); // Adjust path as needed

const router = express.Router();

router.post('/create-machines', machineController.createMachine);
router.get('/get-all-machines', machineController.getAllMachines);
router.get('/get-machines-id/:id', machineController.getMachineById);
router.put('/update-machines/:id', machineController.updateMachine);
router.delete('/delete-machines/:id', machineController.deleteMachine);

module.exports = router;
