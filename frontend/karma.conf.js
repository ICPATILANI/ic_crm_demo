// Karma configuration file for Angular testing with HTML report generation
// Documentation: https://karma-runner.github.io/latest/config/configuration-file.html

module.exports = function(config) {
  config.set({
    // Base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // Frameworks to use
    // Available frameworks: https://www.npmjs.com/search?q=keywords:karma-adapter
    frameworks: ['jasmine', '@angular-devkit/build-angular'],

    // Plugins to load
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('karma-html-reporter'),
      require('karma-junit-reporter'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],

    // Client configuration
    client: {
      jasmine: {
        // Jasmine configuration options
        random: false,
        seed: null,
        stopSpecOnExpectationFailure: false
      },
      clearContext: false // leave Jasmine Spec Runner output visible in browser
    },

    // Test results reporter to use
    // Possible values: 'dots', 'progress', 'junit', 'html'
    // Available reporters: https://www.npmjs.com/search?q=keywords:karma-reporter
    reporters: ['progress', 'kjhtml', 'coverage', 'html', 'junit'],

    // HTML Reporter configuration
    htmlReporter: {
      outputDir: 'test-reports/html',
      templatePath: null,
      focusOnFailures: true,
      namedFiles: false,
      pageTitle: 'Customer CRM - Frontend Test Report',
      urlFriendlyName: false,
      reportName: 'test-report',
      preserveDescribeNesting: false,
      foldAll: false
    },

    // JUnit Reporter configuration (for CI/CD integration)
    junitReporter: {
      outputDir: 'test-reports/junit',
      outputFile: 'test-results.xml',
      suite: 'Customer CRM Frontend Tests',
      useBrowserName: false,
      nameFormatter: undefined,
      classNameFormatter: undefined,
      properties: {},
      xmlVersion: null
    },

    // Coverage reporter configuration
    coverageReporter: {
      dir: require('path').join(__dirname, './test-reports/coverage'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' },
        { type: 'lcovonly' }
      ]
    },

    // Web server port
    port: 9876,

    // Enable / disable colors in the output (reporters and logs)
    colors: true,

    // Level of logging
    // Possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // Enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // Start these browsers
    // Available browser launchers: https://www.npmjs.com/search?q=keywords:karma-launcher
    browsers: ['Chrome'],

    // Continuous Integration mode
    // If true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level - how many browser instances should be started simultaneously
    concurrency: Infinity,

    // How long will Karma wait for a message from a browser before disconnecting (ms)
    browserNoActivityTimeout: 30000,

    // Custom launchers for headless testing (useful for CI/CD)
    customLaunchers: {
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-gpu']
      }
    }
  });
};
