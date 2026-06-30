import { Router } from 'express';
import postChatRouter from './wizard/post-chat.route';

const router = Router({ mergeParams: true });

router.use(postChatRouter);

export default router;
