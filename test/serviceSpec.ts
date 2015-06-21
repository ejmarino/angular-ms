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

    it('Subscribe, publish and unsubscribe a single channel', () => {
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
      expect(ngmsMessageService.getServiceStats().totalSubscriptions).toEqual(1);
      channel.publish({ data: '1029384756' });
      $timeout.flush();
      expect(cnt).toEqual(1);
      channel.unsubscribe(tkn);
      expect(ngmsMessageService.getServiceStats().totalSubscriptions).toEqual(0);
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
      expect(ngmsMessageService.getServiceStats().totalSubscriptions).toEqual(1);
      channel.publish({ data: '1029384756' });
      $timeout.flush();
      expect(ngmsMessageService.getServiceStats().totalSubscriptions).toEqual(0);
      expect(cnt).toEqual(1);
      channel.publish({ data: '1029384756' });
      $timeout.flush();
    });

    it('Subs. Pub. Desubs. multiple channels half with oneTime enabled', () => {
      var cnt: { [ch: string]: number } = {};
      var subs = 100;
      var channels = ['test1', 'test2', 'test3', 'test4', 'test5', 'test6'];
      var t: ngms.IToken[] = [];
      var cb: ngms.ICallback = (msg: ngms.IMessage, ch: string): void => {
        cnt[ch] = cnt[ch] || 0;
        cnt[ch]++;
      };

      var i: number;

      // subscribe 100 subcriptions for every channel
      for (i = 0; i < subs; i++) {
        channels.forEach((ch: string) => {
          t.push(ngmsMessageService.subscribe(ch, cb));
        });
      }
      // subscribe 100 subcriptions for every channel with oneTime enabled
      for (i = 0; i < subs; i++) {
        channels.forEach((ch: string) => {
          ngmsMessageService.subscribe(ch, cb, true);
        });
      }

      expect(ngmsMessageService.getServiceStats().totalSubscriptions).toEqual(t.length * 2);

      // Publish and expect count of 200 for every channel
      channels.forEach((ch: string) => {
        ngmsMessageService.publishSync(ch);
      });

      channels.forEach((ch: string) => {
        expect(cnt[ch]).toEqual(subs*2);
      });

      // expect the autodesubscription 100 oneTime subscriptions
      expect(ngmsMessageService.getServiceStats().totalSubscriptions).toEqual(t.length);

      channels.forEach((ch: string) => {
        ngmsMessageService.publishSync(ch);
      });

      // check that only half has called
      channels.forEach((ch: string) => {
        expect(cnt[ch]).toEqual(subs*3);
      });

      // unsubscribe remainings
      t.forEach((token: ngms.IToken) => { ngmsMessageService.unsubscribe(token); });

      expect(ngmsMessageService.getServiceStats().totalSubscriptions).toEqual(0);

      channels.forEach((ch: string) => {
        ngmsMessageService.publishSync(ch);
      });

      channels.forEach((ch: string) => {
        expect(cnt[ch]).toEqual(subs*3);
      });

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