const child_process = require('child_process');
const commands = require('./commands');

const runPlaybook = (playbookPath, parameters) => new Promise((resolve, reject) => {
    try {
        const child = child_process.spawn(commands.ansiblePlaybook, [playbookPath, ...parameters]);

        let outputs = {
            stdout: [],
            stderr: []
        }

        child.stdout.on('data' , data=> outputs.stdout.push(data.toString()))
        child.stderr.on('data' , data=> outputs.stderr.push(data.toString()))

        child.on('close', code => resolve({
            code,
            outputs
        }));
    } catch (error) {
        reject(error);
    }
});

module.exports = {
    runPlaybook
}