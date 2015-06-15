/// <reference path="../typings/jasmine/jasmine.d.ts" />
/// <reference path="../typings/angularjs/angular-mocks.d.ts" />
/// <reference path="../src/interfaces.ts" />

describe('Angular Message Service', () => {

  var ngmsMessageService: ngms.IMessageService;
  var $timeout: ng.ITimeoutService;

  beforeEach(module('ngms'));

  beforeEach(inject((_$timeout_: ng.ITimeoutService) => {
    $timeout = _$timeout_;
  }));

  beforeEach(inject((_ngmsMessageService_: ngms.IMessageService) => {
    ngmsMessageService = _ngmsMessageService_;
  }));

  describe('Single Channel Tests', () => {

    var channel: ngms.IChannel;

    beforeEach(() => {
      channel = ngmsMessageService.getChannel('testChannel');
    });

    afterEach(() => { channel.unsubscribeAll(); });

    it('Subcribe, publish and unsubscribe a single channel', () => {
      var cnt: number = 0;
      var tkn = channel.subscribe((msg: ngms.IMessage, channel: string) => {
        cnt++;
        expect(channel).toEqual('testChannel');
        expect(msg).toBeDefined();
        expect(msg.$msgId).toBeDefined();
        expect(msg['data']).toEqual('1029384756');
      });
      expect(tkn).toBeDefined();
      expect(tkn.channelName).toEqual('testChannel');
      channel.publish({ data: '1029384756' });
      $timeout.flush();
      expect(cnt).toEqual(1);
      channel.unsubscribe(tkn);
      channel.publish();
      expect(cnt).toEqual(1);
    });

    it('Desubscribes automatically after one publish occur', () => {
      var cnt: number = 0;
      var tkn = channel.subscribe((msg: ngms.IMessage, channel: string) => {
        cnt++;
        expect(channel).toEqual('testChannel');
        expect(msg).toBeDefined();
        expect(msg.$msgId).toBeDefined();
        expect(msg['data']).toEqual('1029384756');
      }, true);
      expect(tkn).toBeDefined();
      expect(tkn.channelName).toEqual('testChannel');
      channel.publish({ data: '1029384756' });
      $timeout.flush();
      expect(cnt).toEqual(1);
      channel.publish({ data: '1029384756' });
      $timeout.flush();
      expect(cnt).toEqual(1);
    });

  });

  /*
  describe('Message service methods', () => {
    it('returns a new instance of channel with the specified name', () => {
      var channel: ngms.IChannel = ngmsMessageService.getChannel('testChannel');
      expect(channel.getName()).toEqual('testChannel');
    });
    it('subscribes, publishes and unsubscribes to the allChannel\'s channel', () => {
      var data: any;
      expect(ngmsMessageService.getServiceStats().totalSubscriptions).toEqual(0);
      var token = ngmsMessageService.subscribe('*', (message: ngms.IMessage, channelName: string) => {
        data = {
          messageData: message['data'],
          channel: channelName
        };
      });
      expect(ngmsMessageService.getServiceStats().totalSubscriptions).toEqual(1);
      var chs: string[] = ['test', 'test2', 'test3', 'test4'];
      chs.forEach((ch: string) => {
        var channel = ngmsMessageService.getChannel(ch);
        channel.publishSync('12345');
        expect(data.messageData).toEqual('12345');
        expect(data.channel).toEqual(ch);
      });
      data = undefined;
      ngmsMessageService.unsubscribe(token);
      chs.forEach((ch: string) => {
        var channel = ngmsMessageService.getChannel(ch);
        channel.publishSync('12345');
        expect(data).toBeUndefined();
      });
      expect(ngmsMessageService.getServiceStats().totalSubscriptions).toEqual(0);
    });
  });

  */
});