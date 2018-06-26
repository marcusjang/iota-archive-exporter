IOTA Archive - Exporter Specifications
===
## ToC
* [Table of Contents](#toc)
* [Usage](#usage)
* [Scope](#scope)
* [Input & Output](#input--output)
* [Environment & Dependencies](#environment--dependencies)
* [Technical & Design Decisions](#technical--design-Decisions)
* [References](#references)

## Usage
    git clone https://github.com/marcusjang/iota-archive-exporter.git
    cd iota-archive-exporter
    npm install
    node index [IRI API PORT=14265] [ZMQ TCP PORT=5556]

IRI API port and ZMQ TCP port arguments are optional, and defaults to 14265 and 5556 respectively.

## Scope
1. IOTA Archive Exporter takes the transaction database from old versions of IOTA Reference Implementation(IRI) and streams the data in a more easy-to-read format.
2. IOTA Archive Exporter outputs data in a ZMQ stream compatiblite to the [IRI ZMQ implementation](https://github.com/iotaledger/iri/blob/dev/src/main/java/com/iota/iri/zmq/README.md) for a single importer function.
3. IOTA Archive Exporter does **not** perform tasks below:
    * Verification of the input data, including the ledger,
    * Verification of cryptographic signatures, or
    * Storage of the input data

## Input & Output
### Input Data
* **IRI API exposed from within `localhost`**: IOTA Archive Exporter utilises HTTP API of IRI instances to interact with and traverse through the Tangle, including checking the confirmation state at the time of snapshot.
    * Required API commands:
        * `getNodeInfo` for subtangle solidity check and getting the latest milestone
        * `getTrytes` for getting raw transaction trytes, including trunk and branch transaction hashes for backwards traversal of the Tangle
        * `findTransactions` for getting `approvees` transactions for forwards traversal of the Tangle

### Output Data
* **IRI-like ZMQ Stream**: IOTA Archive Exporter exports the data in a similar fashion as the [IRI ZMQ implementation](https://github.com/iotaledger/iri/blob/dev/src/main/java/com/iota/iri/zmq/README.md), but only a couple of topics are supported.
    * Supported topics:
        * `tx` for (new) transactions and their basic info
        * `tx_trytes` for (new) transaction raw trytes
        * `sn` for milestone issuances and approvees

           > At the time of building the prototype, unlike the IRI the `sn` topic doesn't use the correct milestone, but rather uses the latest milestone prior to the snapshot. 

## Environment & Dependencies

> This section only documents requirements regarding the prototype.

* Node.js v8.11 (or above)
* [ZeroMQ node.js library](https://github.com/zeromq/zeromq.js)
* [iota.lib.js/lib/crypto/converter/converter.js](https://github.com/iotaledger/iota.lib.js/blob/develop/lib/crypto/converter/converter.js)

## Technical & Design Decisions
    To be discussed further

## References
* [iota.lib.js TransactionObject Structure](https://github.com/iotaledger/iota.lib.js/blob/develop/lib/utils/utils.js#L169)
* [IRI ZMQ Publish Provider](https://github.com/iotaledger/iri/blob/master/src/main/java/com/iota/iri/storage/ZmqPublishProvider.java)
* [IOTA ZMQ Snippet by Ralf Rottmann](https://gist.github.com/ralfr/3a411a6449ff942b10b45adaaa8528ba)
