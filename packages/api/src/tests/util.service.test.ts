import { UtilService } from '../services/util.service';

describe('UtilService', () => {
    let mockRes: any;
    let utilServiceInstance: any;

    beforeEach(() => {
        utilServiceInstance = typeof UtilService === 'function' ? new (UtilService as any)() : UtilService;

        mockRes = {};
        mockRes.status = jest.fn().mockReturnValue(mockRes);
        mockRes.json = jest.fn().mockReturnValue(mockRes);
        mockRes.send = jest.fn().mockReturnValue(mockRes);
    });

    describe('replyNoContent', () => {
        it('should set the correct status code (204) and send no body', () => {
            utilServiceInstance.replyNoContent(mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(204);
            expect(mockRes.send).toHaveBeenCalled();
        });
    });

    describe('replyError', () => {
        it('should use the default status 400 when none is given', () => {
            utilServiceInstance.replyError(mockRes, 'Something went wrong');
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({ message: 'Something went wrong' })
            );
        });

        it('should use a custom status code when one is passed', () => {
            utilServiceInstance.replyError(mockRes, 'Unauthorized access', 401);
            expect(mockRes.status).toHaveBeenCalledWith(401);
        });

        it('should include the message and any extra data in the response body', () => {
            const extraData = { errorDetails: 'Invalid validation token' };
            utilServiceInstance.replyError(mockRes, 'Bad Request', 400, extraData);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Bad Request',
                data: extraData
            });
        });
    });
});