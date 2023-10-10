import { promises as fs } from 'fs';
import path from 'path';

import {JsonRpcProvider} from "@ethersproject/providers";
import "@nomiclabs/hardhat-ethers"
import '@oasisprotocol/sapphire-hardhat';
import '@typechain/hardhat';
import canonicalize from 'canonicalize';
import 'hardhat-watcher';
import { TASK_COMPILE } from 'hardhat/builtin-tasks/task-names';
import { HardhatUserConfig, task } from 'hardhat/config';
import 'solidity-coverage';

import 'dotenv/config';

const TASK_EXPORT_ABIS = 'export-abis';

task(TASK_COMPILE, async (_args, hre, runSuper) => {
  await runSuper();
  await hre.run(TASK_EXPORT_ABIS);
});

task(TASK_EXPORT_ABIS, async (_args, hre) => {
  const srcDir = path.basename(hre.config.paths.sources);
  const outDir = path.join(hre.config.paths.root, 'abis');

  const [artifactNames] = await Promise.all([
    hre.artifacts.getAllFullyQualifiedNames(),
    fs.mkdir(outDir, { recursive: true }),
  ]);

  await Promise.all(
    artifactNames.map(async (fqn) => {
      const { abi, contractName, sourceName } = await hre.artifacts.readArtifact(fqn);
      if (abi.length === 0 || !sourceName.startsWith(srcDir) || contractName.endsWith('Test'))
        return;
      await fs.writeFile(`${path.join(outDir, contractName)}.json`, `${canonicalize(abi)}\n`);
    }),
  );
});

// Get question.
task('getQuestion')
  .addPositionalParam('address', 'contract address')
  .addPositionalParam('coupon', 'Oasis riddle coupon')
  // .addFlag('unencrypted', 'submit unencrypted transaction') //reverted with reason string "Access forbidden by contract policy" 
                                                               // --unencrypted txs not allowed for this function!
  .setAction(async (args, hre) => {
    await hre.run('compile');

    let riddle = await hre.ethers.getContractAt('RiddleInterface', args.address);
    if (args.unencrypted) {
      const uwProvider = new JsonRpcProvider(hre.network.config.url);
      riddle = await hre.ethers.getContractAt('RiddleInterface', args.address, new hre.ethers.Wallet(accounts[0], uwProvider));
    }
    const question = await riddle.getQuestion(args.coupon);
    console.log(`Success! Question is: ${question}`);
});

// Submit answer.
task('submitAnswer')
  .addPositionalParam('address', 'contract address')
  .addPositionalParam('coupon', 'Oasis riddle coupon')
  .addPositionalParam('answer', `Answer to the coupon's question`)
  .setAction(async (args, hre) => {
    await hre.run('compile');

    let riddle = await hre.ethers.getContractAt('RiddleInterface', args.address);
    if (args.unencrypted) {
      const uwProvider = new JsonRpcProvider(hre.network.config.url);
      riddle = await hre.ethers.getContractAt('RiddleInterface', args.address, new hre.ethers.Wallet(accounts[0], uwProvider));
    }
    const tx = await riddle.submitAnswer(args.coupon, args.answer);
    const receipt = await tx.wait();
    console.log(`Success! Transaction hash: ${receipt.transactionHash}`);
});

// Claim reward.
task('claimReward')
  .addPositionalParam('address', 'contract address')
  .addPositionalParam('coupon', 'Oasis riddle coupon')
  .setAction(async (args, hre) => {
    await hre.run('compile');

    let riddle = await hre.ethers.getContractAt('RiddleInterface', args.address);
    if (args.unencrypted) {
      const uwProvider = new JsonRpcProvider(hre.network.config.url);
      riddle = await hre.ethers.getContractAt('RiddleInterface', args.address, new hre.ethers.Wallet(accounts[0], uwProvider));
    }
    const privateKey = await riddle.claimReward(args.coupon);
    console.log(`Success! Private key: ${privateKey}`);
});

const accounts = [process.env.PRIVATE_KEY];

const config: HardhatUserConfig = {
  networks: {
    hardhat: { // https://hardhat.org/metamask-issue.html
      chainId: 1337,
    },
    'sapphire': {
      url: 'https://sapphire.oasis.io',
      chainId: 0x5afe,
      accounts,
    },
    'sapphire-testnet': {
      url: 'https://testnet.sapphire.oasis.dev',
      chainId: 0x5aff,
      accounts,
    },
    'sapphire-localnet': { // docker run -it -p8545:8545 -p8546:8546 ghcr.io/oasisprotocol/sapphire-dev -test-mnemonic
      url: 'http://localhost:8545',
      chainId: 0x5afd,
      accounts,
    },
  },
  solidity: {
    version: '0.8.16',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  watcher: {
    compile: {
      tasks: ['compile'],
      files: ['./contracts/'],
    },
    test: {
      tasks: ['test'],
      files: ['./contracts/', './test'],
    },
    coverage: {
      tasks: ['coverage'],
      files: ['./contracts/', './test'],
    },
  },
  mocha: {
    require: ['ts-node/register/files'],
    timeout: 50_000,
  },
};

export default config;
