//[assignment] write your own unit test to show that your Mastermind variation circuit is working as expected

const { ethers } = require("hardhat");

const chai = require("chai");
const path = require("path");
const { isTypedArray } = require("util/types");
const { expect } = require("chai");

const wasm_tester = require("circom_tester").wasm;

const F1Field = require("ffjavascript").F1Field;
const Scalar = require("ffjavascript").Scalar;
exports.p = Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617");
const Fr = new F1Field(exports.p);

const assert = chai.assert;

const buildPoseidon = require("circomlibjs").buildPoseidon;

function calculateHB(guess, solution) {
    const hit = solution.filter((sol, i) => {
        return sol === guess[i];
    }).length;

    const blow = solution.filter((sol, i) => {
        return sol !== guess[i] && guess.some((g) => g === sol);
    }).length;

    return [hit, blow];
}

describe("Number Mastermind test", function () {

    it("Circuit test", async () => {
        const circuit = await wasm_tester("contracts/circuits/MastermindVariation.circom");
        await circuit.loadConstraints();

        let poseidonJs = await buildPoseidon();

        const guess = [0, 1, 2, 3, 4, 5];
        const solution = [0, 1, 2, 3, 4, 5];
        const salt = ethers.BigNumber.from(ethers.utils.randomBytes(32));
        const solutionHash = ethers.BigNumber.from(
            poseidonJs.F.toObject(poseidonJs([salt, ...solution]))
        );
        const [hit, blow] = calculateHB(guess, solution);


        const INPUT = {
            "pubGuessA": guess[0],
            "pubGuessB": guess[1],
            "pubGuessC": guess[2],
            "pubGuessD": guess[3],
            "pubGuessE": guess[4],
            "pubGuessF": guess[5],
            "pubNumHit": hit,
            "pubNumBlow": blow,
            "pubSolnHash": solutionHash,
            "privSolnA": solution[0],
            "privSolnB": solution[1],
            "privSolnC": solution[2],
            "privSolnD": solution[3],
            "privSolnE": solution[4],
            "privSolnF": solution[5],
            "privSalt": salt,
        }

        const witness = await circuit.calculateWitness(INPUT, true);

        expect(Fr.e(witness[1])).to.equal(solutionHash);
    });

});