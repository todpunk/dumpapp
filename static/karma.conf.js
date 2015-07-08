module.exports = function(config){
  config.set({

    basePath : './',

    reporters: ['progress', 'coverage'],

    autoWatch : true,

    frameworks: ['jasmine'],

    browsers : ['Chrome'],

    plugins : [
            'karma-chrome-launcher',
            'karma-jasmine',
            'karma-coverage'
            ],

    coverageReporter: {
        type: 'html',
        dir: 'coverage'
    },
      
    files : [
      'angular.min.js',
      'angular-mocks.js',
      'angular-ui-router.min.js',
      'angular-cookies.min.js',
      'ng-file-upload.min.js',
      'app.js',
      'tests.js'
    ]
      

  });
};

