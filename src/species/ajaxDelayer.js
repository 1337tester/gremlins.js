/**
 * The ajaxDelayer gremlin delay result from ajax request
 *
 *   var ajaxDelayerGremlin = gremlins.species.ajaxDelayer();
 *   horde.gremlin(ajaxDelayerGremlin);
 *
 * The ajaxDelayer gremlin can be customized as follows:
 *
 *   clickerGremlin.logger(loggerObject); // inject a logger
 *   clickerGremlin.delay(randomizerObject); // inject a random delay generator
 *   clickerGremlin.delayAdder() //inject a function to add delay on ajax request, by default it slow down the onreadyStateChange event
 *
 * Example usage:
 *
 *   horde.gremlin(gremlins.species.ajaxDelayer());
 */
define(function(require) {
    "use strict";

    var RandomizerRequiredException = require('../exceptions/randomizerRequired');
    var configurable = require('../utils/configurable');

    return function() {
        var OriginalXMLHttpRequest = window.XMLHttpRequest;
        var started = false;

        var defaultDelayAdder = function (delay, logger) {

            var open = OriginalXMLHttpRequest.prototype.open;

            window.XMLHttpRequest.prototype.open = function (method, url) {
                if (typeof config.logger.log === 'function') {
                    logger.log('delaying ', method, url);
                }

                return open.apply(this, arguments);
            }


            var send = OriginalXMLHttpRequest.prototype.send;

            window.XMLHttpRequest.prototype.send = function () {
                var d = delay();
                if (typeof config.logger.log === 'function') {
                    logger.log('added delay : ', d);
                }
                var rsc = this.onreadystatechange;
                if (rsc) {
                    // "onreadystatechange" exists -> the request is asynchronous. Monkey-patch it
                    this.onreadystatechange = function() {
                        var self = this;
                        if (self.readyState == 4) {

                            return setTimeout(function () {
                                rsc.apply(self, arguments)
                            }, d);
                        }
                        return rsc.apply(this, arguments);
                    };
                } else {
                    // the request is synchronous delay the sending
                    var start = Date.now();
                    for (;;) {
                        var end = Date.now();
                        if (end - start > d) {
                            break;
                        }
                    }
                }
                return send.apply(this, arguments);
            }
        };

        var defaultDelayer = function (randomizer) {
            return randomizer.natural({max : 1000});
        }

        /**
         * @mixin
         */
        var config = {
            delayer:    defaultDelayer,
            delayAdder: defaultDelayAdder,
            logger:     null,
            randomizer: null
        };

        /**
         * @mixes config
         */
        var ajaxDelayerGremlin = function ajaxDelayerGremlin() {
            if (started) {
                return;
            }
            if (!config.randomizer) {
                throw new RandomizerRequiredException();
            }
            started = true;
            var delayer = function () {
                return config.delayer(config.randomizer);
            }

            config.delayAdder(delayer, config.logger);
        }

        ajaxDelayerGremlin.cleanUp = function () {
            window.XMLHttpRequest = OriginalXMLHttpRequest;
            started = false;
        };

        configurable(ajaxDelayerGremlin, config);

        return ajaxDelayerGremlin;
    };
});
