const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/check-auth');
const optionalAuth = require('../middleware/optional-auth');
const MelodiesController = require('../controllers/melodies');

router.post('/generate', optionalAuth, MelodiesController.generateMelody);
router.post('', checkAuth, MelodiesController.saveMelody);
router.get('', checkAuth, MelodiesController.loadMelodies);
router.get('/modes', checkAuth, MelodiesController.getModes);
router.delete('/:id', checkAuth, MelodiesController.deleteMelody);
router.patch('/:id', checkAuth, MelodiesController.updateMelodyName);
router.get('/midi/:id', checkAuth, MelodiesController.getMidiFile);

module.exports = router;
