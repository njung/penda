var server = require("../../../index");
require("must");

describe("Server", function() {
  describe("cors", function() {
    it("should get the same domain name in the access-control-allow-origin", function(done) {
      server.inject({
        method: 'GET',
        url: '/',
        headers: {
          'Origin': 'en.example.com'
        }}, function(res) {
          res.headers["access-control-allow-origin"].must.equal("en.example.com");
          done();
        });
    });
  });
});

