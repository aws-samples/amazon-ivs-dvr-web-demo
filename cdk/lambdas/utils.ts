import { Readable } from 'stream';

import { CloudFrontResultResponse } from 'aws-lambda';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  _Error as S3Error
} from '@aws-sdk/client-s3';
import {
  IvsClient,
  GetStreamCommand,
  ChannelNotBroadcasting,
  StreamState
} from '@aws-sdk/client-ivs';

import { region } from '../config.json';

const s3 = new S3Client({ region });
const ivs = new IvsClient({ region });

const streamToString = async (stream: Readable) => {
  let result = '';

  for await (const chunk of stream) {
    result += chunk;
  }

  return result;
};

interface ResponseOptions {
  body?: string;
  contentType?: string;
  maxAge?: number;
  noCache?: boolean;
}

export const createResponse = (
  status: number,
  options: ResponseOptions = {}
) => {
  const {
    body = '',
    contentType = 'text/plain',
    maxAge = 0,
    noCache = false
  } = options;

  const response: CloudFrontResultResponse = {
    body,
    bodyEncoding: 'text',
    headers: { 'content-type': [{ value: `${contentType}` }] },
    status: status.toString()
  };

  if (noCache) {
    response.headers!['cache-control'] = [{ value: `no-cache` }];
  } else if (maxAge && maxAge >= 0) {
    response.headers!['cache-control'] = [{ value: `max-age=${maxAge}` }];
  }

  return response;
};

export const isS3Error = (error: any): error is S3Error => {
  return error && error.Code && error.Key;
};

export const getS3Object = async (key: string, bucket: string) => {
  const params = { Key: key, Bucket: bucket };
  const command = new GetObjectCommand(params);
  const { Body, LastModified } = await s3.send(command);
  const body = await streamToString(Body as Readable);

  return { body, LastModified };
};

export const putS3Object = async (
  key: string,
  bucket: string,
  body: string
) => {
  const params = {
    Body: body,
    Bucket: bucket,
    Key: key,
    ContentType: 'application/json'
  };
  const command = new PutObjectCommand(params);

  await s3.send(command);
};

export const getActiveStream = async (channelArn: string) => {
  const params = { channelArn };
  const command = new GetStreamCommand(params);

  try {
    const { stream } = await ivs.send(command);
    return stream || null;
  } catch (error) {
    if (error instanceof ChannelNotBroadcasting) {
      return { state: StreamState.StreamOffline };
    } else throw error;
  }
};
