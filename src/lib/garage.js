const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const config = require('../config');

let client = null;

function getClient() {
  if (!client) {
    client = new S3Client({
      endpoint: config.garage.endpoint,
      region: config.garage.region,
      // Garage (like most self-hosted S3-compatible stores) only supports
      // path-style requests (http://host/bucket/key), not the
      // virtual-hosted-style (http://bucket.host/key) the SDK defaults to.
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.garage.accessKeyId,
        secretAccessKey: config.garage.secretAccessKey,
      },
    });
  }
  return client;
}

async function putObject(key, body, contentType) {
  await getClient().send(
    new PutObjectCommand({ Bucket: config.garage.bucket, Key: key, Body: body, ContentType: contentType })
  );
}

// Returns the raw SDK response; .Body is a Readable stream in the Node.js runtime.
async function getObject(key) {
  return getClient().send(new GetObjectCommand({ Bucket: config.garage.bucket, Key: key }));
}

async function deleteObject(key) {
  await getClient().send(new DeleteObjectCommand({ Bucket: config.garage.bucket, Key: key }));
}

module.exports = { putObject, getObject, deleteObject };
