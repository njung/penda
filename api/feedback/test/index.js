var server = require(__dirname + "/../../../lib/server");
require("must");

describe("Hello", function() {
  describe("Hello", function() {
    it("should check /api/hello", function(done) {
      server.inject({
        method: "GET",
        url: "/api/hello"
      }, function(response) {
        response.payload.must.equal("Hello");
        done();
      });
    });
  });

});
