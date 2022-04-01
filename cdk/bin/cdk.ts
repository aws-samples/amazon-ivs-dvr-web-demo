#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';

import { VODRenditionPlaylistStack } from '../lib/vod-rendition-playlist-stack';
import { region } from '../config.json';

new VODRenditionPlaylistStack(new App(), 'VODRenditionPlaylistStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region // Note: Lambda@Edge is currently only supported in the us-east-1 region
  }
});
