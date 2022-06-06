# WIP: virtuoso-sparql-action

:exclamation: Since this is a WIP, it is not a stable action, use it with caution

## Description

This action allows you to spawn an instance of virtuoso and to import any RDF triples from several files.

The supported filetypes are: 
- CSV
- More to come

## Usage
| Name | Default value | Description | Types | Required |
|------|---------------|-------------|-------|----------|
| ``dba_password`` | ``password`` | Environment variable DBA_PASSWORD | string | :x: | 
| ``dav_password`` | ``password``| Environment variable DAV_PASSWORD | string | :x: |
| ``triples`` | | Files to load triples from | string[] | :x: |
```yaml
jobs:
  somejob:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout 
      uses: actions/checkout@v3

    - name: Create virtuoso instance
      uses: actions/sparql-virtuoso-action@beta1.0.0
      with:
        dba_password: 'password'
        dav_password: 'password'
        triples: 'somefile'
```

## TODO
- [ ] CSV: Find a way to avoid cutting short objects when they have a comma
- [ ] Support Turtle format 
- [x] Complete action metadata file
- [ ] Add workflow commands 
