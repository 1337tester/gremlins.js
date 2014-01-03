define(function(require) {
    "use strict";

    var configurable = require('../utils/configurable');

    return function() {

        var document = window.document;

        var defaultMapElements = {
            'input[type="text"]': fillTextElement,
            'input[type="password"]': fillTextElement,
            'input[type="number"]': fillNumberElement,
            'select': fillSelect,
            'input[type="radio"]': fillRadio,
            'input[type="checkbox"]': fillCheckbox,
            'input[type="email"]': fillEmail,
            'input:not([type])': fillTextElement
        };

        var defaultShowAction = function(element) {
            if(typeof element.attributes['data-old-border'] === 'undefined') {
                element.attributes['data-old-border'] = element.style.border;
            }

            var oldBorder = element.attributes['data-old-border'];
            element.style.border = "1px solid red";

            setTimeout(function() {
                element.style.border = oldBorder;
            }, 500);
        };

        var defaultCanFillElemment = function() { return true; };

        /**
         * @mixin
         */
        var config = {
            elementMapTypes: defaultMapElements,
            showAction:      defaultShowAction,
            canFillElement:  defaultCanFillElemment,
            maxNbTries:      10,
            logger:          {}
        };

        var getRandomElementInArray = function(arr) {
            if (!arr || arr.length === 0) return null;

            return arr[Math.floor((Math.random() * arr.length))];
        };

        /**
         * @mixes config
         */
        function formFillerGremlin() {
            // Retrieve all selectors
            var elementTypes = [],
                matchFunction = getMatchFunctionName();

            for(var key in config.elementMapTypes) {
                if(config.elementMapTypes.hasOwnProperty(key)) {
                    elementTypes.push(key);
                }
            }

            var element, nbTries = 0;

            do {
                // Find a random element within all selectors
                element = getRandomElementInArray(document.querySelectorAll(elementTypes.join(',')));
                nbTries++;
                if (nbTries > config.maxNbTries) return false;
            } while (!element || !config.canFillElement(element));

            // Retrieve element type
            var elementType = null;
            for (var selector in config.elementMapTypes) {
                if (element[matchFunction](selector)) {
                    elementType = selector;
                    break;
                }
            }

            var character = config.elementMapTypes[elementType](element);

            if (typeof config.showAction == 'function') {
                config.showAction(element);
            }

            if (typeof config.logger.log == 'function') {
                config.logger.log('gremlin', 'formFiller', 'input', character, 'in', element);
            }
        }

        function fillTextElement(element) {
            var character = Math.random().toString(36).substring(5, 6);
            element.value += character;

            return character;
        }

        function fillNumberElement(element) {
            var number = Math.floor(Math.random() * 10);
            element.value += number;

            return number;
        }

        function fillSelect(element) {
            var options = element.querySelectorAll('option');
            var randomOption = getRandomElementInArray(options);

            for (var i = 0, c = options.length; i < c; i++) {
                var option = options[i];
                option.selected = option.value == randomOption.value;
            }

            return randomOption.value;
        }

        function fillRadio(element) {
            // using mouse events to trigger listeners
            var evt = document.createEvent("MouseEvents");
            evt.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            element.dispatchEvent(evt);

            return element.value;
        }

        function fillCheckbox(element) {
            // using mouse events to trigger listeners
            var evt = document.createEvent("MouseEvents");
            evt.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            element.dispatchEvent(evt);

            return element.value;
        }

        function fillEmail(element) {
            var email = Math.random().toString(36).substring(5)+"@"+Math.random().toString(36).substring(5)+"."+Math.random().toString(36).substring(5, 8);
            element.value = email;

            return email;
        }

        function getMatchFunctionName() {
            var el = document.querySelector('body');
            return ( el.mozMatchesSelector || el.msMatchesSelector ||
                el.oMatchesSelector   || el.webkitMatchesSelector).name;
        }

        configurable(formFillerGremlin, config);

        return formFillerGremlin;
    };
});
