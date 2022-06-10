const parse = require('csv-parse').parse;

class QueryGeneratorStrategy {
    static REGEX = /(?<protocol>(?:[^:]+)s?)?:\/\/(?:(?<user>[^:\n\r]+):(?<pass>[^@\n\r]+)@)?(?<host>(?:www\.)?(?:[^:\/\n\r]+))(?::(?<port>\d+))?\/?(?<request>[^?#\n\r]+)?\??(?<query>[^#\n\r]*)?\#?(?<anchor>[^\n\r]*)?/m

    constructor() { if (this.constructor === QueryGeneratorStrategy || this.constructor === QueryGeneratorStrategy) throw new Error('This is an abstract class')}
    execute() {throw new Error('This is an abstract class')}
}

///////////////////////////////////////////////////////

class CSVQueryGenerator extends QueryGeneratorStrategy{
    constructor(fileHandler){ 
        super()
        this.fileHandler = fileHandler
    }

    async execute() {
        return new Promise((res, rej) => {
            const buffer = [ 'SPARQL INSERT DATA IN GRAPH <http://localhost/> {' ]
            this.fileHandler.createReadStream()
                .pipe(parse({
                delimiter: ', ',
                encoding: 'utf-8' 
            }))
            .on('data', (data) => {  
                buffer.push(
                    `<${data[0]}> <${data[1]}> ${
                        (data[2].match(QueryGeneratorStrategy.REGEX))? `<${data[2]}>`: `'${data[2]}'`
                    }.`
                )
            })
            .on('error', (error) => {
                rej(error)
            })
            .on('end', () => {
                res(buffer.join('\n') + "}")
            })
        })
    }    
}

class TurtleQueryGenerator extends QueryGeneratorStrategy{
    constructor(fileHandler){ 
        throw new Error('Not yet implemented')
        super()
        this.fileHandler = fileHandler
    }

    async execute() {
        throw new Error('Not yet implemented')
        
        return 'someQuerytoInject'
    }    
}


class RDFXMLQueryGenerator extends QueryGeneratorStrategy{
    constructor(fileHandler){ 
        throw new Error('Not yet implemented')
        super()
        this.fileHandler = fileHandler
    }

    async execute() {
        throw new Error('Not yet implemented')        

        return 'someQuerytoInject'
    }    
}

class JSONLDQueryGenerator extends QueryGeneratorStrategy{
    constructor(fileHandler){ 
        throw new Error('Not yet implemented')
        super()
        this.fileHandler = fileHandler
    }

    async execute() {
        throw new Error('Not yet implemented')
        
        return 'someQuerytoInject'
    }    
}


///////////////////////////////////////////////////////

module.exports = class Fill {
    static fileExtentions = new Map ([
        [".csv", CSVQueryGenerator],
        [".ttl", TurtleQueryGenerator],
        [".rdf", RDFXMLQueryGenerator],
        [".jsonld", JSONLDQueryGenerator]
    ])

    constructor (fileHandler) {
        this.strategy = new CSVQueryGenerator(fileHandler)
    }

    sendData = async (container) => {
        const query = await this.strategy.execute()

        let dba_pwd = await container.inspect()
        dba_pwd = dba_pwd.Config.Env
            .find(variable => variable.match(/^DBA_PASSWORD=.*/i)); //get variable
        dba_pwd = dba_pwd.slice(dba_pwd.indexOf('=') + 1) //get value
               
        const exec = await container.exec({
            Cmd: ["/opt/virtuoso-opensource/bin/isql", `1111`, 'dba', `${dba_pwd}`, `EXEC=${query}`],
            AttachStdout: true,
            AttachStderr: true
        }) // error : 
        
        // OpenLink Virtuoso Interactive SQL (Virtuoso)
        // Version 07.20.3234 as of May 18 2022
        // Type HELP; for help and EXIT; to exit.

        // *** Error S2801: [Virtuoso Driver]CL033: Connect failed to 1111 = 1111.
        // at line 0 of Top-Level:

        const strm = await exec.start({hijack: true})
        
        container.modem.demuxStream(strm, process.stdout, process.stderr)
    }
}