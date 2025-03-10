const core = require('@actions/core');
const github = require('@actions/github');

class Config {
  constructor() {
    this.input = {
      mode: core.getInput('mode'),
      githubToken: core.getInput('github-token'),
      ec2ImageId: core.getInput('ec2-image-id'),
      ec2InstanceType: core.getInput('ec2-instance-type'),
      securityGroupId: core.getInput('security-group-id'),
      ec2InstanceId: core.getInput('ec2-instance-id'),
      iamRoleName: core.getInput('iam-role-name'),
      reuseRunner: core.getInput('reuse-runner'),
      runnerCount: core.getInput('runner-count'),
      runnerTarFile: core.getInput('runner-tar-file'),
      sshKeyName: core.getInput('ssh-key-name'),
    };

    this.subnets = [];
    const subnetId = core.getInput('subnet-id');

    try {
      const subnetIds = JSON.parse(subnetId);
      if (typeof subnetIds != 'object') {
        throw new Error('subnet-id must be an Array of subnets or a single subnet');
      }
      Object.values(subnetIds).forEach(subnet => this.subnets.push(subnet));
    }
    catch (e) {
      if (subnetId) {
        this.subnets.push(subnetId);
      }
    }

    const jsonTags = JSON.parse(core.getInput('aws-resource-tags'));
    this.tagSpecifications = [{ Key: 'runner-count', Value: core.getInput('runner-count') }];
    for (const [key, value] of Object.entries(jsonTags)) {
      this.tagSpecifications.push({ Key: key, Value: value });
    }

    // the values of github.context.repo.owner and github.context.repo.repo are taken from
    // the environment variable GITHUB_REPOSITORY specified in "owner/repo" format and
    // provided by the GitHub Action on the runtime
    this.githubContext = {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
    };

    //
    // validate input
    //

    if (!this.input.mode) {
      throw new Error(`The 'mode' input is not specified`);
    }

    if (!this.input.githubToken) {
      throw new Error(`The 'github-token' input is not specified`);
    }

    if (this.input.mode === 'start') {
      if (!this.input.ec2ImageId || !this.input.ec2InstanceType || !this.input.securityGroupId || !this.subnets.length) {
        throw new Error(`Not all the required inputs are provided for the 'start' mode`);
      }
    } else if (this.input.mode === 'stop') {
      if (!this.input.ec2InstanceId) {
        throw new Error(`ec2InstanceId is required for the 'stop' mode`);
      }
    } else {
      throw new Error('Wrong mode. Allowed values: start, stop.');
    }
  }
}

try {
  module.exports = new Config();
} catch (error) {
  core.error(error);
  core.setFailed(error.message);
}
