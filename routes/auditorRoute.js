import express from 'express';
import { getClientInfo } from '../controllers/auditorController.js';

const router = express.Router();

router.get('/clients', getClientInfo)

export default router;