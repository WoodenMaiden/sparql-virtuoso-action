const uuidv4 = require("crypto").randomUUID

const CSVParse = require('csv-parse').parse;
const RDFParser = require('rdf-parse').default

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
            const buffer = [ 'SPARQL INSERT DATA IN GRAPH <http://localhost/data> {' ]
            this.fileHandler.createReadStream()
                .pipe(CSVParse({
                delimiter: ', ',
                encoding: 'utf-8' 
            }))
            .on('data', (data) => {  
                let toPush = `<${data[0]}> <${data[1]}> `
                if (data[2].match(QueryGeneratorStrategy.REGEX)) toPush += `<${data[2]}>`
                else toPush += (data[2].indexOf(`'`) === -1)? `'${data[2]}'`: `"${data[2]}"`
                toPush += '.\n'
                
                buffer.push(toPush)
            })
            .on('error', (error) => {
                rej(error)
            })
            .on('end', () => {
                res(buffer.join('') + "};\n")
            })
        })
    }    
}

class TurtleQueryGenerator extends QueryGeneratorStrategy{
    constructor(fileHandler){ 
        super()
        this.fileHandler = fileHandler
    }

    async execute() {
        return new Promise((res, rej) => {
            let buffer = ""
            RDFParser.parse(this.fileHandler.createReadStream(), { contentType: 'text/turtle'})
            .on('data', (quad) => {if (quad._graph.id) console.log(quad)})
            .on('data', (quad) => buffer += `SPARQL INSERT DATA IN GRAPH <http://localhost/data>{\
<${quad._subject.id}> <${quad._predicate.id}> \
${(quad._object.id.startsWith('"') && quad._object.id.startsWith('"'))? quad._object.id : `<${quad._object.id}>`}.\
};\n`)
            .on('error', (err) => rej(err))
            .on('end', () => res(buffer + "\n"))
        })
    }    
}


class RDFXMLQueryGenerator extends QueryGeneratorStrategy{
    constructor(fileHandler){ 
        super()
        this.fileHandler = fileHandler
    }

    async execute() {
        return new Promise((res, rej) => {
            let buffer = ""
            RDFParser.parse(this.fileHandler.createReadStream(), { contentType: 'application/rdf+xml' })
            .on('data', (quad) => buffer += `SPARQL INSERT DATA IN GRAPH \
<${(quad.graph.termType == 'DefaultGraph')? 'http://localhost/data': quad.graph.value}>{\
<${quad.subject.value}> <${quad.predicate.value}> \
${(quad.object.termType == 'Literal')? quad.object.value : `<${quad.object.value}>`}.\
};\n`)
            .on('error', (err) => rej(err))
            .on('end', () => res(buffer + "\n"))
        })
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
        [".turtle", TurtleQueryGenerator],

        [".rdf", RDFXMLQueryGenerator],
        [".rdfxml", RDFXMLQueryGenerator],
        [".owl", RDFXMLQueryGenerator],
        
        [".jsonld", JSONLDQueryGenerator],
        [".json", JSONLDQueryGenerator]
    ])


    constructor (filePath, fileHandler) {
        const gen = Fill.fileExtentions.get(
            filePath.slice(filePath.lastIndexOf('.'))
        )
        
        if (!gen) throw new Error(`File type not supportted! ${filePath}`)
        
        this.strategy = new gen(fileHandler)
    }

    async sendData (container) {

        const query = await this.strategy.execute()
        const filename = `${uuidv4()}.sql`

        const createfile = await container.exec({
            Cmd: ["tee", filename],
            Detach: false,
            AttachStdout: false,
            AttachStderr: false,
            AttachStdin: true,
        }) 
        const create = await createfile.start({hijack: true, stdin: true})
        container.modem.demuxStream(create, process.stdout, process.stderr)
        create.write(query)


        let dba_pwd = await container.inspect()
        dba_pwd = dba_pwd.Config.Env
            .find(variable => variable.match(/^DBA_PASSWORD=.*/i)); //get variable
        dba_pwd = dba_pwd.slice(dba_pwd.indexOf('=') + 1) //get value
               
        const exec = await container.exec({
            Cmd: ['/bin/bash', '-c', `isql 1111 dba ${dba_pwd} ${filename} && rm ${filename}`],
            AttachStdout: true,
            AttachStderr: true,
            Detach: false,
        })
        const strm = await exec.start({hijack: true})
        
        container.modem.demuxStream(strm, process.stdout, process.stderr)

        create.destroy('')
        strm.destroy('')
    }
}