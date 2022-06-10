const fs = require('fs');
const fsp = require('fs/promises');

const core = require('@actions/core');
const Dockerode = require("dockerode");

const Filler = require('./fillData');


(async function bootstrap() {
    "use strict"

    try {
        const dba_password = "password" //core.getInput('dba_password');
        const dav_password = core.getInput('dav_password');
        const triplesInput = "_triples.csv"//core.getInput('triples');
    
        if (!fs.existsSync('./virtuoso.ini')) throw './virtuoso.ini is missing';
    
        const docker = new Dockerode()
        
        try { // let's try to stop the container just in case...
            await docker.getContainer("virtuosoaction").stop()
        } catch (e) {
            console.log("No container")
        }
        
        await docker.pruneImages()
        await docker.pruneContainers()
        
        await docker.buildImage({
            context: __dirname,
            src: ['Dockerfile', 'virtuoso.ini']
          }, {
            t: "database"
        })
        
        const container = await docker.createContainer({
            name: "virtuosoaction", 
            Env: [`DBA_PASSWORD=${dba_password}`, `DAV_PASSWORD=${dba_password}`],
            Image: "database",
            Entrypoint: ['/virtuoso-entrypoint.sh'],
            Cmd: ['start'],
            Tty: false
        })
        await container.start()

        if (triplesInput && triplesInput.length !== 0) {
            const files = triplesInput.split(' ');
            const fillers = []

            for(let i = 0; i< files.length; ++i) {
                try {
                    const fileHandler = await fsp.open(files[i], 'r')
                    fillers.push(new Filler(fileHandler).sendData(container))
                } catch(e) {
                    console.log(e)
                }
            }

            const res = await Promise.all(fillers)
          
        }
        else console.log('No files provided')
    
    } catch (error) {
        core.setFailed(error);
    }

})()