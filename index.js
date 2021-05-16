const express = require('express');
const multer = require('multer');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');
const path = require('path');

const Ansible = require('./Ansible/index');
const helpers = require('./helper');

const upload = multer();
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/', (req, res) => {
    res.json({
        msg: "Server running on 3000",
        data: true
    });
});

app.post('/deploy', (req, res) => {
    const imageName = typeof (req.body.imageName) == 'string' && req.body.imageName.trim().length > 0 ? req.body.imageName.trim() : false;
    const hosts = typeof (req.body.hosts) == 'string' && req.body.hosts.trim().length > 0 ? req.body.hosts.trim() : false;
    if (imageName && hosts) {
        Ansible.playbook.runPlaybook(path.join(__dirname, "./Playbooks/deployTemplate.yaml"), ["-e", `{ "host": "${hosts}", "imageName": "${imageName}"}`, "--private-key", path.join(__dirname, "./Keys/ansibleTesting.pem")])
            .then(result => {
                res.json(result);
            })
            .catch(error => {
                res.status(500).json({
                    msg: "Failed to deploy",
                    data: error
                });
            });
    } else {
        res.status(404).json({
            msg: "Invalid or missing parameters"
        });
    }
});

app.post('/addSystems', upload.single('privateKey'), async (req, res) => {
    const userNames = typeof (req.body.userNames) == 'string' ? req.body.userNames.split(',') : false;
    const ipAddresses = typeof (req.body.ipAddresses) == 'string' ? req.body.ipAddresses.split(',') : false;
    const category = typeof (req.body.category) == 'string' && req.body.category.trim().length > 0 ? req.body.category.trim() : false;
    if (userNames && ipAddresses && category && userNames.length == ipAddresses.length && req.file) {
        const keyPaths = await helpers.savePrivateKeys([ req.file ]);
        
        const systems = [];
        
        for (const i in userNames) {
            systems.push({
                connectionString: userNames[i] + ipAddresses[i],
                keyPath: keyPaths[0]
            });
        }

        await helpers.updateRegistry(JSON.stringify({
            category,
            systems
        }, null, 2));
    
        /**
         * @todo Figure out logic to add the systems to the ansible hosts file
         */

        Ansible.AdHoc.ping("AWS", ["-m", "ping", "--private-key", keyPaths[0]])
            .then(result => {
                let unreachableMachines = []
                
                result.outputs.stdout.forEach((output, index) => {
                    if (output.indexOf("UNREACHABLE") > -1) unreachableMachines.push(systems[index]);
                });

                if (result.code != 0) res.status(422).json({
                    msg: "Some of the remtoe machines were unreachable",
                    data: unreachableMachines
                }); 
                else {
                    res.json({
                        msg: "Successfully added new remote machines",
                        data: result
                    });
                }
            })
            .catch(error => {
                res.status(500).json({
                    msg: "Failed to ping the remoted machiles",
                    data: error
                });
            });
    } else {
        res.status(400).json({
            msg: "Invalid or missing parameters."
        });
    }
});

app.listen(3000, () => console.log("Server running on 3000"))