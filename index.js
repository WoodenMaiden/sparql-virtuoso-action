const core = require('@actions/core');
const { exec } = require('child_process');

try {
    const dba_password = core.getInput('dba_password');
    const dav_password = core.getInput('dav_password');
    const triples = core.getInput('triples');

    exec(`./entrypoint.sh ${dba_password} ${dav_password} ${triples}`, (error, stdout, stderr) => {
        if (error) throw [ error, stdout, stderr ];

        core.setOutput(stdout)
    })

} catch (error) {
    core.setFailed(`error: ${error}\nstdout: ${stdout}\nstderr: ${stderr}`);
}