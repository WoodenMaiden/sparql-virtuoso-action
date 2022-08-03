# WIP: virtuoso-sparql-action

:exclamation: Since this is a WIP, it is not a stable action, use it with caution

## Description

This action allows you to spawn an instance of virtuoso inside a container and import any RDF triples from several files. The created container will continue running after the action so you can run tests on it for instance.

The default graph is ``http://localhost/data``

The supported filetypes are: 
- CSV (stored in the default graph)
- Turtle
- More to come

## Usage
| Name | Default value | Description | Types | Required |
|------|---------------|-------------|-------|----------|
| ``dba-password`` | ``password`` | Environment variable DBA_PASSWORD | string | :x: | 
| ``dav-password`` | ``password``| Environment variable DAV_PASSWORD | string | :x: |
| ``triples`` | ``''``| Files to load triples from, separated by spaces | string | :x: |
| ``publish-db-port`` | ``1111`` | Publish database's port to host | string/integer | :x: |
| ``publish-http-server-port`` | ``8890`` | Publish HTTP server's port to host, and thus the endpoint /sparql | string/integer | :x: |


## An example
```yaml
name: Node.js CI

on:
  push:
    branches: [ master ]
  pull_request:
    branches: [ master ]

jobs:
  setup:
    runs-on: ubuntu-latest

    steps:
    - name: Clone repo 
      uses: actions/checkout@v3

    - name: Create a virtuoso instance
      uses: WoodenMaiden/sparql-virtuoso-action@beta1.0.0
      with:
        dba-password: someReallySecurePassword
        dav-password: someReallySecurePassword
        triples: 
          music.rdf
          metal_bands.ttl
        publish-db-port: 2222
        publish-http-server-port: 9999
        

    - uses: actions/checkout@v3
    - name: Use Node.js 16.x
      uses: actions/setup-node@v3
      with:
        node-version: 16.x
        cache: 'npm'
    - run: npm i
    - run: npm run build --if-present
    - run: npm test
  
...
```

##  Branches

``master``: this is the branch where stabke code and PRs are merged/pushed into (you can test the action by running [act](https://github.com/nektos/act) while being inside repo's directory)

``releases``: this is a branch where the action will be  build and tagged for the marketplace by the CD

## Tags

``releaseX.X.X``: if tagged on master, the CD will build the app push it to the ``release`` branch and tag it as ``vX.X.X``. This v tag will be the one released on the marketplace.