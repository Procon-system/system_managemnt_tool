import PouchDB from 'pouchdb';

// Create a local PouchDB database
const localDB = new PouchDB('local_datas');
// Export the localDB and remoteDB instances for use in other parts of the app
export { localDB };