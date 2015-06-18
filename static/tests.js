"use strict";

var mockUpload = {};
mockUpload.upload = function (someObj) {
        var self = this;
        return {progress: function(progressFunc) {
            self.progressFunc = progressFunc;
            return {
                success: function(successFunc){
                    self.successFunc = successFunc;
                }
            }
        }
    }
}

describe("FilesController", function() {

    var $scope;
    var upFiles;
    var data;
    var upConfig;
    var VoteService;
    beforeEach(module("angulardump"));
    beforeEach(inject(function($controller, $rootScope) {
        $scope = $rootScope.$new();
        VoteService = {};
        $controller("FilesController", {
            files: [],
            Upload: mockUpload,
            $scope: $scope,
            VoteService: VoteService
        });
    }));
    beforeEach(function() {
        upFiles = [
        {
            lastModified: 1434038870640,
            lastModifiedDate: "Thu Jun 01 2015 10:07:50 GMT-0600 (MDT)",
            name: "testfile1.txt",
            size: 150 ,
            type: "text",
            webkitRelativePath: ""
        },
        {
            lastModified: 1434038870668,
            lastModifiedDate: "Thu Jun 01 2015 10:07:22 GMT-0600 (MDT)",
            name: "testfile2.txt",
            size: 155 ,
            type: "text",
            webkitRelativePath: ""
        }
        ];
        data = { d: "results from server"};
        upConfig = { file: { name: "testfile1.txt" }};
    });
 
    it("should test upload success", function(){
        $scope.upload(upFiles);

        mockUpload.successFunc(data, "status", "headers", upConfig);
        //test that when the expected stuff from the server is passed into the success function then the stuff we expect the success function to do happens
        expect($scope.files).toContain("results from server");
    });

    it("should take a vote", function(){
        $scope.files = [
            {name: "file1", size: 12, votes: 2},
            {name: "file2", size: 12, votes: 3}
            ];
        VoteService.sendVote = function(){};
        spyOn(VoteService, 'sendVote').andReturn({
            then: function(successFunc){successFunc({"votes": 4});}
        });
        $scope.vote($scope.files[1]);
        
        expect(VoteService.sendVote).toHaveBeenCalledWith({filename: "file2"});
        expect($scope.files[0].votes).toEqual(2);
        expect($scope.files[1].votes).toEqual(4);
    });

});

describe("VoteService", function () {
    
    var service, httpBackend;
    beforeEach(module("angulardump"));
    beforeEach(inject(function(VoteService, $httpBackend){
        service = VoteService;
        httpBackend = $httpBackend;
    }));

    it("should send a vote", function() {
        var file = {
            name: "test1.txt",
            size: 4,
            votes: 4
        };
        httpBackend.expectPOST("/votes", file).respond(200, {d: "thing"});
        service.sendVote(file);
        httpBackend.flush();
    });

    it("should deserialize the return value", function() {
        var deserialized;
        httpBackend.expectPOST("/votes", "blegh").respond(200, {d: "thing"});
        var result = service.sendVote("blegh");
        result.then(function(thing) {
            deserialized = thing;
        });
        httpBackend.flush();
        expect(deserialized).toEqual("thing");
    });    
});

