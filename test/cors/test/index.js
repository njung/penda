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

    it.skip("should get * in access-control-allow-origin when no Origin was sent", function(done) {
      server.inject({
        method: 'GET',
        url: '/',
        headers: {
        }}, function(res) {
          console.log(res.headers);
          res.headers["access-control-allow-origin"].must.equal("*");
          done();
        });
    });

  });
});

