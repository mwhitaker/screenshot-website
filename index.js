const path = require('path');
const captureWebsite = require('capture-website');
const core = require('@actions/core');
const artifact = require('@actions/artifact');
const loadInputs = require('./lib/load-inputs');



async function run() {
  try {
    let AsyncFunction = Object.getPrototypeOf(async () => null).constructor
    // Get inputs: source, destination, and anything else
    const { source, destination: destFile, prescript, ...inputs } = loadInputs();

    core.debug(`source is ${source}`);
    core.debug(`destination is ${destFile}`);
    core.debug(`prescript is ${prescript}`);
    core.debug(`other inputs are ${JSON.stringify(inputs, null, 4)}`);


    // Get destination
    const destFolder = process.env.RUNNER_TEMP;
    const dest = path.join(destFolder, destFile);

    // Locate Google Chrome executable
    // "google-chrome" on Linux
    // "chrome.exe" on Windows
    // "Google Chrome" on macOSs
    const executables = {
      Linux: '/usr/bin/google-chrome',
      Windows: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      macOS: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    };
    const executablePath = executables[process.env.RUNNER_OS];
    core.debug(`executablePath is ${executablePath}`);

    // Options for capture
    const options = {
      launchOptions: {
        executablePath
      },
      ...inputs
    };

    options.beforeScreenshot = new AsyncFunction('page', 'browser', prescript)
    core.debug(`beforeScreenshot ${JSON.stringify(options.beforeScreenshot, null, 4)}`);


    core.debug(`other options are ${JSON.stringify(options, null, 4)}`);
    // Capture and write to dest
    await captureWebsite.file(source, dest, options);

    // Create an artifact
    const artifactClient = artifact.create();
    const artifactName = destFile.substr(0, destFile.lastIndexOf('.'));
    const uploadResult = await artifactClient.uploadArtifact(artifactName, [dest], destFolder);

    // Expose the path to the screenshot as an output
    core.setOutput('path', dest);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
