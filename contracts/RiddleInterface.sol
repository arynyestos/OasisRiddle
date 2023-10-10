// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

interface RiddleInterface {
    function getQuestion(string memory coupon) external view returns (string memory);
    function submitAnswer(string memory coupon, string memory answer) external;
    function claimReward(string memory coupon) external view returns (string memory);
}
