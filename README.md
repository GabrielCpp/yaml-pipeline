
# Installation & running the tool

1. In folder ServiceBusManagementClient do 

```
yarn install 
yarn build
```

2. In main folder do 

Create an .env file to store connection string. It will be loaded as environement variables when the app start.
The format is  ABC = XYZ

```
yarn install 
yarn build
yarn start stalk --procedureFilePath=./data/procedures/proc.yaml
```

# For dev

Instead of building and running each time you can use the command 

```
yarn build:dev
```

It will rebuild and run each time you save a file in src folder. To lauch your command again you can set an environement variable COMMAND = stalk --procedureFilePath=./examples/download-log-data.yaml inside .env file.

# Détails about the steps in yaml file.

Attributes avaible for each step:
* display: Optional field showing a string when the command is run.
* skip: Optional field used to skip a step when set to true.
* kind: Manadatory identifier specifying the step to run.

Specific step paramteters details can be found inside pipeline-commands/actions/<some action>.ts