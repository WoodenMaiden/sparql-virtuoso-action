class QueryGeneratorStrategy {
    constructor() { if (this.constructor === QueryGeneratorStrategy || this.constructor === QueryGeneratorStrategy) throw new Error('This is an abstract class')}
    execute() {throw new Error('This is an abstract class')}
}

class CSVQueryGenerator extends QueryGeneratorStrategy{
    constructor(fileHandler){ 
        super()
        this.fileHandler = fileHandler
    }

    async execute() {

        //read file handler here
        return 'someQuerytoInject'
    }    
}

module.exports = class Fill {
    constructor (fileHandler) {
        this.strategy = new CSVQueryGenerator(fileHandler)
        
    }

    sendData = async (container) => {
        let query = await this.strategy.execute()

        let dba_pwd = await container.inspect()
        dba_pwd = dba_pwd.Config.Env
            .find(variable => variable.match(/^DBA_PASSWORD=.*/i)); //get variable
        dba_pwd = dba_pwd.slice(dba_pwd.indexOf('=') + 1) //get value
        
        console.log(dba_pwd)
        query += "EXIT\n"
        await container.exec({
            Cmd: ["/opt/virtuoso-opensource/bin/isql", `1111`, 'dba', `${container}`, `EXEC=${query}`]
        })
    }
}