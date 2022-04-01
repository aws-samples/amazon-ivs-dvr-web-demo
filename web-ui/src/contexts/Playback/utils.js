export class CFDomainError extends Error {
  constructor(message, description = '') {
    super(message);
    this.description = description;
    this.name = 'DistributionError';
  }
}

const getDistributionDomainName = async () => {
  let distributionDomainName = process.env.REACT_APP_DISTRIBUTION_DOMAIN_NAME;

  if (distributionDomainName) return distributionDomainName; // The distribution domain name was manually set in a .env file

  try {
    const STACK_OUTPUT = require('../../cdk_output.json');
    distributionDomainName = STACK_OUTPUT.distributionDomainName;

    if (!distributionDomainName) throw new Error();
  } catch (error) {
    const message = 'No CloudFront distribution domain name was found';
    const description = `
You must bootstrap and deploy the CDK stack, or provide a domain name 
by setting the REACT_APP_DISTRIBUTION_DOMAIN_NAME environment variable,
before running the app.
    `;
    throw new CFDomainError(message, description);
  }

  return distributionDomainName;
};

export const fetchPlaybackMetadata = async (metaKey) => {
  const distributionDomainName = await getDistributionDomainName();
  const distributionDomainURL = `https://${distributionDomainName}`;
  const response = await fetch(`${distributionDomainURL}/${metaKey}`);
  const data = await response.json();

  if (!data) return { isChannelLive: false };

  const {
    isChannelLive,
    livePlaybackUrl,
    masterKey,
    playlistDuration,
    recordingStartedAt
  } = data;
  const recordingStartTime = new Date(recordingStartedAt)?.getTime() || null;
  const vodPlaybackURL = masterKey
    ? `${distributionDomainURL}/${masterKey}`
    : '';

  return {
    isChannelLive,
    livePlaybackUrl,
    playlistDuration,
    recordingStartTime,
    vodPlaybackURL
  };
};
