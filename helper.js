const fs = require('fs');
const path = require('path');

const saveFile = (path, file) => new Promise((resolve, reject) => {
    fs.writeFile(path, file, (error) => {
        if (!error) resolve({})
        else reject(error);
    });
});

const saveDockerFile = (file) => new Promise((resolve, reject) => {
    saveFile(path.join(__dirname, "Dockerfiles", file.originalname), file.buffer)
        .then(() => resolve({ path: path.join(__dirname, "Dockerfiles", file.originalname) }))
        .catch(error => reject({error}));
});

const savePrivateKeys = (files) => new Promise(async (resolve, reject) => {
    let filePaths = []
    
    for (const file of files) {
        const filePath = path.join(__dirname, "Keys", file.originalname);
        await saveFile(filePath, file.buffer);
        filePaths.push(filePath);
    }

    resolve(filePaths);
});

const updateRegistry = (data) => new Promise((resolve, reject) => {
    fs.writeFile(path.join(__dirname, "DB", "registry.json"), data, (error) => {
        if (!error) resolve({});
        else reject({ error });
    });
});

const readRegistry = () => new Promise((resolve, reject => {
    fs.readFile(path.join(__dirname, "DB", "registry.json"), (error, data) => {
        if (!error) resolve(data);
        else reject({ error });
    });
}))

module.exports = {
    saveDockerFile,
    savePrivateKeys,
    updateRegistry,
    readRegistry
}