import { Request, Response, Router } from 'express';
import Joi from 'joi';
import { TestParseScriptInput, TestParseScriptResultDto } from '@expense-tracker/shared';
import { vaultWatchersService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });

const testParseScriptSchema = Joi.object<TestParseScriptInput>({
  script: Joi.string().min(1).max(20000).required(),
  sample: Joi.object({
    from: Joi.string().allow('').max(500).required(),
    subject: Joi.string().allow('').max(2000).required(),
    bodyText: Joi.string().allow('').max(100000).required(),
  }).required(),
});

router.post(
  '/test',
  asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = testParseScriptSchema.validate(req.body);
    if (error) return utilService.replyError(res, error.message);

    const result: TestParseScriptResultDto = vaultWatchersService.testScript(value as TestParseScriptInput);
    return utilService.replyOk(res, result);
  }),
);

export default router;
