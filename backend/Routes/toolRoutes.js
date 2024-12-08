
const express = require('express');
const toolController = require('../Controllers/toolsControllers');
const {
    authenticateUser,
    isRandomUser,
    isServicePersonal,
    isManager,
    isFreeAccess,
    isAdmin,
  } = require('../Middleware/authMiddleware');
  
const router = express.Router();

// router.post('/create-tools', toolController.createTool);
// router.get('/get-all-tools',authenticateUser,isServicePersonal, toolController.getAllTools);
// router.get('/get-tools-id/:id',authenticateUser,isServicePersonal, toolController.getToolById);
// router.put('/update-tools/:id',authenticateUser, isFreeAccess,toolController.updateTool);
// router.delete('/delete-tools/:id',authenticateUser, isFreeAccess,toolController.deleteTool);
router.post('/create-tools', toolController.createTool);
router.get('/get-all-tools', toolController.getAllTools);
router.get('/get-tools-id/:id', toolController.getToolById);
router.put('/update-tools/:id',toolController.updateTool);
router.delete('/delete-tools/:id',toolController.deleteTool);

module.exports = router;
