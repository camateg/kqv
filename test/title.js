process.env.ENV_NODE = 'test';

var should = require('should');
var Browser = require('zombie');
var app = require('../app');

describe('main page', function() {
  before(function() {
    this.server = app.listen(3000);
    this.browser = new Browser({ site: 'http://localhost:3000' });
  });

  before(function(done) {
    this.timeout(10000);
    this.browser.visit('/', done);
  });

  it('should have a title', function(done) {
    this.browser.success.should.equal(true);
    this.browser.text('title').should.match(/KQV\ Junk\ for\ \d+\/\d+\/\d+/);
    done();
  });

  it('should have shows', function(done) {
    this.browser.success.should.equal(true);
    this.browser.assert.elements('#accordion > div', { atLeast: 1 });
    done();
  });

  it('should be closed', function(done) {
    this.browser.success.should.equal(true);
    this.browser.assert.hasNoClass('#accordion .collapse', 'in');
    done();
  });

  it('should be able to expand', function(done) {
    this.browser.success.should.equal(true);

    if(this.browser.assert.elements('span.glyphicon', {atLeast: 1})) {
      this.browser.clickLink('span.glyphicon:eq(0)');
      this.browser.assert.hasClass('#accordion .collapse', 'in');
      done();
    };
    done();
  });

  after(function(done) {
    this.server.close(done);
  });
});
