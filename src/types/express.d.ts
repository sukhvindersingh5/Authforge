import { TokenPayload } from '../types';

declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
            requestId?: string;
        }
    }
}

export { };
