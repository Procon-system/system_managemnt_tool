
const express = require('express');
const toolController = require('../Controllers/toolsControllers');

const router = express.Router();

router.post('/create-tools', toolController.createTool);
router.get('/get-all-tools', toolController.getAllTools);
router.get('/get-tools-id/:id', toolController.getToolById);
router.put('/update-tools/:id', toolController.updateTool);
router.delete('/delete-tools/:id', toolController.deleteTool);

module.exports = router;
