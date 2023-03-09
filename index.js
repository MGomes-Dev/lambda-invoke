const readline = require("readline/promises");
const fs = require("fs/promises");
const { InvokeCommand, LambdaClient } = require("@aws-sdk/client-lambda");

// ----------
// global variables and instances
// ----------
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const client = new LambdaClient();

const configs = {
    originalProfile: process.env.AWS_PROFILE,
    profile: "default",
    functionName: "",
    inputPath: "./input/input.json",
    outputPath: "./output/output.json"
};

// ----------
// global methods
// ----------
const closeInterface = () => rl.close();

const questionUser = (message) => {
    return rl.question(message);
};

const log = (...messages) => {
    messages.forEach(message => {
        console.log(message);
    });
};

const logWithSeparator = (...messages) => {
    log(...messages);

    console.log("------");
};

// ----------
// get users inputs
// ----------
const getAWSProfile = () => {
    return questionUser(`Select AWS profile: (${configs.profile}) `)
        .then(profile => {
            if (profile) {
                configs.profile = profile;
            }

            logWithSeparator(`Selected profile: ${configs.profile}`);
        });
};

const getFunctionName = () => {
    return questionUser("Select AWS Lambda Function Name: ")
        .then(functionName => {
            if (functionName) {
                configs.functionName = functionName;

                logWithSeparator(`Selected function: ${configs.functionName}`);
            } else {
                log("Please inform a Lambda Function name!");

                return getFunctionName();
            }
        });
};

const getInputPath = () => {
    return questionUser(`Select input path: (${configs.inputPath}) `)
        .then(inputPath => {
            if (inputPath) {
                configs.inputPath = inputPath;
            }

            logWithSeparator(`Selected input path: ${configs.inputPath}`);
        });
};

const getOutputPath = () => {
    return questionUser(`Select output path: (${configs.outputPath}) `)
        .then(outputPath => {
            if (outputPath) {
                configs.outputPath = outputPath;
            }

            logWithSeparator(`Selected output path: ${configs.outputPath}`);
        });
};

// ----------
// get input data
// ----------
const getInputData = () => {
    const { inputPath: path } = configs;

    log("Trying to read input", "...");

    return fs.readFile(path)
        .then(inputBuffer => inputBuffer.toString())
        .then(input => {
            logWithSeparator("Successfully readed input", input);

            return input;
        });
};

// ----------
// invoke lambda function
// ----------
const invokeFunction = (input) => {
    const { profile, functionName } = configs;

    process.env.AWS_PROFILE = profile;

    const command = new InvokeCommand({
        FunctionName: functionName,
        Payload: input
    });

    log("Trying to invoke lambda function", "...");

    return client.send(command)
        .then(output => {
            logWithSeparator("Successfully invoked lambda function", output);

            return output;
        });

};

// ----------
// write output
// ----------
const writeOutput = (output) => {
    const { outputPath } = configs;

    const dataToWrite = JSON.stringify(output, null, 4);

    return fs.writeFile(outputPath, dataToWrite);
}

// ----------
// handle service ending
// ----------
const endService = () => {
    process.env.AWS_PROFILE = configs.originalProfile;

    return closeInterface();
};

// ----------
// handle service call
// ----------
const invokeLambda = () => {
    return getAWSProfile()
        .then(getFunctionName)
        .then(getInputPath)
        .then(getOutputPath)
        .then(getInputData)
        .then(invokeFunction)
        .then(writeOutput)
        .catch(console.error)
        .finally(endService);
};

invokeLambda();
