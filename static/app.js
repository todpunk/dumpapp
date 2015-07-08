var app = angular.module("angulardump", ["ui.router", "ngCookies", "ngFileUpload"]);


app.config(["$stateProvider", "$urlRouterProvider", function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise("/dump/files");
    $stateProvider
    .state('base', {
        url: "/dump",
        templateUrl: "static/base.html",
        controller: "BaseController",
        resolve: {
            appConfig: ["ConfigService", function(ConfigService) {
                return ConfigService.getConfig()
                .then(function (result) {
                    return result;
                }, function (result) {
                    console.log(result);
                })
            }],
            username: ["$cookies", function($cookies) {
                return $cookies.username;
            }],
            pin: ["$cookies", function($cookies) {
                return $cookies.pin;
            }]
        }
    })
    .state("base.files", {
        url: "/files",
        templateUrl: "static/files.html",
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
}]);

app.service("LoginService", ["$http", function($http) {
    this.login = function (username, pin) {
        return $http({
            method: "POST",
            url: "/login",
            data: {username: username, pin: pin}
        }).then(function (result) {
            return result.data["d"];
        });
    };
}]);

app.service("VoteService", ["$http", function($http) {
    this.sendVote = function (vote) {
        return $http({
            method: "POST",
            url: "/votes",
            data: vote
        }).then(function (result) {
            return result.data["d"];
        });
    };
}]);

app.service("ConfigService", ["$http", function($http) {
    this.getConfig = function () {
        return $http({
            method: "GET",
            url: "/config"
        }).then(function (result) {
            return result.data["d"];
        });
    };
}]);


app.controller("BaseController", ["$scope", "appConfig", "username", "pin", function($scope, appConfig, username, pin) {
    $scope.appConfig = appConfig;
    console.log(username);
    console.log(pin);
    console.log(typeof(pin));
    $scope.username = username ? username : "";
    $scope.pin = pin ? pin : "";
    $scope.loggedin = (username && pin) ? true : false;
    console.log("logged in: " + $scope.loggedin)
}]);

app.controller("FilesController", ["$scope", "files", "Upload", "VoteService", "LoginService", "$cookies", function($scope, files, Upload, VoteService, LoginService, $cookies) {
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
    $scope.vote = function(file){
        VoteService.sendVote({filename: file.name, username: $scope.username, pin: $scope.pin}).then(function(result){
            file.votes = result.votes;
        });
    };
    $scope.login = function() {
        $scope.loggedin = false;
        if ($scope.username === undefined || $scope.username == "" || $scope.pin === undefined || $scope.pin === "") {
            $scope.loggedin = false; return false;
        }
        LoginService.login($scope.username, $scope.pin).then(function(result) {
            if (!(result === true)) {
                $scope.loggedin = false; return false;
            }
            $cookies.username = $scope.username;
            $cookies.pin = $scope.pin;
            $scope.loggedin = true;
        });
    };
    $scope.logout = function() {
        delete $cookies.username;
        delete $cookies.pin;
        $scope.pin = "";
        $scope.loggedin = false;
    };

}]);
