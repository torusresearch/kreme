# Introduction

Project Kreme by Torus Labs is a method of protecting the privacy of Torus
Wallet users. Currently, when a Torus Wallet user submits a JSON Web Token to
the Torus Network, Torus Nodes will check whether the JWT token is valid before
replying with the user's appropriate keyshares. This means that Torus Nodes
can link keyshares to personally identifying email addresses, which is a
potential privacy issue.

The solution is for users to prove to Torus Nodes, in zero knowledge, that

1. Given a publicly known SHA256 hash of a JWT, and a publicly known commitment
   to an email address, the user knows the JWT plaintext;
2. The JWT contains said email address in its payload's `email` field;

The Torus Nodes should not be able to determine the plaintext JWT or the user's
email address.

To prevent bruteforce attacks, the commitment to the email address should be a
salted hash of the email address. The salt should be unique to the user and
should be stored by either Torus or the user.

## System overview

The system consists of the following components:

- **A prover** which generates Groth16 zk-SNARK proofs on behalf of users.
  While it would be ideal if users generate these proofs themselves, the
  computational resources required would make this unwieldy, especially for
  those who use mobile devices. Nevertheless, only the prover controlled by
  Torus — not Torus Nodes — will be able to view the plaintext JWTs.

- **A verifer** which allow any Torus Node to verify a proof.

- **A Javascript library** which allows the Torus web wallet to generate the
  necessary inputs for the proving server, including email address commitments.
