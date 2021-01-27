/* Inside the folder utils, create a file redis.js that contains the class RedisClient.

RedisClient should have:

the constructor that creates a client to Redis:
any error of the redis client must be displayed in the console
(you should use on('error') of the redis client)
a function isAlive that returns true when the connection to Redis is a success otherwise,
false an asynchronous function get that takes a string key as argument and returns the Redis
value stored for this key an asynchronous function set that takes a string key, a value and
a duration in second as arguments to store it in Redis
(with an expiration set by the duration argument)
an asynchronous function del that takes a string key as argument and remove the value in Redis
for this key
After the class definition, create and export an instance of RedisClient called redisClient.
*/

import redis from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this._client = redis.createClient();
    this.getAsync = promisify(this._client.get).bind(this._client);
    this.setAsync = promisify(this._client.set).bind(this._client);
    this.delAsync = promisify(this._client.del).bind(this._client);
    this._client.on('error', (error) => {
      if (error) console.log(`Redis client not connected to the server: ${error}`);
    });
  } // constructor

  isAlive() {
    /* return new Promise((resolve, reject) => {
      this._client.on('connect', (err) => {
        const blerror = false;
        if (err) reject(blerror);
        resolve(true);
      });
    }); // promise
    */
    return this._client.connected;
  } // isAlive

  async get(key) {
    return this.getAsync(key);
  } // get

  // time in seconds
  async set(key, value, time) {
    await this.setAsync(key, value, 'EX', time);
  } // set

  async del(key) {
    await this.delAsync(key);
  } // del
} // class

const redisClient = new RedisClient();
export default redisClient;
