const child_process = require('child_process');
const commands = require('./commands');

/**
 * 
 * @param {String} host This string will be matched against the hosts in the hosts file
 * @param {Array} parameters Array of parameters to be passed along the ping command
 * @returns Exit code, Stdout and Stderr
 * 
 * @todo Sanity check parameters
 */
const ping = (host, parameters) => new Promise((resolve, reject) => {
    try {
        const child = child_process.spawn(commands.ansible, [host, ...parameters]);

        let outputs = {
            stdout: [],
            stderr: []
        }
        
        child.stdout.on('data', data => outputs.stdout.push(data.toString()));
        child.stderr.on('data', data => outputs.stderr.push(data.toString()));
        
        child.on('close', code => resolve({
            code,
            outputs
        }));   
    } catch (error) {
        reject(error);
    }
});

module.exports = {
    ping
}