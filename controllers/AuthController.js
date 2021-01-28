import sha1 from 'sha1';
import { v4 as uuid } from 'uuid';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AuthController {
  static async getConnect(request, response) {
    if (!request.header('Authorization')) { response.status(401).json({ error: 'Use Autorization Header' }); }
    // Basic auth(base64), authorization header
    const authhead = request.header('Authorization').slice(6);
    // create a buffer with authhead token
    const buffer = Buffer.from(authhead, 'base64');
    const [email, password] = buffer.toString('utf8').split(':');

    const user = await dbClient.db.collection('users').findOne({ email });

    if (!user) return response.status(401).json({ error: 'Unauthorized' });

    if (sha1(password) !== user.password) {
      return response.status(401).json({ error: 'Unauthorized' });
    }
    const token = uuid();
    const key = `auth_${token}`;
    await redisClient.set(key, user._id.toString(), 86400);

    return response.status(200).send({ token });
  }

  static async getDisconnect(request, response) {
    const token = request.header('X-Token');
    const key = `auth_${token}`;

    const uid = await redisClient.get(key);

    if (!uid) return response.status(401).json({ error: 'Unauthorized' });

    await redisClient.del(key);

    return response.status(204).json({});
  }
}

export default AuthController;
