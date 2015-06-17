"use strict";

mockUpload = {};
mockUpload.upload = function (someObj) {
        var self = this;
        return {progress: function(progressFunc) {
            self.progressFunc = progressFunc;
            return {
                sucess: function(successFunc){
                    self.successFunc = successFunc;
                }
            }
        }
    }
}

describe("filesController", function() {

    var $scope;
    beforeEach(module("angulardump"));
    beforeEach(iinject(function($controller, $rootScope) {
        $scope = $rootScope.$new();
        $controller("filesController", {
            files: FILES_DATA,
            Upload: mockUpload,
            $scope: $scope
        });
    }));

    it("should test upload success", function(){
        
        $scope.upload(stuffWePassIn);
        
        mockUpload.successFunc(OurExpectedResultFromTheServer);
        //test that when the expected stuff from the server is passed into the success function then the stuff we expect the success function to do happens
        expect(scope.files).toContain("the value passed back from the server");
    })
}
