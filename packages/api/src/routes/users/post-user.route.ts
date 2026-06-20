import { Request, Response, Router } from 'express';
import Joi from 'joi';
import { usersService, utilService } from '../../services';
import { CreateUserInput } from '../../services/users.service';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router();
const createUserSchema = Joi.object<CreateUserInput>({
  name: Joi.string().max(100).required(),
  email: Joi.string().email().max(255).required(),
});

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = createUserSchema.validate(req.body);
    if (error) return utilService.replyError(res, error.message);

    const saved = await usersService.create(value as CreateUserInput);
    return utilService.replyCreated(res, saved);
  }),
);

export default router;
