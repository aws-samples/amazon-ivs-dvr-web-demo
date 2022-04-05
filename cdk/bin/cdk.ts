#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';

import { DVRdemoStack } from '../lib/vod-rendition-playlist-stack';
import { region } from '../config.json';

new DVRdemoStack(new App(), 'DVRdemoStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region // Note: Lambda@Edge is currently only supported in the us-east-1 region
  }
});
