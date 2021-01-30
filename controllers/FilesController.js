import { v4 as uuid } from 'uuid';
import fs from 'fs';
import Bull from 'bull';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const { ObjectId } = require('mongodb');

class FilesController {
  static async postUpload(request, response) {
    const fileQueue = new Bull('fileQueue');

    const token = request.header('X-Token') || null;
    if (!token) return response.status(401).send({ error: 'Unauthorized' });

    // get and validate id user  in set aut_token, in redis
    const idUser = await redisClient.get(`auth_${token}`);
    if (!idUser) return response.status(401).send({ error: 'Unauthorized' });

    // get and validate id user  in collection users, in mongo
    const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(idUser) });
    if (!user) return response.status(401).send({ error: 'Unauthorized' });

    // create a file, data in body, name, type, parentId, isPublic, data

    // name -> filename
    const fileName = request.body.name;
    if (!fileName) return response.status(400).send({ error: 'Missing name' });

    // type: either folder, file or image
    const fileType = request.body.type;
    if (!fileType || !['folder', 'file', 'image'].includes(fileType)) return response.status(400).send({ error: 'Missing type' });

    // data:(only for type=file|image) as Base64 of the file content
    const fileData = request.body.data;
    if (!fileData && ['file', 'image'].includes(fileType)) return response.status(400).send({ error: 'Missing data' });

    // if no file is present in DB for this parentId return an error "Parent not found"
    // whith status code 400 if the file present in DB for this parentId is not of type folder,
    // return an error "Parent is not a folder"  whith status code 400
    const fileIsPublic = request.body.isPublic || false;
    let fileParentId = request.body.parentId || 0;
    fileParentId = fileParentId === '0' ? 0 : fileParentId;
    if (fileParentId !== 0) {
      const parentFile = await dbClient.db.collection('files').findOne({ _id: ObjectId(fileParentId) });
      if (!parentFile) return response.status(400).send({ error: 'Parent not found' });
      if (!['folder'].includes(parentFile.type)) return response.status(400).send({ error: 'Parent is not a folder' });
    }
    const fileDataDb = {
      userId: user._id,
      name: fileName,
      type: fileType,
      isPublic: fileIsPublic,
      parentId: fileParentId,
    };

    if (['folder'].includes(fileType)) {
      await dbClient.db.collection('files').insertOne(fileDataDb);
      return response.status(201).send({
        id: fileDataDb._id,
        userId: fileDataDb.userId,
        name: fileDataDb.name,
        type: fileDataDb.type,
        isPublic: fileDataDb.isPublic,
        parentId: fileDataDb.parentId,
      });
    }

    const pathDir = process.env.FOLDER_PATH || '/tmp/files_manager';
    const fileUuid = uuid();

    const buff = Buffer.from(fileData, 'base64');
    const pathFile = `${pathDir}/${fileUuid}`;

    await fs.mkdir(pathDir, { recursive: true }, (error) => {
      if (error) return response.status(400).send({ error: error.message });
      return true;
    });

    await fs.writeFile(pathFile, buff, (error) => {
      if (error) return response.status(400).send({ error: error.message });
      return true;
    });

    fileDataDb.localPath = pathFile;
    await dbClient.db.collection('files').insertOne(fileDataDb);

    fileQueue.add({
      userId: fileDataDb.userId,
      fileId: fileDataDb._id,
    });

    return response.status(201).send({
      id: fileDataDb._id,
      userId: fileDataDb.userId,
      name: fileDataDb.name,
      type: fileDataDb.type,
      isPublic: fileDataDb.isPublic,
      parentId: fileDataDb.parentId,
    });
  }

  static async getShow(request, response) {
    const { id } = request.params;

    try {
      ObjectId(id);
    } catch (error) {
      return response.status(401).send({ error: 'Unauthorized' });
    }

    const token = request.header('X-Token');

    const user = await redisClient.get(`auth_${token}`);

    if (!user) return response.status(401).send({ error: 'Unauthorized' });

    const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(id) });
    if (!file) return response.status(404).json({ error: 'Not found' });

    return response.status(200).send({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    });
  }

  static async getIndex(request, response) {
    /*
        should retrieve all users file documents for a specific parentId and with pagination:
        retrieve the user based on token:
            if not found, return an error Unauthorized with status 401

        Based in query parameters <parentId> and <page>, return the list of file document
            parentId:
                no validation of partentId needed- if the parentId is not linked to any user forder,
                return and pemtpy list
                by default, partenId is equial to 0 = the root
            pagination:
                eacch page should be 20 items max
                <page> query parameter starts at 0 for the first page. if equals to 1, it means it's
                the second page( corm the 20th tode 40th), etc..
                pagination can be done directly by the aggregate of MongoDB
      */

    // retrieve the user based on token:
    const token = request.header('X-Token');
    const key = `auth_${token}`;
    const uid = await redisClient.get(key);

    if (!uid) return response.status(401).json({ error: 'Unauthorized' });

    // validate user in mongo
    const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(uid) });
    if (!user) return response.status(401).send({ error: 'Unauthorized' });
    const QparentId = request.query.parentId || 0;
    const Qpage = request.query.page;

    // obtener todos los files que tengan un partentId en mongo

    const paginate = await dbClient.aggregateFiles(Number(QparentId), Qpage);

    return response.status(200).send(paginate);
  }
}

export default FilesController;
