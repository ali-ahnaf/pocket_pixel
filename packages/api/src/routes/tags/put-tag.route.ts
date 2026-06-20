import { Request, Response, Router } from 'express';
import Joi from 'joi';
import { tagsService, utilService } from '../../services';
import { UpdateTagInput } from '../../services/tags.service';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });

const updateTagSchema = Joi.object<UpdateTagInput>({
  name: Joi.string().max(100),
  icon: Joi.string().max(100).allow(null),
  backgroundColor: Joi.string().max(50).allow(null),
}).min(1);

router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = updateTagSchema.validate(req.body);
    if (error) return utilService.replyError(res, error.message);

    const saved = await tagsService.update(req.user!.userId, req.params.id, value as UpdateTagInput);
    return utilService.replyOk(res, saved);
  }),
);

export default router;
