import { Request, Response, Router } from 'express';
import Joi from 'joi';
import { TestExtractInput, AiExtractResultDto } from '@expense-tracker/shared';
import { gmailAiExtractorService, tagsService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });

const testExtractSchema = Joi.object<TestExtractInput>({
  sample: Joi.object({
    from: Joi.string().allow('').max(500).required(),
    subject: Joi.string().allow('').max(2000).required(),
    bodyText: Joi.string().allow('').max(100000).required(),
  }).required(),
  guidanceHint: Joi.string().max(2000).allow('').optional(),
});

/** Dry-run: preview what the AI extractor would resolve from a pasted sample email, without saving a watcher. */
router.post(
  '/test',
  asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = testExtractSchema.validate(req.body);
    if (error) return utilService.replyError(res, error.message);

    const input = value as TestExtractInput;
    const tags = (await tagsService.listCached(req.user!.userId)).map((tag) => ({ id: tag.id, name: tag.name }));
    const parsed = await gmailAiExtractorService.extract({ ...input.sample, emailDate: null }, tags, input.guidanceHint);

    const result: AiExtractResultDto = parsed ? { matched: true, title: parsed.title, amount: parsed.amount, type: parsed.type, tagIds: parsed.tagIds } : { matched: false };
    return utilService.replyOk(res, result);
  }),
);

export default router;
