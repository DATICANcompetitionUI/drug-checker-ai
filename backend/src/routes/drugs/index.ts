import express from 'express'
import { checkSchema } from 'express-validator';
import { validate } from '../../validations/index.js';
import { barcodeLookupController, getDrugDetailsController, knowledgeBaseStatsController, scanMedicationController, searchDrugsController } from '../../controllers/drugs/drugController.js';
import { drugSearchValidation } from '../../validations/drugs/drugValidations.js';

export const drugRouter = express.Router()

drugRouter.get('/search', validate(checkSchema(drugSearchValidation as any)), searchDrugsController)
drugRouter.get('/knowledge-base/stats', knowledgeBaseStatsController)
drugRouter.post('/scan', scanMedicationController)
drugRouter.post('/barcode', barcodeLookupController)
drugRouter.get('/:rxcui', getDrugDetailsController)
