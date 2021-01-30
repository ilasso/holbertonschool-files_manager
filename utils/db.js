import { MongoClient } from 'mongodb';

const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || 27017;
const database = process.env.DB_DATABASE || 'files_manager';
const url = `mongodb://${host}:${port}/${database}`;

class DBClient {
  constructor() {
    MongoClient.connect(url, { useUnifiedTopology: true }, (err, client) => {
      if (!err) console.log('Connected successfully to server Mongo');
      this.db = client.db(database);
    });
  }

  isAlive() {
    return !!this.db;
  }
  // users collection methods

  async nbUsers() {
    const countUsers = await this.db.collection('users').countDocuments();
    return countUsers;
  }

  async nbFiles() {
    const countFiles = await this.db.collection('files').countDocuments();
    return countFiles;
  }

  async aggregateFiles(parentId, page = 1) {
    const cursor = await this.db.collection('files').aggregate([
      { $match: { parentId: Number(parentId) } },
      { $skip: (page - 1) * 20 },
      { $limit: 20 },
    ]).toArray();
    const files = [];
    cursor.forEach(({
      _id, userId, name, type, isPublic, parentId,
    }) => {
      files.push({
        id: _id, userId, name, type, isPublic, parentId,
      });
    });
    return files;
  }
}

const dbclient = new DBClient();

export default dbclient;
