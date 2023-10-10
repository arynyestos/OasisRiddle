# Oasis riddle solution

This project demonstrates hwo to solve from Hardhat the Oasis Riddle found at https://oasisprotocol.org/riddle in four simple steps (for this you'll need a coupon, these are provided by Oasis guys at events):

## First step

Create a .env file in the same directory as your hardhat.config.ts file and paste your private key like this: PRIVATE_KEY=a6c1b6a8d13c51b3c1a6d841b351c..............

## Second step

Create an interface with the methods described in the link above, like the one you can see at contracts/RiddleInterface.sol, and compile with npx hardhat compile

## Third step

Add a task on hardhat.config.ts for each ot the functions you need to interact with.

## Fourth step

Run the following commands:
```bash
npx hardhat getQuestion --network sapphire-testnet 0xFfdb1c4aCe237B10ef5Bd83ec2e6E24D2784225c <coupon code>

npx hardhat submitAnswer --network sapphire-testnet 0xFfdb1c4aCe237B10ef5Bd83ec2e6E24D2784225c <coupon code> <answer>

npx hardhat claimReward --network sapphire-testnet 0xFfdb1c4aCe237B10ef5Bd83ec2e6E24D2784225c <coupon code>
