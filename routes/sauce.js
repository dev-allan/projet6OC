const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const sauceCtrl = require('../controllers/sauce');
const multer = require('../middleware/multer-config');

router.get('/', sauceCtrl.getAllSauces);
router.get('/:id',auth, sauceCtrl.getOneSauce);
router.post('/',auth,multer, sauceCtrl.createSauce);
router.put('/:id',auth,multer, sauceCtrl.modifySauce);
router.post('/:id/like', auth, sauceCtrl.likeSauce);
router.delete('/:id', auth, sauceCtrl.deleteSauce);



module.exports = router;