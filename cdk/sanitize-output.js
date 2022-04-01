const { readFileSync, writeFileSync } = require('fs');

const inputPath = 'temp_out.json';
const json = readFileSync(inputPath);
const output = JSON.parse(json);

const { distributionDomainName } = output.VODRenditionPlaylistStack;
const publicCdkOutput = { distributionDomainName };

const outputPath = '../web-ui/src/cdk_output.json';
writeFileSync(outputPath, JSON.stringify(publicCdkOutput));
