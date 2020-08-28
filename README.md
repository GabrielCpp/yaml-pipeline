
# yaml-pipeline

Allow to automate redundant tasks require things as http(s) requests, doing sql/mongo queries, clicking on web ui or doing shell commands.

Task can be automated by describing steps in yaml file using a various set of command.

Example:
```
# some-file.yml
- kind: custom-command
  assigns:
  # defined some variables
  - distantSqlDatabaseEnvVarName: SQLDB_1
  - myNetworkSqldatabaseEnvVarName: SQLDB_2
  - hostBaseUrl: https://example.xyz/api/do-something
  - userCredentialEnvVar: USER_CREDENTIAL
  - snapshotBasePath: ./snapchots

# Do an sql query 
- kind: sql-query
  # connection string must be in environement variables 
  envVarName: { $expr: distantSqlDatabaseEnvVarName }
  display: Find a set of valid cards
  queries:
  # Create a function doing ($0) => setVar("cards")(iterableToArray()($0))
  - output: { expr$: '$0 | iterableToArray() | setVar("cards")' } 
    sql: >
      SELECT TOP (100) migration_id
      FROM migrations;

# Perform http(s) request using axios
- kind: http-request   
  display: Authenticate to some site
  # $expr with $ before mean it evaluate expression BEFORE the step is executed, which in this case give a function.
  output: { $expr: setVar("authResult") }
  method: GET 
  # hostBaseUrl is replaced by the content of the variable
  baseUrl: { $expr: hostBaseUrl }
  url: /
  queries:
    # par environement variable value formatted as json and pick a field which will be passed as query string to the request 
    username: { $expr: 'paseJson(getEnvVar(userCredentialEnvVar)) | curryGet("username")' }
    password: { $expr: 'paseJson(getEnvVar(userCredentialEnvVar)) | curryGet("password")' }


# Do something unil a condition become try or until maximum amount of retry is reached
- kind: poll-target
  display: Poll until something happen
  # eval$ enable to create js snipped as () => ($, $helpers) => '$.$0 === "It worked!"'
  # Parameter $ is the bucket of variables in the pipeline
  # Parameter $helpers is a es6 Map containing helpers function (which are avaible directly in $expr and expr$)
  # $.$0 is set when the first function is called
  exitPollCondition: { eval$: '$.$0 === "It worked!"' }
  timeBetweenEachPollInS: 0.5
  maxRetryCount: 10
  targets: 
  # Each child procedure have have separate variable namespace, so to variables must be explicitly passed
  - polledProcedurePath: ./path/to/some/other/yaml/procedure
    params: 
      hostBaseUrl: { $expr: hostBaseUrl }


- kind: shell
  output: { $expr: setVar("cmdResult") }
  command: 'gcloud compute ...'
  cwd: ./command/working/directory/path

- kind: puppeteer-job 
  display: Login to portal and take snaptchots
  steps:
  - commandName: goto
    url: { $expr: hostBaseUrl }
    options: { waitUntil: 'networkidle2' }
    snapshotPath: { $expr: 'joinPath(snapshotBasePath, "01 - open-site.png")' }
  - commandName: set-input
    path: 'input[name="username"]'
    value: { $expr: 'paseJson(getEnvVar(userCredentialEnvVar)) | curryGet("username")' }
  - commandName: set-input
    path: 'input[name="password"]'
    value: { $expr: 'paseJson(getEnvVar(userCredentialEnvVar)) | curryGet("password")' }
  - commandName: click
    path: 'input[name="login"]'
    snapshotPath: { $expr: 'joinPath(snapshotBasePath, "02 - login-with-user.png")' }
    waitForEvents: [ 'load' ]

```yaml