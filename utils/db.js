import { MongoClient } from 'mongodb';
const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || 27017;
const database = process.env.DB_DATABASE || 'files_manager';
const url = `mongodb://${host}:${port}/${database}`;


class DBClient {
	constructor() {
		this.db = null;

		MongoClient.connect(url, { useUnifiedTopology: true }, async(err, client) => {
			if (!err) console.log("Connected successfully to server");
			this.db  = client.db(database);
			//this.client.createCollection('users');
		        //this.client.createCollection('files');
			db.close();
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
}

const dbclient = new DBClient;

export default dbclient;
