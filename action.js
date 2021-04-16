#!/usr/bin/env node

const fs = require('fs');
const readline = require('readline');

const core = require('@actions/core');
const github = require('@actions/github');

// https://stackoverflow.com/questions/19269545/how-to-get-a-number-of-random-elements-from-an-array/19270021#19270021
function getRandom(arr, n) {
  var result = new Array(n),
    len = arr.length,
    taken = new Array(len);
  if (n > len)
    throw new RangeError("getRandom: more elements taken than available");
  while (n--) {
    var x = Math.floor(Math.random() * len);
    result[n] = arr[x in taken ? taken[x] : x];
    taken[x] = --len in taken ? taken[len] : len;
  }
  return result;
}

(async () => {

// Get images.
let imageRe = /^image::{china-dictatorship-media-base}\/([^/[]+)/;
let images = [];
const fileStream = fs.createReadStream('README.adoc');
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});
for await (const line of rl) {
  let match = imageRe.exec(line);
  if (match !== null) {
    images.push(match[1]);
  }
}
images = getRandom(images, 20);
full_images = []
for (const image of images) {
  full_images.push(`<img src="https://raw.githubusercontent.com/cirosantilli/china-dictatorship-media/master/${image}" width="600">`);
}

// Prepare reply body.
const payload = github.context.payload;
const input = payload.issue.title + '\n\n' + payload.issue.body;
const quoteArray = [];
for (const line of input.split('\n')) {
  // Remove some speical chars to remove at mention spam possibilities.
  quoteArray.push('> ' + line.replace(/[@#]/g, ""));
}
const replyBody = `Hi ${github.context.payload.issue.user.login},

${quoteArray.join('\n')}

${full_images.join('\n\n')}
`;

try {
  console.log(github.context);
  const octokit = new github.getOctokit(process.env.GITHUB_TOKEN);
  const new_comment = octokit.issues.createComment({
    owner: 'cirosantilli',
    repo: payload.repository.name,
    issue_number: payload.issue.number,
    body: replyBody,
  });
} catch (error) {
  core.setFailed(error.message);
}
})()
