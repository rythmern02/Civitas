#!/usr/bin/env bash
set -e

CIRCUIT=payroll.circom
BUILD_DIR=build
if [ -d $BUILD_DIR ]; then rm -rf $BUILD_DIR; fi
mkdir -p $BUILD_DIR

# Compile circuit
# Added -l node_modules so circom can find external libraries
circom $CIRCUIT --r1cs --wasm --sym -o $BUILD_DIR -l node_modules

# Setup snark (Groth16) trusted setup using snarkjs (powers of tau)
cd $BUILD_DIR
if [ ! -f pot12_final.ptau ]; then
  snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
  snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="init" -v
  snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v
fi

snarkjs groth16 setup payroll.r1cs pot12_final.ptau payroll_0000.zkey
snarkjs zkey contribute payroll_0000.zkey payroll_final.zkey --name="contrib" -v
# export verification key
snarkjs zkey export verificationkey payroll_final.zkey verification_key.json

echo "Build complete; artifacts in $(pwd)"