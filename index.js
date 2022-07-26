const fsp = require('fs/promises');

const core = require('@actions/core');
const Dockerode = require("dockerode");

const Filler = require('./fillData');


// watches the container stdout and wait for the ready string to be printed
function waitForVirtuosoInit(stream) {
    return new Promise((resolve, reject) => {
        stream.on('error', (data) => reject(data.toString()))
        stream.on('data', (data) => {
            console.log(data.toString())
            if (data.toString().includes('Server online at 1111')) {
                resolve();
            }
        }) 
        stream.on('end', () => { //just in case
            console.log("Ended!")          
            resolve();
        })
    });
  }

async function bootstrap() {
    "use strict"

    try {
        const dba_password = core.getInput('dba_password');
        const dav_password = core.getInput('dav_password');
        const triplesInput = core.getInput('triples');
        
        const docker = new Dockerode()
        
        await docker.pruneImages()
        await docker.pruneContainers()
        
        const container = await docker.createContainer({
            Env: [`DBA_PASSWORD=${dba_password}`, `DAV_PASSWORD=${dav_password}`],
            Image: "openlink/virtuoso-opensource-7",
            Tty: false,
            AttachStdout: true,
            Detach: true,
            OpenStdin: true,
            Cmd: ['start'],
            HostConfig: {
                PortBindings: {
                    "8890/tcp": [{
                        HostPort: "8890"
                    }],
                    "1111/tcp": [{
                        HostPort: "1111"
                    }]
                }
            }
        })
        await container.start()

        const stream = await container.attach({stream: true, stdout: true, stderr: true})
        await waitForVirtuosoInit(stream)
        stream.destroy('') //streams prevent program from stopping so we destroy them
        

        if (triplesInput && triplesInput.length !== 0) {
            const files = triplesInput.split(' ');
            const fillers = []

            for(let i = 0; i < files.length; ++i) {
                try {
                    const fileHandler = await fsp.open(files[i], 'r')
                    fillers.push(new Filler(fileHandler).sendData(container))
                } catch(e) {
                    console.log(e)
                }
            }
            console.log("Waiting for fillers to finish")
            const res = await Promise.all(fillers)
            console.log("finished everything!!!");
            return;
          
        }
        else console.log('No files provided')
    
    } catch (error) {
        core.setFailed(error);
    }

}

bootstrap()