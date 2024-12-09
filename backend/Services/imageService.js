const { db } = require('../config/couchdb');

/**
 * Save an image as an attachment in CouchDB.
 * @param {string} docId - Document ID to attach the file to.
 * @param {Buffer} fileBuffer - File data in Buffer format.
 * @param {string} fileName - Name of the file.
 * @param {string} mimeType - MIME type of the file (e.g., image/jpeg).
 */
const saveAttachment = async (docId, fileBuffer, fileName, mimeType) => {
  try {
    // Fetch the document revision (needed to add an attachment)
    const doc = await db.get(docId);

    // Add attachment to the document
    const response = await db.attachment.insert(
      docId,
      fileName,
      fileBuffer,
      mimeType,
      { rev: doc._rev }
    );

    return response;
  } catch (error) {
    throw new Error(`Failed to save attachment: ${error.message}`);
  }
};

module.exports = { saveAttachment };
