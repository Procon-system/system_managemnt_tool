
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

router.post('/create-tools', authenticateUser,isFreeAccess,toolController.createTool);
router.get('/get-all-tools',authenticateUser,isServicePersonal, toolController.getAllTools);
router.get('/get-tools-id/:id',authenticateUser,isServicePersonal, toolController.getToolById);
router.put('/update-tools/:id',authenticateUser, isFreeAccess,toolController.updateTool);
router.delete('/delete-tools/:id',authenticateUser, isFreeAccess,toolController.deleteTool);

module.exports = router;
