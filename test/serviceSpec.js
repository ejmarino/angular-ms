
describe('PasswordController', function() {
  beforeEach(module('ngms'));

  var ngmsMessageService;

  beforeEach(inject(function(_ngmsMessageService_){
    // The injector unwraps the underscores (_) from around the parameter names when matching
    ngmsMessageService = _ngmsMessageService_;
  }));

  describe('Message service methods', function() {
    it('getChannel(name) return an instance of Channel "name"', function() {
      var channel = ngmsMessageService.getChannel('testChannel');
      expect(channel.getName()).toEqual('testChannel');
    });
  });
});