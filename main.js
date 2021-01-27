import redisClient from './utils/redis.js';

// instance redis client
const client = redisClient;
(async()=>{
    //console.log(client._client.connected); 
    //return a Promise, wait to connected   
    console.log(await client.isAlive());
    //console.log(client._client.connected);
    console.log(await redisClient.get('myKey'));
    await redisClient.set('myKey', 12, 5);
    console.log(await redisClient.get('myKey'));
    setTimeout(async () => {
        console.log(await redisClient.get('myKey'));
    }, 1000*10);
    await redisClient.set('todel', 'delme',30);
    console.log(await redisClient.get('todel'));
    await redisClient.del('todel');
    console.log(await redisClient.get('todel'));
})();
