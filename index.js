const fs = require('fs');

const core = require('@actions/core');
const Dockerode = require("dockerode");


async function bootstrap() {
    try {
        console.log("start")
        const dba_password = core.getInput('dba_password');
        const dav_password = core.getInput('dav_password');
        const triples = core.getInput('triples');
    
        if (!fs.existsSync('./virtuoso.ini')) throw './virtuoso.ini is missing';
    
        const docker = new Dockerode()
        await docker.pruneImages()
        await docker.pruneContainers()
        console.log("pruned")

        await docker.buildImage({
            context: __dirname,
            src: ['Dockerfile', 'virtuoso.ini']
          }, {
            t: "database"
        })
        console.log("built")
        const container = await docker.createContainer({
            name: "virtuoso", 
            Env: [`DBA_PASSWORD=${dba_password}`, `DAV_PASSWORD=${dba_password}`],
            Image: "database",
            Cmd: ['/opt/virtuoso-opensource/bin/virtuoso-t', '-f', '+checkpoint-only', '+pwdold', 'dba', '+pwddba', dba_password ],
            Tty: false
        })
        const commit = await container.commit()
        console.log(commit)
        console.log(typeof commit)

    
    
    } catch (error) {
        core.setFailed(error);
    }
}
bootstrap()
