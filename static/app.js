var app = angular.module("angulardump", ["ui.router", "ngFileUpload"]);





app.config(function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise("/dump/files");
    $stateProvider
    .state('base', {
        url: "/dump",
        templateUrl: "/static/base.html",
        controller: "BaseController"
    })
    .state("base.files", {
        url: "/files",
        templateUrl: "/static/files.html",
        controller: "FilesController",
        resolve: {
            files: function($http) {
                return $http.get("/files")
                .then(function (result) {
                    return result.data["d"]
                }, function (result) {
                    console.log(result);
                })
            }
        }
    })
});

app.controller("BaseController", ["$scope" , function($scope) {

}]);

app.controller("FilesController", ["$scope", "files", "Upload", function($scope, files, Upload) {
    $scope.files = files;
    $scope.$watch('uploads', function () {
        $scope.upload($scope.uploads);
    });
    $scope.upload = function (uploads) {
        if (uploads && uploads.length) {
            for (var i = 0; i < uploads.length; i++) {
                var upload = uploads[i];
                Upload.upload({
                    url: '/files',
                    // fields: {'username': $scope.username},
                    file: upload
                }).progress(function (evt) {
                    var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                    console.log('progress: ' + progressPercentage + '% ' + evt.config.file.name);
                }).success(function (data, status, headers, config) {
                    $scope.files.push(data["d"]) 
                    console.log('file ' + config.file.name + 'uploaded. Response: ' + data);
                });
            }
        }
    };

}]);
