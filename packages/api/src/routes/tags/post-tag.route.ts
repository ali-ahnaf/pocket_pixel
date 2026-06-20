import { Request, Response, Router } from 'express';
import Joi from 'joi';
import { tagsService, utilService } from '../../services';
import { CreateTagInput } from '../../services/tags.service';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });

const createTagSchema = Joi.object<CreateTagInput>({
  name: Joi.string().max(100).required(),
  icon: Joi.string().max(100).optional(),
  backgroundColor: Joi.string().max(50).optional(),
});

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = createTagSchema.validate(req.body);
    if (error) return utilService.replyError(res, error.message);

    const saved = await tagsService.create(req.user!.userId, value as CreateTagInput);
    return utilService.replyCreated(res, saved);
  }),
);

export default router;
