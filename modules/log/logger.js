function logger(back) {
    const   m       = back.methods
        ,   o       = back.options
        ,   fs      = require('fs')
        ,   exec    = require('child_process').execFile;

    let logStream,
        date,
        timeout,
        getDate = () => {
            if (!timeout) {
                timeout = true;
                setTimeout(() => {
                    timeout=false;
                }, 1000);

                date = new Date();
                date = date.getFullYear() + '_' + date.getMonth() + '_' + date.getDate();
            }
            return date;
        },
        currentDate = getDate();

    logStream = fs.createWriteStream(process.env.CRAWLER_HOME + 'log/output' + getDate() + '.txt', {
        flags: 'a',
        defaultEncoding: 'utf8',
        autoClose: true
    });

    m.log = (level, ...message) => {
        let logMessage = m.getDate() + ' - ' + level + ' - ' + message.map((item)=>{return (typeof(item) !== 'string') ? JSON.stringify(item) : item;}).join(' ') + '\n';

        if (o.log >= level) console.log(logMessage);

        if (currentDate !== getDate()) {
            currentDate = getDate();
            logStream.end();
            logStream = fs.createWriteStream(process.env.CRAWLER_HOME + 'log/output' + getDate() + '.txt', {
                flags: 'a',
                defaultEncoding: 'utf8',
                autoClose: true
            });

            exec(process.env.CRAWLER_HOME + "scripts/cleanLogs", (error, stdout, stderr) => {
                m.log(3, stdout + error + stderr);
            });
        }

        logStream.write(logMessage);
    };

    logStream.on('error', (err) => {
        console.log(err);
    });
}


module.exports = logger;