import { S3Event } from 'aws-lambda';

import { getS3Object, putS3Object, getActiveStream } from './utils';

/**
 * Receives the incoming s3:ObjectCreated:Put event containing the key and VOD bucket details
 * of the latest recording-start.json metadata file. The file is fetched from the bucket and
 * modified to include the full S3 recording prefix in the media/hls path, before being saved
 * at the top level of the same VOD bucket under the filename "recording-started-latest.json"
 *
 * @param event s3:ObjectCreated:Put event notification
 */
const saveRecordingStartMeta = async (event: S3Event) => {
  const {
    object: { key },
    bucket: { name: bucketName }
  } = event.Records[0].s3;
  const s3RecordingKeyPrefix = key.split('/events')[0];

  try {
    const { body } = await getS3Object(key, bucketName);
    const metadata = JSON.parse(body);
    const relativePath = metadata.media.hls.path;
    const absolutePath = `${s3RecordingKeyPrefix}/${relativePath}`;
    metadata.media.hls.path = absolutePath;

    // add the active stream id to the metadata response
    const stream = await getActiveStream(metadata.channel_arn);
    metadata.streamId = stream?.streamId || '';

    // saves the latest recording-start.json metadata file at the top-level of the VOD S3 bucket
    await putS3Object(
      'recording-started-latest.json',
      bucketName,
      JSON.stringify(metadata)
    );
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const handler = saveRecordingStartMeta;
