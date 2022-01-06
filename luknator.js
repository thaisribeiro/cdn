var JuarezPlugin = function ($) {
    'use strict';
    var name = 'juarez',
        sliderState,
        defaults = {

            // {Int or Bool} False for turning off autoplay
            autoplay: 7000,
            // {Bool} Pause autoplay on mouseover slider
            hoverpause: true,

            // {Bool} Circual play
            circular: true,

            // {Int} Animation time
            animationDuration: 700,
            // {String} Animation easing function
            animationTimingFunc: 'cubic-bezier(0.165, 0.840, 0.440, 1.000)',

            /**
             * {Bool or String} Show/hide/appendTo arrows
             * True for append arrows to slider wrapper
             * False for not appending arrows
             * Id or class name (e.g. '.class-name') for appending to specific HTML markup
             */
            arrows: true,
            // {String} Arrows wrapper class
            arrowsWrapperClass: 'slider__arrows',
            // {String} Main class for both arrows
            arrowMainClass: 'slider__arrows-item',
            // {String} Right arrow
            arrowRightClass: 'slider__arrows-item--right',
            // {String} Right arrow text
            arrowRightText: 'next',
            // {String} Left arrow
            arrowLeftClass: 'slider__arrows-item--left',
            // {String} Left arrow text
            arrowLeftText: 'prev',

            /**
             * {Bool or String} Show/hide/appendTo bullets navigation
             * True for append arrows to slider wrapper
             * False for not appending arrows
             * Id or class name (e.g. '.class-name') for appending to specific HTML markup
             */
            navigation: true,
            
            // {Int}} Pause time duration after mouse hover
            pauseDuration: 30000,
            
            // {Bool} Center bullet navigation
            navigationCenter: true,
            // {String} Navigation class
            navigationClass: 'slider__nav',
            // {String} Navigation item class
            navigationItemClass: 'slider__nav-item',
            // {String} Current navigation item class
            navigationCurrentItemClass: 'slider__nav-item--current',


            // {String} show slider after load image
            sliderVisibleClass: 'slider__visible',

            // {Bool} Slide on left/right keyboard arrows press
            keyboard: true,

            // {Int or Bool} Touch settings
            touchDistance: 60,

            // {Function} Callback before plugin init
            beforeInit: function () {},
            // {Function} Callback after plugin init
            afterInit: function () {},

            // {Function} Callback before slide change
            beforeTransition: function () {},
            // {Function} Callback after slide change
            afterTransition: function () {}

        };

    /**
     * Slider Constructor
     * @param {Object} parent
     * @param {Object} options
     */
    function Juarez(parent, options) {

        // Cache this
        var self = this;

        // Extend options
        this.options = $.extend({}, defaults, options);
        // Current slide id
        this.currentSlide = 0;
        // If CSS3 Transition isn't supported switch cssSupport variable to false and use $.animate()
        this.cssSupport = (!this.css.isSupported("transition") || !this.css.isSupported("transform")) ? false : true;
        // If circular set offset, two cloned slides
        this.offset = (this.options.circular) ? 2 : 0;

        // Callbacks before plugin init
        this.options.beforeInit.call(this);

        // Sidebar
        this.parent = parent;
        // Initialize
        this.init();
        // Start autoplay
        this.play();

        // Callback after plugin init
        this.options.afterInit.call(this);

        /**
         * API
         * Returning slider methods
         */
        return {

            /**
             * Get current slide number
             * @return {Int}
             */
            current: function () {
                return -(self.currentSlide) + 1;
            },

            /**
             * Reinit
             * Rebuild and recalculate dimensions of slider elements
             */
            reinit: function (json) {
                self.init(json);
            },
            /**
             * Destroy
             * Revert init modifications and freeze slides
             */
            destroy: function () {
                self.destroy();
            },

            /**
             * Start autoplay
             */
            play: function () {
                if (sliderState === true) {
                    self.play();
                }
            },

            /**
             * Stop autoplay
             */
            pause: function () {
                if (sliderState === false) {
                    self.pause();
                }
            },

            /**
             * Slide one forward
             * @param  {Function} callback
             */
            next: function (callback) {
                self.slide(1, false, callback);
            },

            /**
             * Slide one backward
             * @param  {Function} callback
             */
            prev: function (callback) {
                self.slide(-1, false, callback);
            },

            /**
             * Jump to specifed slide
             * @param  {Int} distance
             * @param  {Function} callback
             */
            jump: function (distance, callback) {
                self.slide(distance - 1, true, callback);
            },

            /**
             * Append navigation to specifet target
             * @param  {Mixed} target
             */
            nav: function (target) {

                /**
                 * If navigation wrapper already exist
                 * Remove it, protection before doubled navigation
                 */
                if (self.navigation.wrapper) {
                    self.navigation.wrapper.remove();
                }
                // While target isn't specifed, use slider wrapper
                self.options.navigation = (target) ? target : self.options.navigation;
                // Build
                self.navigation();

            },

            /**
             * Append arrows to specifet target
             * @param  {Mixed} target
             */
            arrows: function (target) {

                /**
                 * If arrows wrapper already exist
                 * Remove it, protection before doubled arrows
                 */
                if (self.arrows.wrapper) {
                    self.arrows.wrapper.remove();
                }

                // While target isn't specifed, use slider wrapper
                self.options.arrows = (target) ? target : self.options.arrows;
                // Build
                self.arrows();

            }

        };

    }

    /**
     * Building slider
     */
    Juarez.prototype.build = function () {

        /**
         * Attatch bindings
         */
        this.bindings();

        /**
         * There is more than one slide
         */
        if (this.slides.length > 1) {
            /**
             * Circular
             * If circular option is true
             * Append left and right arrow
             */
            if (this.options.circular) {
                this.circular();
            }
            /**
             * Arrows
             * If arrows option is true
             * Append left and right arrow
             */
            if (this.options.arrows) {
                this.arrows();
            }

            /**
             * Navigation
             * If navigation option is true
             * Append navigation item for each slide
             */
            if (this.options.navigation) {
                this.navigation();
            }
        }

        /**
         * Attatch events
         */
        this.events();

    };
    /**
     * Build circular DOM elements
     * Clone first and last slide
     * Set wrapper width with addional slides
     * Move slider wrapper to first slide
     */
    Juarez.prototype.circular = function () {
        /**
         * Clone first and last slide
         * and set width for each
         */
        this.firstClone = this.slides.filter(':first-child').clone().width(this.slides.spread);
        this.lastClone = this.slides.filter(':last-child').clone().width(this.slides.spread);

        /**
         * Append clodes slides to slider wrapper at the beginning and end
         * Increase wrapper with with values of addional slides
         * Clear translate and skip cloned last slide at the beginning
         */
        this.wrapper.append(this.firstClone).prepend(this.lastClone).width(this.parent.width() * (this.slides.length + 2))
            .trigger('clearTransition')
                .trigger('setTranslate', [-this.slides.spread]);

    };

    /**
     * Building navigation DOM
     */
    Juarez.prototype.navigation = function () {
        var i;
        this.navigation.items = {};

        // Navigation wrapper
        this.navigation.wrapper = $('<div />', {
            'class': this.options.navigationClass
        }).appendTo(
            /**
             * Setting append target
             * If option is true set default target, that is slider wrapper
             * Else get target set in options
             * @type {Bool or String}
             */
            (this.options.navigation === true) ? this.parent : this.options.navigation
        );
        
        for (i = 0; i < this.slides.length; i += 1) {
            this.navigation.items[i] = $('<a />', {
                'href': '#',
                'class': this.options.navigationItemClass,
                // Direction and distance -> Item index forward
                'data-distance': i
            }).appendTo(this.navigation.wrapper);
        }
        
        
        /*Here I try make this more semantic
            for (i = 0; i < this.slides.length; i += 1) {
                this.navigation.items[i] = $('<li />').appendTo(this.navigation.wrapper);
                this.navigation.items[i].append($("<a />", {
                    'href': '#',
                    'class': this.options.navigationItemClass,
                    // Direction and distance -> Item index forward
                    'data-distance': i
                }));
            }
        */
        
        // Add navCurrentItemClass to the first navigation item
        this.navigation.items[0].addClass(this.options.navigationCurrentItemClass);

        // If centered option is true
        if (this.options.navigationCenter) {
            // Center bullet navigation
            this.navigation.wrapper.css({
                'left': '50%',
                'width': this.navigation.wrapper.children().outerWidth(true) * this.navigation.wrapper.children().length,
                'margin-left': -(this.navigation.wrapper.outerWidth(true) / 2)
            });
        }

    };
        /**
     * Building arrows DOM
     */
    Juarez.prototype.arrows = function () {

        /**
         * Arrows wrapper
         * @type {Obejct}
         */
        this.arrows.wrapper = $('<div />', {
            'class': this.options.arrowsWrapperClass
        }).appendTo(
            /**
             * Setting append target
             * If option is true set default target, that is slider wrapper
             * Else get target set in options
             * @type {Bool or String}
             */
            (this.options.arrows === true) ? this.parent : this.options.arrows
        );

        /**
         * Right arrow
         * @type {Obejct}
         */
        this.arrows.right = $('<div />', {
            'class': this.options.arrowMainClass + ' ' + this.options.arrowRightClass,
            // Direction and distance -> One forward
            'data-distance': '1',
            'html': this.options.arrowRightText
        }).appendTo(this.arrows.wrapper);

        /**
         * Left arrow
         * @type {Object}
         */
        this.arrows.left = $('<div />', {
            'class': this.options.arrowMainClass + ' ' + this.options.arrowLeftClass,
            // Direction and distance -> One backward
            'data-distance': '-1',
            'html': this.options.arrowLeftText
        }).appendTo(this.arrows.wrapper);

    };

    /**
     * Function bindings
     */
    Juarez.prototype.bindings = function () {

        var self = this,
            o = this.options,
            prefix = this.css.getPrefix();

        /**
         * Setup slider wrapper bindings
         * for translate and transition control
         */
        this.wrapper.bind({

            /**
             * Set transition
             */
            'setTransition': function () {
                $(this).css( prefix + 'transition', prefix + 'transform ' + o.animationDuration + 'ms ' + o.animationTimingFunc);
            },

            /**
             * Clear transition
             * for immediate jump effect
             */
            'clearTransition': function () {
                $(this).css( prefix + 'transition', 'none');
            },

            /**
             * Set translate value
             * @param  {Object} event
             * @param  {Ind} translate
             */
            'setTranslate': function(event, translate) {
                // if css3 suported set translate3d
                if (self.cssSupport) $(this).css( prefix + 'transform', 'translate3d(' + translate + 'px, 0px, 0px)');
                // if not set left margin
                else $(this).css('margin-left', translate);
            }

        });

    };

    /**
     * Events controllers
     */
    Juarez.prototype.events = function () {

        /**
         * Swipe
         * If swipe option is true
         * Attach touch events
         */
        if (this.options.touchDistance) {
            this.parent.on({
                'touchstart MSPointerDown': $.proxy(this.events.touchstart, this),
                'touchmove MSPointerMove': $.proxy(this.events.touchmove, this),
                'touchend MSPointerUp': $.proxy(this.events.touchend, this)
            });
        }

        /**
         * Arrows
         * If arrows exists
         * Attach click event
         */
        if (this.arrows.wrapper) {
            $(this.arrows.wrapper).children().on('click touchstart',
                $.proxy(this.events.arrows, this)
            );
        }

        /**
         * Navigation
         * If navigation exists
         * Attach click event
         */
        if (this.navigation.wrapper) {
            $(this.navigation.wrapper).children().on('click touchstart',
                $.proxy(this.events.navigation, this)
            );
        }

        /**
         * Keyboard
         * If keyboard option is true
         * Attach press event
         */
        if (this.options.keyboard) {
            $(document).on('keyup.juarezKeyup',
                $.proxy(this.events.keyboard, this)
            );
        }

        /**
         * Slider hover
         * If hover option is true
         * Attach hover event
         */
        if (this.options.hoverpause) {
            this.parent.on('mouseover mouseout',
                $.proxy(this.events.hover, this)
            );
        }

        /**
         * Slider resize
         * On window resize
         * Attach resize event
         */
        $(window).on('resize',
            $.proxy(this.events.resize, this)
        );

    };

    /**
     * Navigation event controller
     * On click in navigation item get distance
     * Then slide specified distance with jump
     */
    Juarez.prototype.events.navigation = function (event) {

        if (!this.wrapper.attr('disabled')) {
            // Prevent default behaviour
            event.preventDefault();
            // Slide distance specified in data attribute
            this.slide($(event.currentTarget).data('distance'), true);
        }

    };

    /**
     * Arrows event controller
     * On click in arrows get direction and distance
     * Then slide specified distance without jump
     * @param  {Obejct} event
     */
    Juarez.prototype.events.arrows = function (event) {

        if (!this.wrapper.attr('disabled')) {
            // Prevent default behaviour
            event.preventDefault();
            // Slide distance specified in data attribute
            this.slide($(event.currentTarget).data('distance'), false);
        }

    };

    /**
     * Keyboard arrows event controller
     * Keyboard left and right arrow keys press
     */
    Juarez.prototype.events.keyboard = function (event) {

        if (!this.wrapper.attr('disabled')) {
            // Next
            if (event.keyCode === 39) this.slide(1);
            // Prev
            if (event.keyCode === 37) this.slide(-1);
        }

    };

    /**
     * When mouse is over slider, pause autoplay
     * On out, start autoplay again
     */
    Juarez.prototype.events.hover = function (event) {
        var time;
        // Pause autoplay
        this.pause();
        var self = this;

        // When mouse left slider or touch end, start autoplay anew
        if (event.type === 'mouseout') {
            self.play();
        }

    };

    /**
     * When resize browser window
     * Reinit plugin for new slider dimensions
     * Correct crop to current slide
     */
    Juarez.prototype.events.resize = function (event) {

        // Reinit plugin (set new slider dimensions)
        this.dimensions();
        // Crop to current slide
        this.slide(0);

    };

    /**
     * Disable events thats controls slide changes
     */
    Juarez.prototype.disableEvents = function () {
        this.wrapper.attr("disabled", true);
    };

    /**
     * Enable events thats controls slide changes
     */
    Juarez.prototype.enableEvents = function () {
        this.wrapper.attr("disabled", false);
    };

    /**
    * Touch start
    * @param  {Object} e event
    */
    Juarez.prototype.events.touchstart = function (event) {

        if (!this.wrapper.attr('disabled')) {
            // Cache event
            var touch = event.originalEvent.touches[0] || event.originalEvent.changedTouches[0];

            // Get touch start points
            this.events.touchStartX = touch.pageX;
            this.events.touchStartY = touch.pageY;
            this.events.touchSin = null;
        }

    };

    /**
    * Touch move
    * From swipe length segments calculate swipe angle
    * @param  {Obejct} e event
    */
    Juarez.prototype.events.touchmove = function (event) {

        if (!this.wrapper.attr('disabled')) {
            // Cache event
            var touch = event.originalEvent.touches[0] || event.originalEvent.changedTouches[0];

            // Calculate start, end points
            var subExSx = touch.pageX - this.events.touchStartX;
            var subEySy = touch.pageY - this.events.touchStartY;
            // Bitwise subExSx pow
            var powEX = Math.abs( subExSx << 2 );
            // Bitwise subEySy pow
            var powEY = Math.abs( subEySy << 2 );
            // Calculate the length of the hypotenuse segment
            var touchHypotenuse = Math.sqrt( powEX + powEY );
            // Calculate the length of the cathetus segment
            var touchCathetus = Math.sqrt( powEY );

            // Calculate the sine of the angle
            this.events.touchSin = Math.asin(touchCathetus / touchHypotenuse);

            if ( (this.events.touchSin * (180 / Math.PI)) < 45 ) event.preventDefault();
        }

    };

    /**
    * Touch end
    * @param  {Object} e event
    */
    Juarez.prototype.events.touchend = function (event) {

        if ( !this.wrapper.attr('disabled') ) {
            // Cache event
            var touch = event.originalEvent.touches[0] || event.originalEvent.changedTouches[0];

            // Calculate touch distance
            var touchDistance = touch.pageX - this.events.touchStartX;

            // While touch is positive and greater than distance set in options
            if ( (touchDistance > this.options.touchDistance) && ( (this.events.touchSin * (180 / Math.PI)) < 45) ) {
                // Slide one backward
                this.slide(-1);
            // While touch is negative and lower than negative distance set in options
            } else if (
                (touchDistance < -this.options.touchDistance) && ( (this.events.touchSin * (180 / Math.PI)) < 45) ) {
                // Slide one forward
                this.slide(1);
            }
        }

    };

    /**
     * Slides change & animate logic
     * @param  {int} distance
     * @param  {bool} jump
     * @param  {function} callback
     */
    Juarez.prototype.slide = function(distance, jump, callback) {

        // If there is one slide, escape
        if (this.slides.length <= 1) {
            return false;
        }

        /**
         * Stop autoplay
         * Clearing timer
         */
        this.pause();

        // Callbacks before slide change
        this.options.beforeTransition.call(this);

        // Setup variables
        var self = this,
            currentSlide = (jump) ? 0 : this.currentSlide,
            slidesLength = -(this.slides.length-1),
            fromFirst = false,
            fromLast = false;

        /**
         * Check if current slide is first and direction is previous, then go to last slide
         * or current slide is last and direction is next, then go to the first slide
         * else change current slide normally
         */
        if ( currentSlide === 0 && distance === -1 ) {
            fromFirst = true;
            currentSlide = slidesLength;
        } else if ( currentSlide === slidesLength && distance === 1 ) {
            fromLast = true;
            currentSlide = 0;
        } else {
            currentSlide = currentSlide + (-distance);
        }

        /**
         * Crop to current slide.
         * Mul slide width by current slide number.
         */
        var offset = this.slides.spread * currentSlide;

        /**
         * While circular decrease offset with the width of single slide
         * When fromFirst and fromLast flags are set, unbind events thats controls changing
         * When fromLast flags is set, set offset to slide width mulled by slides count without cloned slides
         * When fromFirst flags is set, set offset to zero
         */
        if (this.options.circular) {
            offset = offset - this.slides.spread;
            if (fromLast || fromFirst) this.disableEvents();
            if (fromLast) offset = this.slides.spread * (slidesLength - 2);
            if (fromFirst) offset = 0;
        }

        /**
         * Slide change animation
         * While CSS3 is supported use offset
         * if not, use $.animate();
         */
        if (this.cssSupport) this.wrapper.trigger('setTransition').trigger('setTranslate', [offset]);
        else this.wrapper.stop().animate({ 'margin-left': offset }, this.options.animationDuration);

        /**
         * While circular
         */
        if (this.options.circular) {

            /**
             * 	When fromFirst and fromLast flags are set
             * 	after animation clear transition and bind events that control slides changing
             */
            if (fromFirst || fromLast) {
                this.afterAnimation(function (){
                    self.wrapper.trigger('clearTransition');
                    self.enableEvents();
                });
            }

            /**
             * When fromLast flag is set
             * after animation make immediate jump from cloned slide to proper one
             */
            if (fromLast) {
                this.afterAnimation(function (){
                    fromLast = false;
                    self.wrapper.trigger('setTranslate', [-self.slides.spread]);
                });
            }

            /**
             * When fromFirst flag is set
             * after animation make immediate jump from cloned slide to proper one
             */
            if (fromFirst) {
                this.afterAnimation(function (){
                    fromFirst = false;
                    self.wrapper.trigger('setTranslate', [self.slides.spread * (slidesLength-1)]);
                });
            }

        }

        // Set to navigation item current class
        if (this.options.navigation && this.navigation.wrapper) {
            $('.' + this.options.navigationClass, (this.options.navigation === true) ? this.parent : this.options.navigation).children()
                .eq(-currentSlide)
                    .addClass(this.options.navigationCurrentItemClass)
                        .siblings()
                            .removeClass(this.options.navigationCurrentItemClass);
        }

        // Update current slide globaly
        this.currentSlide = currentSlide;

        // Callbacks after slide change
        this.afterAnimation(function (){
            self.options.afterTransition.call(self);
            if ( (callback !== 'undefined') && (typeof callback === 'function') ) callback();
        });

        /**
         * Start autoplay
         * Setting up timer
         */
        this.play();

    };

    /**
     * Autoplay logic
     * Setup counting
     */
    Juarez.prototype.play = function () {

        // Cache this
        var self = this;

        /**
         * If autoplay turn on
         * Slide one forward after a set time
         */
        if (this.options.autoplay) {
            this.auto = setInterval(function () {
                self.slide(1, false);
                sliderState = true;
            }, this.options.autoplay);

        }

    };

    /**
     * Autoplay pause
     * Clear counting
     */
    Juarez.prototype.pause = function () {

        /**
         * If autoplay turn on
         * Clear interial
         */
        if (this.options.autoplay) { 
            this.auto = clearInterval(this.auto); 
            sliderState = false;
        }

    };

    /**
     * Call callback after animation duration
     * Added 10 ms to duration to be sure is fired after animation
     * @param  {Function} callback
     */
    Juarez.prototype.afterAnimation = function(callback) {

        setTimeout(function (){
            callback();
        }, this.options.animationDuration + 10);

    };

    /**
     * Dimensions
     * Get & set dimensions of slider elements
     */
    Juarez.prototype.dimensions = function () {

        // Get slide width
        this.slides.spread = this.parent.width();
        // Set wrapper width
        this.wrapper.width(this.slides.spread * (this.slides.length + this.offset));
        // Set slide width
        this.slides.add(this.firstClone).add(this.lastClone).width(this.slides.spread);

    };

    /**
     * Destroy
     * Revert init modifications and freeze slides
     */
    Juarez.prototype.destroy = function () {

        this.parent.unbind();
        this.wrapper.unbind();
        this.wrapper.removeAttr("style");
        $(this.navigation.wrapper).children().unbind();
        $(this.arrows.wrapper).children().unbind();
        this.slide(0, true);
        this.pause();

        if(this.options.circular) {
            this.firstClone.remove();
            this.lastClone.remove();
        }

    };

    /**
     * Initialize
     * Set wrapper
     * Set slides
     * Set animation type
     */
    Juarez.prototype.init = function () {
        this.wrapper = this.parent.children();
        // Set slides
        this.slides = this.wrapper.children();
        // Set slider dimentions
        this.dimensions();
        // Build DOM
        this.build();
    };

    /**
     * Methods for css3 management
     */
    Juarez.prototype.css = {

        /**
         * Check css3 support
         * @param  {String}  Declaration name to check
         * @return {Boolean}
         */
        isSupported: function(declaration) {

            var isSupported = false,
                prefixes = 'Khtml ms O Moz Webkit'.split(' '),
                clone = document.createElement('div'),
                declarationCapital = null;

            declaration = declaration.toLowerCase();
            if (clone.style[declaration] !== undefined) isSupported = true;
            if (isSupported === false) {
                declarationCapital = declaration.charAt(0).toUpperCase() + declaration.substr(1);
                for( var i = 0; i < prefixes.length; i++ ) {
                    if( clone.style[prefixes[i] + declarationCapital ] !== undefined ) {
                        isSupported = true;
                        break;
                    }
                }
            }

            if (window.opera) {
                if (window.opera.version() < 13) isSupported = false;
            }

            if (isSupported === 'undefined' || isSupported === undefined) isSupported = false;

            return isSupported;

        },

        /**
         * Get browser css prefix
         * @return {String} 	Returns prefix in "-{prefix}-" format
         */
        getPrefix: function () {

            if (!window.getComputedStyle) return '';

            var styles = window.getComputedStyle(document.documentElement, '');
            return '-' + (Array.prototype.slice
                .call(styles)
                .join('')
                .match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
            )[1] + '-';

        }

    };

    $.fn[name] = function(options) {
        return this.each(function () {
            if ( !$.data(this, '') ) {
                $.data(this, '', new Juarez($(this), options) );
            }
        });
    };

};

(function() {

    luknator = function($) {
        this.$ = $;
        this.configure();
        this.build();
    };

    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    luknator.prototype.configure = function() {
        this.conversationId = null;
        this.waitingResponse = false;
        this.initGoogleMaps();

        var params = window.luknatorParams;
        if (typeof params == 'object') {
            this.url = params.url;
            this.bt_close = params.bt_close;
            this.bt_send = params.bt_send;
            this.bot_coin = params.bot_coin;
            this.bot_bubble = params.bot_bubble;
            this.title = params.title;
	    this.tagCallback = params.tagCallback;
        }
    };

    luknator.prototype.initGoogleMaps = function(action) {

        window.initMap = function() {
            window.googleMapsInitialized = true;
        };

        this.$('head').append(
            '<script async defer ' +
            'src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCv6sHnl3ystc7J2tMpETUS---uOuvLFBg&callback=initMap">' +
            '</script>'
        );
    };

    luknator.prototype.build = function() {
        /////////////////
        // CHANGE THIS //
        var holyHTML = '<div class="box-header"><div class="title"><h2>' + this.title + '</h2></div><div class="close-button"><i class="close svg-close-chat" style="cursor:pointer"></i></div></div><div class="box-content"><div class="box-alert"></div><div class="chat-content"><div class="chat-item bot"><div class="box-options"/></div></div></div><div class="box-footer"><div class="form-area"><div class="box-input"><div class="input-wrapper"><button id="submitchat" class="submit-chat"></button><input class="user-input" type="text" data-emojiable="true" placeholder="Escreva sua mensagem..."></div></div></div></div>';
        /////////////////

        var chatWidget = this.$('<div/>', {
            'id': 'chat-widget',
            'class': 'userchat-ui out'
        });
        chatWidget.html(holyHTML);

        // Coin
        var coinDiv = this.$('<div/>', {
            'id': 'chat-coin-icon'
        });
        var coinContainer = this.$('<div/>', {
            'class': 'avatar-container'
        });
        var coinImg = this.$('<img/>', {
            'src': this.bot_coin,
            'draggable': 'false'
        });
        coinContainer.append(coinImg);
        coinDiv.append(coinContainer);

        this.$('luknator-container').append(chatWidget);
        this.$('luknator-container').append(coinDiv);

        // Button Close
        this.$('.box-header .close-button').css(
            'background',
            'url(' + this.bt_close + ')'
        );

        // Button Send
        this.$('.submit-chat').css(
            'background-image',
            'url(' + this.bt_send + ')'
        );

        this.bind();

        var urlParams = new URLSearchParams(window.location.search);
        var openChat = urlParams.get('openChat');

        if (openChat) {
            $('#chat-coin-icon').click();
        }
    };

    luknator.prototype.bind = function() {
        var hide_alert_delay = 60000;

        //Bind Input
        this.$('.user-input').focusin(function() {
            this.$('#chat-coin-icon').addClass('out');
            this.$('#chat-widget').addClass('full');
        }.bind(this));

        // Bind Coin
        this.$('#chat-coin-icon').off().on('click', function() {
            // verify cookies
            this.handleCookieUserUnique();

            // remove message
            if ($('.box-alert').length){
                setTimeout(function(){
                    $('.box-alert').slideUp( "slow", function(){ $(this).remove();});
                }, hide_alert_delay);
            }

            if (this.$('#chat-widget').hasClass('out') === true) {
                if (!luknator.conversationId && !this.waitingResponse) {
                    this.waitingResponse = true;
                    this.$.ajax({
                        mode: 'cors',
                        url: this.url
                    }).done(function(result) {
                       this.setMessageAndAlert(result);
                    }.bind(this))
                    .fail(function(result) {
                        result = result.responseJSON;
                        this.setMessageAndAlert(result);
                    }.bind(this));
                } else {
                    this.$('#chat-widget').removeClass('out');
                    if(isMobile) { this.$('html').css("overflow", "hidden"); }
                }
            } else {
                this.$('#chat-widget').addClass('out');
                  if(isMobile) { this.$('html').css("overflow", "auto"); }
            }

        }.bind(this));
        
        // Bind Close
        this.$('#chat-widget .close-button').off().on('click', function() {
            this.$('#chat-coin-icon').removeClass('out');
            this.$('#chat-widget').addClass('out');
            this.$('#chat-widget').removeClass('full');
            if(isMobile) { this.$('html').removeClass('i-amphtml-scroll-disabled'); }
        }.bind(this));

        // Bind Click Submit
        this.$('#chat-widget .submit-chat').off().on('click', function() {

            this.cleanMessage();
            
        }.bind(this));


        // Bind text Area
        this.$('#chat-widget .user-input').keyup(function(e) {

            if (e.keyCode == 13) {
                this.cleanMessage();
            }

        }.bind(this));

        luknator.prototype.handleCookieUserUnique = function() {
            var cookies = document.cookie.split(";");
            var ml2_sid_c = undefined;
            
            if (cookies.find(el => el.includes("ml2_sid_c"))) {
                b = cookies.find(el => el.includes("ml2_sid_c"));
                ml2_sid_c = decodeURIComponent(b.replace("ml2_sid_c=", ""));
                return ml2_sid_c;
            }

            var chat_user_uuid = this.createUUID();
            this.setCookie('chat_user_uuid', chat_user_uuid, 365);
            return chat_user_uuid;
        }

        luknator.prototype.setCookie = function(name, value,  expDays) {
            var date = new Date();
            date.setTime(date.getDate() + (expDays * 24 * 60 * 60 * 1000));
            var expires = "expires=" + date.toUTCString();
            document.cookie = name + "=" + value + ";" + expires + ";"
        }
        luknator.prototype.createUUID = function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }

        luknator.prototype.setMessageAndAlert = function(result) {
            luknator.conversationId = result.conversation_id;
            if (result.try_cb != null) {
                luknator.try_cb = result.try_cb
            }
            this.createMessage('bot', result);
            this.waitingResponse = false;
            this.$('.box-alert').append(result.message_alert);
            if(isMobile) { this.$('html').css("overflow", "hidden"); }
        }

        luknator.prototype.sendText = function() {

            var usertext = this.$('#chat-widget .user-input').val();

            this.createMessage('user', {
                'responses': [usertext]
            });

            this.$('#chat-widget .user-input').val('');
            this.$('.options').remove();
            this.$('#chat-coin-icon').addClass('out');
            this.$('#chat-widget').addClass('full');
            this.$('.bot .speak').last().removeClass('speak-option');

            this.botRequest(usertext);

        };

        luknator.prototype.cleanMessage = function() {
            
            if ($.trim($('#chat-widget .user-input').val()) != "") {
                this.sendText();
            };

        };


    };

    luknator.prototype.botRequest = function(text) {
        var boxIndicator = this.$('#chat-widget .speak').last();
        var that = this;
        var data = { 'conversation_id': luknator.conversationId }
        if (luknator.try_cb != null) {
            data = { 'conversation_id': luknator.conversationId, 'try_cb': luknator.try_cb }
        }
        if (text) { data.text = text }

        if (this.url.indexOf('jupiter') !== -1) { data.wa_id = '553492397895'}

        this.$.ajax({
            url: this.url,
            type: 'POST',
            mode: 'cors',
            dataType: 'json',
            data: JSON.stringify(data),
            contentType: 'application/json; charset=utf-8',
            success: function(result){
                setTimeout(function() {
                    $('#chat-widget .user-input').prop('disabled', false);
                    $("div.float-typing").remove();
                    luknator.try_cb = result.try_cb;
                    return that.createMessage('bot', result);
                }, 800);

            }.bind(this),
            error: function (result) {
                if (result.responseText.indexOf('html') != -1) {
                    result.responses = ['Hummm! Tô com um probleminha aqui nos meus algorítimos e não peguei o que vc me mandou. Pode escrever outra vez?'];
                }
                else {
                    result.responses = JSON.parse(result.responseText).responses;
                }
                
                console.error('error processing request: ' + result.responses + '\nstatus: ' + result.status + ' \nstatusText:' + result.statusText);

                $('#chat-widget .user-input').prop('disabled', false);
                $("div.float-typing").remove();
                
                if("responseJSON" in result){
                    var responseJSON = result.responseJSON;
                    if("conversation_id" in responseJSON){
                        luknator.conversation_id = responseJSON.conversation_id;
                        result.responses = responseJSON.responses;
                    }
                }
                console.log(result);
                return that.createMessage('bot', result);
            }.bind(this)
        });

        this.$('#chat-widget .user-input').prop('disabled', true);

        boxIndicator.after('<div class="float-typing"><div class="typing-indicator"><span></span><span></span><span></span></div></div>');
    };

    luknator.prototype.actionCloseChat = function(action) {
        this.$('#chat-widget').addClass('out');
    };


    luknator.prototype.actionDisplayOptions = function(action) {

        var boxOptions = this.$('#chat-widget .speak').last();
        var options = action.options;
        var div_options = this.$('<div>', {
            'class': 'options'
        });

        for (var i = 0; i < options.length; i++) {
            var option_text = options[i];

            var option = this.$('<input>').attr({
                type: 'button',
                id: option_text,
                value: option_text,
                class: 'input-option'
            }).off().on('click', function(button) {

                var option_text = button.target.id;
                this.createMessage('user', {
                    'responses': [option_text]
                });
                this.$('.options').remove();
                this.$('#chat-widget .user-input').val('');
                this.$('#chat-coin-icon').addClass('out');
                this.$('#chat-widget').addClass('full');
                boxOptions.removeClass('speak-option');

                this.botRequest(option_text);

            }.bind(this));

            div_options.append(option);
        }

        boxOptions.addClass('speak-option');

        this.$('#chat-widget .box-content').animate({
            scrollTop: 99999
        }, 500);
 
        boxOptions.append(div_options);

    };

    luknator.prototype.actionTransferZendesk = function(context) {
        var s = document.createElement("script");
        s.type = "text/javascript";
        s.src = context['url_zendesk'];
        s.id = "ze-snippet";
        document.head.append(s);
        
        var waitForZopim = setInterval(function () {
            if (
                window.$zopim === undefined ||
                window.$zopim.livechat === undefined ||
                window.$zopim.livechat.departments === undefined
            ) {
                return;
            }
        
            zE(function () {
                $zopim(function () {
                    if (!$zopim.livechat.isChatting()) {
                        $zopim.livechat.clearAll();
                    }
                    
                    $zopim.livechat.setOnConnected(() => {
                        $zopim.livechat.departments.setVisitorDepartment(context['department']);
                        
                        console.log('Department==>', context['department']);
                        console.log('Department Tag==>',  context['department_tag']);

                        if (context['order_id']) {
                            $zopim.livechat.addTags("pedido_" + context['order_id'], "cpf_" + context['customer_cpf'], context['department_tag']);
                        } else {
                            $zopim.livechat.addTags("cpf_" + context['customer_cpf'], context['department_tag']);
                        }

                        $zopim.livechat.set({
                            name: context['customer_name'],
                            email: context['customer_email']
                        });
            
                        $zopim.livechat.window.show();
                        var department_info = $zopim.livechat.departments.getDepartment(context['department']);
                        if(department_info.status === "online" && (context['toggle_overflow_message'] == true || context['toggle_overflow_message'] == "true")){
                            $zopim.livechat.say(context['overflow_message'])
                        }
                    });
            
                });
            });

            this.$('#chat-widget').addClass('out');
            this.$('#chat-widget').removeClass('full');
            if(isMobile) { this.$('html').removeClass('i-amphtml-scroll-disabled'); }

            clearInterval(waitForZopim);
        }, 100);
    };

    luknator.prototype.createMessage = function(className, result) {
        this.$('#chat-widget').removeClass('out');
        if (result.hasOwnProperty('context') && result.context.hasOwnProperty('wait_attendant')){
            this.$('#chat-widget .user-input').prop('disabled', true);
        }
        
	// expose bot tag
        window.BotTag = result.tag;
	if (this.tagCallback && className == 'bot') {
	    this.tagCallback(result.tag);
	}
	
        for (var j = 0; j < result.responses.length; j++) {
            var text = result.responses[j];
            var fullClassName = 'chat-item ' + className;
            var chatItem = this.$('<div>', {
               'class': fullClassName
            });

            var span = this.$('<span>');

            if (className == 'bot') {
                var avatar = this.$('<div>', {
                    'class': 'avatar'
                });
                var img = this.$('<img>')
                    .attr('src', this.bot_bubble)
                    .attr('draggable', 'false');
                avatar.append(img);
                chatItem.append(avatar);
                span.html(text);
                $('#chat-widget .user-input').focus();
            } else {
                span.text(text);
            }

            var speak = this.$('<div>', {
                'class': 'speak'
            });
            speak.append(span);
            chatItem.append(speak);

            this.$('#chat-widget .chat-content').append(chatItem);
        }
        
        if (result.try_cb != null && result.try_cb > 0) {
            if (result.try_cb == 1) {
                this.actionDisplayOptions({"options": ["Falar com atendente", "Não precisa"] });
            } else {
                this.actionDisplayOptions({"options": ["Falar com atendente", "Até mais tarde"] });
            }
            
        }

        if (result.actions) {
            for (var i = 0; i < result.actions.length; i++) {

                var action = result.actions[i];

                if (action.type == 'auto_reply') {
                    console.log('AUTO REPLY')
                    this.botRequest();
                }

                if (action.type == 'option' || action.type == 'display_options') {
                    this.actionDisplayOptions(action);
                }

                if (action.type == 'transfer_zendesk') {
                    this.actionTransferZendesk(result.context);
                }

                if (action.type == 'close_chat') {
                    this.actionCloseChat();
                }
            }
        }

        this.$('#chat-widget .box-content').animate({
            scrollTop: 99999
        }, 0);

    };

    function main(params) {
        window.jQuery(document).ready(function($) {

            if (!window._luknator) {
                var cssLink = $('<link>', {
                    rel: 'stylesheet',
                    type: 'text/css',
                    href: window.luknatorParams.css
                });
                cssLink.appendTo('head');
                window._luknator = new luknator($);
            }

        });
    };

    ////////////
    // Loader //
    ////////////
    var jQuery;
    if (window.jQuery === undefined || window.jQuery.fn.jquery !== '1.12.4') {

        var script_tag = document.createElement('script');

        script_tag.setAttribute('type', 'text/javascript');
        script_tag.setAttribute(
            'src',
            '//ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js'
        );

        if (script_tag.readyState) {
            script_tag.onreadystatechange = function() { // For old versions of IE
                if (this.readyState == 'complete' || this.readyState == 'loaded') {
                    scriptLoadHandler();
                }
            };
        } else {
            script_tag.onload = scriptLoadHandler;
        }
        (document.getElementsByTagName('head')[0] || document.documentElement).appendChild(script_tag);

    } else {
        jQuery = window.jQuery;
        main();
    }

    function scriptLoadHandler() {
        jQuery = window.jQuery.noConflict(true);
        main();
    };

})();
(function() {

    luknator = function($) {
        this.$ = $;
        this.configure();
        this.build();
    };

    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    luknator.prototype.configure = function() {
        this.conversationId = null;
        this.waitingResponse = false;
        this.initGoogleMaps();

        var params = window.luknatorParams;
        if (typeof params == 'object') {
            this.url = params.url;
            this.bt_close = params.bt_close;
            this.bt_send = params.bt_send;
            this.bot_coin = params.bot_coin;
            this.bot_bubble = params.bot_bubble;
            this.title = params.title;
	    this.tagCallback = params.tagCallback;
        }
    };

    luknator.prototype.initGoogleMaps = function(action) {

        window.initMap = function() {
            window.googleMapsInitialized = true;
        };

        this.$('head').append(
            '<script async defer ' +
            'src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCv6sHnl3ystc7J2tMpETUS---uOuvLFBg&callback=initMap">' +
            '</script>'
        );
    };

    luknator.prototype.build = function() {
        /////////////////
        // CHANGE THIS //
        var holyHTML = '<div class="box-header"><div class="title"><h2>' + this.title + '</h2></div><div class="close-button"><i class="close svg-close-chat" style="cursor:pointer"></i></div></div><div class="box-content"><div class="box-alert"></div><div class="chat-content"><div class="chat-item bot"><div class="box-options"/></div></div></div><div class="box-footer"><div class="form-area"><div class="box-input"><div class="input-wrapper"><button id="submitchat" class="submit-chat"></button><input class="user-input" type="text" data-emojiable="true" placeholder="Escreva sua mensagem..."></div></div></div></div>';
        /////////////////

        var chatWidget = this.$('<div/>', {
            'id': 'chat-widget',
            'class': 'userchat-ui out'
        });
        chatWidget.html(holyHTML);

        // Coin
        var coinDiv = this.$('<div/>', {
            'id': 'chat-coin-icon'
        });
        var coinContainer = this.$('<div/>', {
            'class': 'avatar-container'
        });
        var coinImg = this.$('<img/>', {
            'src': this.bot_coin,
            'draggable': 'false'
        });
        coinContainer.append(coinImg);
        coinDiv.append(coinContainer);

        this.$('luknator-container').append(chatWidget);
        this.$('luknator-container').append(coinDiv);

        // Button Close
        this.$('.box-header .close-button').css(
            'background',
            'url(' + this.bt_close + ')'
        );

        // Button Send
        this.$('.submit-chat').css(
            'background-image',
            'url(' + this.bt_send + ')'
        );

        this.bind();

        var urlParams = new URLSearchParams(window.location.search);
        var openChat = urlParams.get('openChat');

        if (openChat) {
            $('#chat-coin-icon').click();
        }
    };

    luknator.prototype.bind = function() {
        var hide_alert_delay = 60000;

        //Bind Input
        this.$('.user-input').focusin(function() {
            this.$('#chat-coin-icon').addClass('out');
            this.$('#chat-widget').addClass('full');
        }.bind(this));

        // Bind Coin
        this.$('#chat-coin-icon').off().on('click', function() {
            // verify cookies
            this.handleCookieUserUnique();
            
            // remove message
            if ($('.box-alert').length){
                setTimeout(function(){
                    $('.box-alert').slideUp( "slow", function(){ $(this).remove();});
                }, hide_alert_delay);
            }

            if (this.$('#chat-widget').hasClass('out') === true) {
                if (!luknator.conversationId && !this.waitingResponse) {
                    this.waitingResponse = true;
                    this.$.ajax({
                        mode: 'cors',
                        url: this.url
                    }).done(function(result) {
                       this.setMessageAndAlert(result);
                    }.bind(this))
                    .fail(function(result) {
                        result = result.responseJSON;
                        this.setMessageAndAlert(result);
                    }.bind(this));
                } else {
                    this.$('#chat-widget').removeClass('out');
                    if(isMobile) { this.$('html').css("overflow", "hidden"); }
                }
            } else {
                this.$('#chat-widget').addClass('out');
                  if(isMobile) { this.$('html').css("overflow", "auto"); }
            }

        }.bind(this));
        
        // Bind Close
        this.$('#chat-widget .close-button').off().on('click', function() {
            this.$('#chat-coin-icon').removeClass('out');
            this.$('#chat-widget').addClass('out');
            this.$('#chat-widget').removeClass('full');
            if(isMobile) { this.$('html').removeClass('i-amphtml-scroll-disabled'); }
        }.bind(this));

        // Bind Click Submit
        this.$('#chat-widget .submit-chat').off().on('click', function() {

            this.cleanMessage();
            
        }.bind(this));


        // Bind text Area
        this.$('#chat-widget .user-input').keyup(function(e) {

            if (e.keyCode == 13) {
                this.cleanMessage();
            }

        }.bind(this));

        luknator.prototype.handleCookieUserUnique = function() {
            var cookies = document.cookie.split(";");
            var ml2_sid_c = undefined;
            
            if (cookies.find(el => el.includes("ml2_sid_c"))) {
                b = cookies.find(el => el.includes("ml2_sid_c"));
                ml2_sid_c = decodeURIComponent(b.replace("ml2_sid_c=", ""));
                return ml2_sid_c;
            }

            var chat_user_uuid = this.createUUID();
            this.setCookie('chat_user_uuid', chat_user_uuid, 365);
            return chat_user_uuid;
        }

        luknator.prototype.setCookie = function(name, value,  expDays) {
            var date = new Date();
            date.setTime(date.getDate() + (expDays * 24 * 60 * 60 * 1000));
            var expires = "expires=" + date.toUTCString();
            document.cookie = name + "=" + value + ";" + expires + ";"
        }
        luknator.prototype.createUUID = function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }

        luknator.prototype.setMessageAndAlert = function(result) {
            luknator.conversationId = result.conversation_id;
            if (result.try_cb != null) {
                luknator.try_cb = result.try_cb
            }
            this.createMessage('bot', result);
            this.waitingResponse = false;
            this.$('.box-alert').append(result.message_alert);
            if(isMobile) { this.$('html').css("overflow", "hidden"); }
        }

        luknator.prototype.sendText = function() {

            var usertext = this.$('#chat-widget .user-input').val();

            this.createMessage('user', {
                'responses': [usertext]
            });

            this.$('#chat-widget .user-input').val('');
            this.$('.options').remove();
            this.$('#chat-coin-icon').addClass('out');
            this.$('#chat-widget').addClass('full');
            this.$('.bot .speak').last().removeClass('speak-option');

            this.botRequest(usertext);

        };

        luknator.prototype.cleanMessage = function() {
            
            if ($.trim($('#chat-widget .user-input').val()) != "") {
                this.sendText();
            };

        };


    };

    luknator.prototype.botRequest = function(text) {
        var boxIndicator = this.$('#chat-widget .speak').last();
        var that = this;
        var data = { 'conversation_id': luknator.conversationId }
        if (luknator.try_cb != null) {
            data = { 'conversation_id': luknator.conversationId, 'try_cb': luknator.try_cb }
        }
        if (text) { data.text = text }

        if (this.url.indexOf('jupiter') !== -1) { data.wa_id = '553492397895'}

        this.$.ajax({
            url: this.url,
            type: 'POST',
            mode: 'cors',
            dataType: 'json',
            data: JSON.stringify(data),
            contentType: 'application/json; charset=utf-8',
            success: function(result){
                setTimeout(function() {
                    $('#chat-widget .user-input').prop('disabled', false);
                    $("div.float-typing").remove();
                    luknator.try_cb = result.try_cb;
                    return that.createMessage('bot', result);
                }, 800);

            }.bind(this),
            error: function (result) {
                if (result.responseText.indexOf('html') != -1) {
                    result.responses = ['Hummm! Tô com um probleminha aqui nos meus algorítimos e não peguei o que vc me mandou. Pode escrever outra vez?'];
                }
                else {
                    result.responses = JSON.parse(result.responseText).responses;
                }
                
                console.error('error processing request: ' + result.responses + '\nstatus: ' + result.status + ' \nstatusText:' + result.statusText);

                $('#chat-widget .user-input').prop('disabled', false);
                $("div.float-typing").remove();
                
                if("responseJSON" in result){
                    var responseJSON = result.responseJSON;
                    if("conversation_id" in responseJSON){
                        luknator.conversation_id = responseJSON.conversation_id;
                        result.responses = responseJSON.responses;
                    }
                }
                console.log(result);
                return that.createMessage('bot', result);
            }.bind(this)
        });

        this.$('#chat-widget .user-input').prop('disabled', true);

        boxIndicator.after('<div class="float-typing"><div class="typing-indicator"><span></span><span></span><span></span></div></div>');
    };

    luknator.prototype.actionCloseChat = function(action) {
        this.$('#chat-widget').addClass('out');
    };


    luknator.prototype.actionDisplayOptions = function(action) {

        var boxOptions = this.$('#chat-widget .speak').last();
        var options = action.options;
        var div_options = this.$('<div>', {
            'class': 'options'
        });

        for (var i = 0; i < options.length; i++) {
            var option_text = options[i];

            var option = this.$('<input>').attr({
                type: 'button',
                id: option_text,
                value: option_text,
                class: 'input-option'
            }).off().on('click', function(button) {

                var option_text = button.target.id;
                this.createMessage('user', {
                    'responses': [option_text]
                });
                this.$('.options').remove();
                this.$('#chat-widget .user-input').val('');
                this.$('#chat-coin-icon').addClass('out');
                this.$('#chat-widget').addClass('full');
                boxOptions.removeClass('speak-option');

                this.botRequest(option_text);

            }.bind(this));

            div_options.append(option);
        }

        boxOptions.addClass('speak-option');

        this.$('#chat-widget .box-content').animate({
            scrollTop: 99999
        }, 500);
 
        boxOptions.append(div_options);

    };

    luknator.prototype.actionTransferZendesk = function(context) {
        var s = document.createElement("script");
        s.type = "text/javascript";
        s.src = context['url_zendesk'];
        s.id = "ze-snippet";
        document.head.append(s);
        
        var waitForZopim = setInterval(function () {
            if (
                window.$zopim === undefined ||
                window.$zopim.livechat === undefined ||
                window.$zopim.livechat.departments === undefined
            ) {
                return;
            }
        
            zE(function () {
                $zopim(function () {
                    if (!$zopim.livechat.isChatting()) {
                        $zopim.livechat.clearAll();
                    }
                    
                    $zopim.livechat.setOnConnected(() => {
                        $zopim.livechat.departments.setVisitorDepartment(context['department']);
                        
                        console.log('Department==>', context['department']);
                        console.log('Department Tag==>',  context['department_tag']);

                        if (context['order_id']) {
                            $zopim.livechat.addTags("pedido_" + context['order_id'], "cpf_" + context['customer_cpf'], context['department_tag']);
                        } else {
                            $zopim.livechat.addTags("cpf_" + context['customer_cpf'], context['department_tag']);
                        }

                        $zopim.livechat.set({
                            name: context['customer_name'],
                            email: context['customer_email']
                        });
            
                        $zopim.livechat.window.show();
                        var department_info = $zopim.livechat.departments.getDepartment(context['department']);
                        if(department_info.status === "online" && (context['toggle_overflow_message'] == true || context['toggle_overflow_message'] == "true")){
                            $zopim.livechat.say(context['overflow_message'])
                        }
                    });
            
                });
            });

            this.$('#chat-widget').addClass('out');
            this.$('#chat-widget').removeClass('full');
            if(isMobile) { this.$('html').removeClass('i-amphtml-scroll-disabled'); }

            clearInterval(waitForZopim);
        }, 100);
    };

    luknator.prototype.createMessage = function(className, result) {
        this.$('#chat-widget').removeClass('out');
        if (result.hasOwnProperty('context') && result.context.hasOwnProperty('wait_attendant')){
            this.$('#chat-widget .user-input').prop('disabled', true);
        }
        
	// expose bot tag
        window.BotTag = result.tag;
	if (this.tagCallback && className == 'bot') {
	    this.tagCallback(result.tag);
	}
	
        for (var j = 0; j < result.responses.length; j++) {
            var text = result.responses[j];
            var fullClassName = 'chat-item ' + className;
            var chatItem = this.$('<div>', {
               'class': fullClassName
            });

            var span = this.$('<span>');

            if (className == 'bot') {
                var avatar = this.$('<div>', {
                    'class': 'avatar'
                });
                var img = this.$('<img>')
                    .attr('src', this.bot_bubble)
                    .attr('draggable', 'false');
                avatar.append(img);
                chatItem.append(avatar);
                span.html(text);
                $('#chat-widget .user-input').focus();
            } else {
                span.text(text);
            }

            var speak = this.$('<div>', {
                'class': 'speak'
            });
            speak.append(span);
            chatItem.append(speak);

            this.$('#chat-widget .chat-content').append(chatItem);
        }
        
        if (result.try_cb != null && result.try_cb > 0) {
            if (result.try_cb == 1) {
                this.actionDisplayOptions({"options": ["Falar com atendente", "Não precisa"] });
            } else {
                this.actionDisplayOptions({"options": ["Falar com atendente", "Até mais tarde"] });
            }
            
        }

        if (result.actions) {
            for (var i = 0; i < result.actions.length; i++) {

                var action = result.actions[i];

                if (action.type == 'auto_reply') {
                    console.log('AUTO REPLY')
                    this.botRequest();
                }

                if (action.type == 'option' || action.type == 'display_options') {
                    this.actionDisplayOptions(action);
                }

                if (action.type == 'transfer_zendesk') {
                    this.actionTransferZendesk(result.context);
                }

                if (action.type == 'close_chat') {
                    this.actionCloseChat();
                }
            }
        }

        this.$('#chat-widget .box-content').animate({
            scrollTop: 99999
        }, 0);

    };

    function main(params) {
        window.jQuery(document).ready(function($) {

            if (!window._luknator) {
                var cssLink = $('<link>', {
                    rel: 'stylesheet',
                    type: 'text/css',
                    href: window.luknatorParams.css
                });
                cssLink.appendTo('head');
                window._luknator = new luknator($);
            }

        });
    };

    ////////////
    // Loader //
    ////////////
    var jQuery;
    if (window.jQuery === undefined || window.jQuery.fn.jquery !== '1.12.4') {

        var script_tag = document.createElement('script');

        script_tag.setAttribute('type', 'text/javascript');
        script_tag.setAttribute(
            'src',
            '//ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js'
        );

        if (script_tag.readyState) {
            script_tag.onreadystatechange = function() { // For old versions of IE
                if (this.readyState == 'complete' || this.readyState == 'loaded') {
                    scriptLoadHandler();
                }
            };
        } else {
            script_tag.onload = scriptLoadHandler;
        }
        (document.getElementsByTagName('head')[0] || document.documentElement).appendChild(script_tag);

    } else {
        jQuery = window.jQuery;
        main();
    }

    function scriptLoadHandler() {
        jQuery = window.jQuery.noConflict(true);
        main();
    };

})();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpxdWVyeS5qdWFyZXouanMiLCJsdWtuYXRvci1tdmMuanMiLCJsdWtuYXRvci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeCtCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibHVrbmF0b3IuanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgSnVhcmV6UGx1Z2luID0gZnVuY3Rpb24gKCQpIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgdmFyIG5hbWUgPSAnanVhcmV6JyxcbiAgICAgICAgc2xpZGVyU3RhdGUsXG4gICAgICAgIGRlZmF1bHRzID0ge1xuXG4gICAgICAgICAgICAvLyB7SW50IG9yIEJvb2x9IEZhbHNlIGZvciB0dXJuaW5nIG9mZiBhdXRvcGxheVxuICAgICAgICAgICAgYXV0b3BsYXk6IDcwMDAsXG4gICAgICAgICAgICAvLyB7Qm9vbH0gUGF1c2UgYXV0b3BsYXkgb24gbW91c2VvdmVyIHNsaWRlclxuICAgICAgICAgICAgaG92ZXJwYXVzZTogdHJ1ZSxcblxuICAgICAgICAgICAgLy8ge0Jvb2x9IENpcmN1YWwgcGxheVxuICAgICAgICAgICAgY2lyY3VsYXI6IHRydWUsXG5cbiAgICAgICAgICAgIC8vIHtJbnR9IEFuaW1hdGlvbiB0aW1lXG4gICAgICAgICAgICBhbmltYXRpb25EdXJhdGlvbjogNzAwLFxuICAgICAgICAgICAgLy8ge1N0cmluZ30gQW5pbWF0aW9uIGVhc2luZyBmdW5jdGlvblxuICAgICAgICAgICAgYW5pbWF0aW9uVGltaW5nRnVuYzogJ2N1YmljLWJlemllcigwLjE2NSwgMC44NDAsIDAuNDQwLCAxLjAwMCknLFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIHtCb29sIG9yIFN0cmluZ30gU2hvdy9oaWRlL2FwcGVuZFRvIGFycm93c1xuICAgICAgICAgICAgICogVHJ1ZSBmb3IgYXBwZW5kIGFycm93cyB0byBzbGlkZXIgd3JhcHBlclxuICAgICAgICAgICAgICogRmFsc2UgZm9yIG5vdCBhcHBlbmRpbmcgYXJyb3dzXG4gICAgICAgICAgICAgKiBJZCBvciBjbGFzcyBuYW1lIChlLmcuICcuY2xhc3MtbmFtZScpIGZvciBhcHBlbmRpbmcgdG8gc3BlY2lmaWMgSFRNTCBtYXJrdXBcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgYXJyb3dzOiB0cnVlLFxuICAgICAgICAgICAgLy8ge1N0cmluZ30gQXJyb3dzIHdyYXBwZXIgY2xhc3NcbiAgICAgICAgICAgIGFycm93c1dyYXBwZXJDbGFzczogJ3NsaWRlcl9fYXJyb3dzJyxcbiAgICAgICAgICAgIC8vIHtTdHJpbmd9IE1haW4gY2xhc3MgZm9yIGJvdGggYXJyb3dzXG4gICAgICAgICAgICBhcnJvd01haW5DbGFzczogJ3NsaWRlcl9fYXJyb3dzLWl0ZW0nLFxuICAgICAgICAgICAgLy8ge1N0cmluZ30gUmlnaHQgYXJyb3dcbiAgICAgICAgICAgIGFycm93UmlnaHRDbGFzczogJ3NsaWRlcl9fYXJyb3dzLWl0ZW0tLXJpZ2h0JyxcbiAgICAgICAgICAgIC8vIHtTdHJpbmd9IFJpZ2h0IGFycm93IHRleHRcbiAgICAgICAgICAgIGFycm93UmlnaHRUZXh0OiAnbmV4dCcsXG4gICAgICAgICAgICAvLyB7U3RyaW5nfSBMZWZ0IGFycm93XG4gICAgICAgICAgICBhcnJvd0xlZnRDbGFzczogJ3NsaWRlcl9fYXJyb3dzLWl0ZW0tLWxlZnQnLFxuICAgICAgICAgICAgLy8ge1N0cmluZ30gTGVmdCBhcnJvdyB0ZXh0XG4gICAgICAgICAgICBhcnJvd0xlZnRUZXh0OiAncHJldicsXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICoge0Jvb2wgb3IgU3RyaW5nfSBTaG93L2hpZGUvYXBwZW5kVG8gYnVsbGV0cyBuYXZpZ2F0aW9uXG4gICAgICAgICAgICAgKiBUcnVlIGZvciBhcHBlbmQgYXJyb3dzIHRvIHNsaWRlciB3cmFwcGVyXG4gICAgICAgICAgICAgKiBGYWxzZSBmb3Igbm90IGFwcGVuZGluZyBhcnJvd3NcbiAgICAgICAgICAgICAqIElkIG9yIGNsYXNzIG5hbWUgKGUuZy4gJy5jbGFzcy1uYW1lJykgZm9yIGFwcGVuZGluZyB0byBzcGVjaWZpYyBIVE1MIG1hcmt1cFxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBuYXZpZ2F0aW9uOiB0cnVlLFxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyB7SW50fX0gUGF1c2UgdGltZSBkdXJhdGlvbiBhZnRlciBtb3VzZSBob3ZlclxuICAgICAgICAgICAgcGF1c2VEdXJhdGlvbjogMzAwMDAsXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIHtCb29sfSBDZW50ZXIgYnVsbGV0IG5hdmlnYXRpb25cbiAgICAgICAgICAgIG5hdmlnYXRpb25DZW50ZXI6IHRydWUsXG4gICAgICAgICAgICAvLyB7U3RyaW5nfSBOYXZpZ2F0aW9uIGNsYXNzXG4gICAgICAgICAgICBuYXZpZ2F0aW9uQ2xhc3M6ICdzbGlkZXJfX25hdicsXG4gICAgICAgICAgICAvLyB7U3RyaW5nfSBOYXZpZ2F0aW9uIGl0ZW0gY2xhc3NcbiAgICAgICAgICAgIG5hdmlnYXRpb25JdGVtQ2xhc3M6ICdzbGlkZXJfX25hdi1pdGVtJyxcbiAgICAgICAgICAgIC8vIHtTdHJpbmd9IEN1cnJlbnQgbmF2aWdhdGlvbiBpdGVtIGNsYXNzXG4gICAgICAgICAgICBuYXZpZ2F0aW9uQ3VycmVudEl0ZW1DbGFzczogJ3NsaWRlcl9fbmF2LWl0ZW0tLWN1cnJlbnQnLFxuXG5cbiAgICAgICAgICAgIC8vIHtTdHJpbmd9IHNob3cgc2xpZGVyIGFmdGVyIGxvYWQgaW1hZ2VcbiAgICAgICAgICAgIHNsaWRlclZpc2libGVDbGFzczogJ3NsaWRlcl9fdmlzaWJsZScsXG5cbiAgICAgICAgICAgIC8vIHtCb29sfSBTbGlkZSBvbiBsZWZ0L3JpZ2h0IGtleWJvYXJkIGFycm93cyBwcmVzc1xuICAgICAgICAgICAga2V5Ym9hcmQ6IHRydWUsXG5cbiAgICAgICAgICAgIC8vIHtJbnQgb3IgQm9vbH0gVG91Y2ggc2V0dGluZ3NcbiAgICAgICAgICAgIHRvdWNoRGlzdGFuY2U6IDYwLFxuXG4gICAgICAgICAgICAvLyB7RnVuY3Rpb259IENhbGxiYWNrIGJlZm9yZSBwbHVnaW4gaW5pdFxuICAgICAgICAgICAgYmVmb3JlSW5pdDogZnVuY3Rpb24gKCkge30sXG4gICAgICAgICAgICAvLyB7RnVuY3Rpb259IENhbGxiYWNrIGFmdGVyIHBsdWdpbiBpbml0XG4gICAgICAgICAgICBhZnRlckluaXQ6IGZ1bmN0aW9uICgpIHt9LFxuXG4gICAgICAgICAgICAvLyB7RnVuY3Rpb259IENhbGxiYWNrIGJlZm9yZSBzbGlkZSBjaGFuZ2VcbiAgICAgICAgICAgIGJlZm9yZVRyYW5zaXRpb246IGZ1bmN0aW9uICgpIHt9LFxuICAgICAgICAgICAgLy8ge0Z1bmN0aW9ufSBDYWxsYmFjayBhZnRlciBzbGlkZSBjaGFuZ2VcbiAgICAgICAgICAgIGFmdGVyVHJhbnNpdGlvbjogZnVuY3Rpb24gKCkge31cblxuICAgICAgICB9O1xuXG4gICAgLyoqXG4gICAgICogU2xpZGVyIENvbnN0cnVjdG9yXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHBhcmVudFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gICAgICovXG4gICAgZnVuY3Rpb24gSnVhcmV6KHBhcmVudCwgb3B0aW9ucykge1xuXG4gICAgICAgIC8vIENhY2hlIHRoaXNcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIC8vIEV4dGVuZCBvcHRpb25zXG4gICAgICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBkZWZhdWx0cywgb3B0aW9ucyk7XG4gICAgICAgIC8vIEN1cnJlbnQgc2xpZGUgaWRcbiAgICAgICAgdGhpcy5jdXJyZW50U2xpZGUgPSAwO1xuICAgICAgICAvLyBJZiBDU1MzIFRyYW5zaXRpb24gaXNuJ3Qgc3VwcG9ydGVkIHN3aXRjaCBjc3NTdXBwb3J0IHZhcmlhYmxlIHRvIGZhbHNlIGFuZCB1c2UgJC5hbmltYXRlKClcbiAgICAgICAgdGhpcy5jc3NTdXBwb3J0ID0gKCF0aGlzLmNzcy5pc1N1cHBvcnRlZChcInRyYW5zaXRpb25cIikgfHwgIXRoaXMuY3NzLmlzU3VwcG9ydGVkKFwidHJhbnNmb3JtXCIpKSA/IGZhbHNlIDogdHJ1ZTtcbiAgICAgICAgLy8gSWYgY2lyY3VsYXIgc2V0IG9mZnNldCwgdHdvIGNsb25lZCBzbGlkZXNcbiAgICAgICAgdGhpcy5vZmZzZXQgPSAodGhpcy5vcHRpb25zLmNpcmN1bGFyKSA/IDIgOiAwO1xuXG4gICAgICAgIC8vIENhbGxiYWNrcyBiZWZvcmUgcGx1Z2luIGluaXRcbiAgICAgICAgdGhpcy5vcHRpb25zLmJlZm9yZUluaXQuY2FsbCh0aGlzKTtcblxuICAgICAgICAvLyBTaWRlYmFyXG4gICAgICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xuICAgICAgICAvLyBJbml0aWFsaXplXG4gICAgICAgIHRoaXMuaW5pdCgpO1xuICAgICAgICAvLyBTdGFydCBhdXRvcGxheVxuICAgICAgICB0aGlzLnBsYXkoKTtcblxuICAgICAgICAvLyBDYWxsYmFjayBhZnRlciBwbHVnaW4gaW5pdFxuICAgICAgICB0aGlzLm9wdGlvbnMuYWZ0ZXJJbml0LmNhbGwodGhpcyk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFQSVxuICAgICAgICAgKiBSZXR1cm5pbmcgc2xpZGVyIG1ldGhvZHNcbiAgICAgICAgICovXG4gICAgICAgIHJldHVybiB7XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogR2V0IGN1cnJlbnQgc2xpZGUgbnVtYmVyXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtJbnR9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGN1cnJlbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gLShzZWxmLmN1cnJlbnRTbGlkZSkgKyAxO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBSZWluaXRcbiAgICAgICAgICAgICAqIFJlYnVpbGQgYW5kIHJlY2FsY3VsYXRlIGRpbWVuc2lvbnMgb2Ygc2xpZGVyIGVsZW1lbnRzXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHJlaW5pdDogZnVuY3Rpb24gKGpzb24pIHtcbiAgICAgICAgICAgICAgICBzZWxmLmluaXQoanNvbik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBEZXN0cm95XG4gICAgICAgICAgICAgKiBSZXZlcnQgaW5pdCBtb2RpZmljYXRpb25zIGFuZCBmcmVlemUgc2xpZGVzXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGRlc3Ryb3k6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogU3RhcnQgYXV0b3BsYXlcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgcGxheTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChzbGlkZXJTdGF0ZSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnBsYXkoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFN0b3AgYXV0b3BsYXlcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgcGF1c2U6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2xpZGVyU3RhdGUgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYucGF1c2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFNsaWRlIG9uZSBmb3J3YXJkXG4gICAgICAgICAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgbmV4dDogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5zbGlkZSgxLCBmYWxzZSwgY2FsbGJhY2spO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBTbGlkZSBvbmUgYmFja3dhcmRcbiAgICAgICAgICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjYWxsYmFja1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBwcmV2OiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBzZWxmLnNsaWRlKC0xLCBmYWxzZSwgY2FsbGJhY2spO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBKdW1wIHRvIHNwZWNpZmVkIHNsaWRlXG4gICAgICAgICAgICAgKiBAcGFyYW0gIHtJbnR9IGRpc3RhbmNlXG4gICAgICAgICAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAganVtcDogZnVuY3Rpb24gKGRpc3RhbmNlLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIHNlbGYuc2xpZGUoZGlzdGFuY2UgLSAxLCB0cnVlLCBjYWxsYmFjayk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEFwcGVuZCBuYXZpZ2F0aW9uIHRvIHNwZWNpZmV0IHRhcmdldFxuICAgICAgICAgICAgICogQHBhcmFtICB7TWl4ZWR9IHRhcmdldFxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBuYXY6IGZ1bmN0aW9uICh0YXJnZXQpIHtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIElmIG5hdmlnYXRpb24gd3JhcHBlciBhbHJlYWR5IGV4aXN0XG4gICAgICAgICAgICAgICAgICogUmVtb3ZlIGl0LCBwcm90ZWN0aW9uIGJlZm9yZSBkb3VibGVkIG5hdmlnYXRpb25cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBpZiAoc2VsZi5uYXZpZ2F0aW9uLndyYXBwZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5uYXZpZ2F0aW9uLndyYXBwZXIucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIFdoaWxlIHRhcmdldCBpc24ndCBzcGVjaWZlZCwgdXNlIHNsaWRlciB3cmFwcGVyXG4gICAgICAgICAgICAgICAgc2VsZi5vcHRpb25zLm5hdmlnYXRpb24gPSAodGFyZ2V0KSA/IHRhcmdldCA6IHNlbGYub3B0aW9ucy5uYXZpZ2F0aW9uO1xuICAgICAgICAgICAgICAgIC8vIEJ1aWxkXG4gICAgICAgICAgICAgICAgc2VsZi5uYXZpZ2F0aW9uKCk7XG5cbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQXBwZW5kIGFycm93cyB0byBzcGVjaWZldCB0YXJnZXRcbiAgICAgICAgICAgICAqIEBwYXJhbSAge01peGVkfSB0YXJnZXRcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgYXJyb3dzOiBmdW5jdGlvbiAodGFyZ2V0KSB7XG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBJZiBhcnJvd3Mgd3JhcHBlciBhbHJlYWR5IGV4aXN0XG4gICAgICAgICAgICAgICAgICogUmVtb3ZlIGl0LCBwcm90ZWN0aW9uIGJlZm9yZSBkb3VibGVkIGFycm93c1xuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLmFycm93cy53cmFwcGVyKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuYXJyb3dzLndyYXBwZXIucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gV2hpbGUgdGFyZ2V0IGlzbid0IHNwZWNpZmVkLCB1c2Ugc2xpZGVyIHdyYXBwZXJcbiAgICAgICAgICAgICAgICBzZWxmLm9wdGlvbnMuYXJyb3dzID0gKHRhcmdldCkgPyB0YXJnZXQgOiBzZWxmLm9wdGlvbnMuYXJyb3dzO1xuICAgICAgICAgICAgICAgIC8vIEJ1aWxkXG4gICAgICAgICAgICAgICAgc2VsZi5hcnJvd3MoKTtcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH07XG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBCdWlsZGluZyBzbGlkZXJcbiAgICAgKi9cbiAgICBKdWFyZXoucHJvdG90eXBlLmJ1aWxkID0gZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBdHRhdGNoIGJpbmRpbmdzXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmJpbmRpbmdzKCk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZXJlIGlzIG1vcmUgdGhhbiBvbmUgc2xpZGVcbiAgICAgICAgICovXG4gICAgICAgIGlmICh0aGlzLnNsaWRlcy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIENpcmN1bGFyXG4gICAgICAgICAgICAgKiBJZiBjaXJjdWxhciBvcHRpb24gaXMgdHJ1ZVxuICAgICAgICAgICAgICogQXBwZW5kIGxlZnQgYW5kIHJpZ2h0IGFycm93XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuY2lyY3VsYXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNpcmN1bGFyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEFycm93c1xuICAgICAgICAgICAgICogSWYgYXJyb3dzIG9wdGlvbiBpcyB0cnVlXG4gICAgICAgICAgICAgKiBBcHBlbmQgbGVmdCBhbmQgcmlnaHQgYXJyb3dcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5hcnJvd3MpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFycm93cygpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIE5hdmlnYXRpb25cbiAgICAgICAgICAgICAqIElmIG5hdmlnYXRpb24gb3B0aW9uIGlzIHRydWVcbiAgICAgICAgICAgICAqIEFwcGVuZCBuYXZpZ2F0aW9uIGl0ZW0gZm9yIGVhY2ggc2xpZGVcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5uYXZpZ2F0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5uYXZpZ2F0aW9uKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogQXR0YXRjaCBldmVudHNcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuZXZlbnRzKCk7XG5cbiAgICB9O1xuICAgIC8qKlxuICAgICAqIEJ1aWxkIGNpcmN1bGFyIERPTSBlbGVtZW50c1xuICAgICAqIENsb25lIGZpcnN0IGFuZCBsYXN0IHNsaWRlXG4gICAgICogU2V0IHdyYXBwZXIgd2lkdGggd2l0aCBhZGRpb25hbCBzbGlkZXNcbiAgICAgKiBNb3ZlIHNsaWRlciB3cmFwcGVyIHRvIGZpcnN0IHNsaWRlXG4gICAgICovXG4gICAgSnVhcmV6LnByb3RvdHlwZS5jaXJjdWxhciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIENsb25lIGZpcnN0IGFuZCBsYXN0IHNsaWRlXG4gICAgICAgICAqIGFuZCBzZXQgd2lkdGggZm9yIGVhY2hcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuZmlyc3RDbG9uZSA9IHRoaXMuc2xpZGVzLmZpbHRlcignOmZpcnN0LWNoaWxkJykuY2xvbmUoKS53aWR0aCh0aGlzLnNsaWRlcy5zcHJlYWQpO1xuICAgICAgICB0aGlzLmxhc3RDbG9uZSA9IHRoaXMuc2xpZGVzLmZpbHRlcignOmxhc3QtY2hpbGQnKS5jbG9uZSgpLndpZHRoKHRoaXMuc2xpZGVzLnNwcmVhZCk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFwcGVuZCBjbG9kZXMgc2xpZGVzIHRvIHNsaWRlciB3cmFwcGVyIGF0IHRoZSBiZWdpbm5pbmcgYW5kIGVuZFxuICAgICAgICAgKiBJbmNyZWFzZSB3cmFwcGVyIHdpdGggd2l0aCB2YWx1ZXMgb2YgYWRkaW9uYWwgc2xpZGVzXG4gICAgICAgICAqIENsZWFyIHRyYW5zbGF0ZSBhbmQgc2tpcCBjbG9uZWQgbGFzdCBzbGlkZSBhdCB0aGUgYmVnaW5uaW5nXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLndyYXBwZXIuYXBwZW5kKHRoaXMuZmlyc3RDbG9uZSkucHJlcGVuZCh0aGlzLmxhc3RDbG9uZSkud2lkdGgodGhpcy5wYXJlbnQud2lkdGgoKSAqICh0aGlzLnNsaWRlcy5sZW5ndGggKyAyKSlcbiAgICAgICAgICAgIC50cmlnZ2VyKCdjbGVhclRyYW5zaXRpb24nKVxuICAgICAgICAgICAgICAgIC50cmlnZ2VyKCdzZXRUcmFuc2xhdGUnLCBbLXRoaXMuc2xpZGVzLnNwcmVhZF0pO1xuXG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEJ1aWxkaW5nIG5hdmlnYXRpb24gRE9NXG4gICAgICovXG4gICAgSnVhcmV6LnByb3RvdHlwZS5uYXZpZ2F0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgaTtcbiAgICAgICAgdGhpcy5uYXZpZ2F0aW9uLml0ZW1zID0ge307XG5cbiAgICAgICAgLy8gTmF2aWdhdGlvbiB3cmFwcGVyXG4gICAgICAgIHRoaXMubmF2aWdhdGlvbi53cmFwcGVyID0gJCgnPGRpdiAvPicsIHtcbiAgICAgICAgICAgICdjbGFzcyc6IHRoaXMub3B0aW9ucy5uYXZpZ2F0aW9uQ2xhc3NcbiAgICAgICAgfSkuYXBwZW5kVG8oXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFNldHRpbmcgYXBwZW5kIHRhcmdldFxuICAgICAgICAgICAgICogSWYgb3B0aW9uIGlzIHRydWUgc2V0IGRlZmF1bHQgdGFyZ2V0LCB0aGF0IGlzIHNsaWRlciB3cmFwcGVyXG4gICAgICAgICAgICAgKiBFbHNlIGdldCB0YXJnZXQgc2V0IGluIG9wdGlvbnNcbiAgICAgICAgICAgICAqIEB0eXBlIHtCb29sIG9yIFN0cmluZ31cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgKHRoaXMub3B0aW9ucy5uYXZpZ2F0aW9uID09PSB0cnVlKSA/IHRoaXMucGFyZW50IDogdGhpcy5vcHRpb25zLm5hdmlnYXRpb25cbiAgICAgICAgKTtcbiAgICAgICAgXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLnNsaWRlcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgdGhpcy5uYXZpZ2F0aW9uLml0ZW1zW2ldID0gJCgnPGEgLz4nLCB7XG4gICAgICAgICAgICAgICAgJ2hyZWYnOiAnIycsXG4gICAgICAgICAgICAgICAgJ2NsYXNzJzogdGhpcy5vcHRpb25zLm5hdmlnYXRpb25JdGVtQ2xhc3MsXG4gICAgICAgICAgICAgICAgLy8gRGlyZWN0aW9uIGFuZCBkaXN0YW5jZSAtPiBJdGVtIGluZGV4IGZvcndhcmRcbiAgICAgICAgICAgICAgICAnZGF0YS1kaXN0YW5jZSc6IGlcbiAgICAgICAgICAgIH0pLmFwcGVuZFRvKHRoaXMubmF2aWdhdGlvbi53cmFwcGVyKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIC8qSGVyZSBJIHRyeSBtYWtlIHRoaXMgbW9yZSBzZW1hbnRpY1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMuc2xpZGVzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5uYXZpZ2F0aW9uLml0ZW1zW2ldID0gJCgnPGxpIC8+JykuYXBwZW5kVG8odGhpcy5uYXZpZ2F0aW9uLndyYXBwZXIpO1xuICAgICAgICAgICAgICAgIHRoaXMubmF2aWdhdGlvbi5pdGVtc1tpXS5hcHBlbmQoJChcIjxhIC8+XCIsIHtcbiAgICAgICAgICAgICAgICAgICAgJ2hyZWYnOiAnIycsXG4gICAgICAgICAgICAgICAgICAgICdjbGFzcyc6IHRoaXMub3B0aW9ucy5uYXZpZ2F0aW9uSXRlbUNsYXNzLFxuICAgICAgICAgICAgICAgICAgICAvLyBEaXJlY3Rpb24gYW5kIGRpc3RhbmNlIC0+IEl0ZW0gaW5kZXggZm9yd2FyZFxuICAgICAgICAgICAgICAgICAgICAnZGF0YS1kaXN0YW5jZSc6IGlcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICovXG4gICAgICAgIFxuICAgICAgICAvLyBBZGQgbmF2Q3VycmVudEl0ZW1DbGFzcyB0byB0aGUgZmlyc3QgbmF2aWdhdGlvbiBpdGVtXG4gICAgICAgIHRoaXMubmF2aWdhdGlvbi5pdGVtc1swXS5hZGRDbGFzcyh0aGlzLm9wdGlvbnMubmF2aWdhdGlvbkN1cnJlbnRJdGVtQ2xhc3MpO1xuXG4gICAgICAgIC8vIElmIGNlbnRlcmVkIG9wdGlvbiBpcyB0cnVlXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMubmF2aWdhdGlvbkNlbnRlcikge1xuICAgICAgICAgICAgLy8gQ2VudGVyIGJ1bGxldCBuYXZpZ2F0aW9uXG4gICAgICAgICAgICB0aGlzLm5hdmlnYXRpb24ud3JhcHBlci5jc3Moe1xuICAgICAgICAgICAgICAgICdsZWZ0JzogJzUwJScsXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzogdGhpcy5uYXZpZ2F0aW9uLndyYXBwZXIuY2hpbGRyZW4oKS5vdXRlcldpZHRoKHRydWUpICogdGhpcy5uYXZpZ2F0aW9uLndyYXBwZXIuY2hpbGRyZW4oKS5sZW5ndGgsXG4gICAgICAgICAgICAgICAgJ21hcmdpbi1sZWZ0JzogLSh0aGlzLm5hdmlnYXRpb24ud3JhcHBlci5vdXRlcldpZHRoKHRydWUpIC8gMilcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICB9O1xuICAgICAgICAvKipcbiAgICAgKiBCdWlsZGluZyBhcnJvd3MgRE9NXG4gICAgICovXG4gICAgSnVhcmV6LnByb3RvdHlwZS5hcnJvd3MgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFycm93cyB3cmFwcGVyXG4gICAgICAgICAqIEB0eXBlIHtPYmVqY3R9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmFycm93cy53cmFwcGVyID0gJCgnPGRpdiAvPicsIHtcbiAgICAgICAgICAgICdjbGFzcyc6IHRoaXMub3B0aW9ucy5hcnJvd3NXcmFwcGVyQ2xhc3NcbiAgICAgICAgfSkuYXBwZW5kVG8oXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFNldHRpbmcgYXBwZW5kIHRhcmdldFxuICAgICAgICAgICAgICogSWYgb3B0aW9uIGlzIHRydWUgc2V0IGRlZmF1bHQgdGFyZ2V0LCB0aGF0IGlzIHNsaWRlciB3cmFwcGVyXG4gICAgICAgICAgICAgKiBFbHNlIGdldCB0YXJnZXQgc2V0IGluIG9wdGlvbnNcbiAgICAgICAgICAgICAqIEB0eXBlIHtCb29sIG9yIFN0cmluZ31cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgKHRoaXMub3B0aW9ucy5hcnJvd3MgPT09IHRydWUpID8gdGhpcy5wYXJlbnQgOiB0aGlzLm9wdGlvbnMuYXJyb3dzXG4gICAgICAgICk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJpZ2h0IGFycm93XG4gICAgICAgICAqIEB0eXBlIHtPYmVqY3R9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmFycm93cy5yaWdodCA9ICQoJzxkaXYgLz4nLCB7XG4gICAgICAgICAgICAnY2xhc3MnOiB0aGlzLm9wdGlvbnMuYXJyb3dNYWluQ2xhc3MgKyAnICcgKyB0aGlzLm9wdGlvbnMuYXJyb3dSaWdodENsYXNzLFxuICAgICAgICAgICAgLy8gRGlyZWN0aW9uIGFuZCBkaXN0YW5jZSAtPiBPbmUgZm9yd2FyZFxuICAgICAgICAgICAgJ2RhdGEtZGlzdGFuY2UnOiAnMScsXG4gICAgICAgICAgICAnaHRtbCc6IHRoaXMub3B0aW9ucy5hcnJvd1JpZ2h0VGV4dFxuICAgICAgICB9KS5hcHBlbmRUbyh0aGlzLmFycm93cy53cmFwcGVyKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogTGVmdCBhcnJvd1xuICAgICAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5hcnJvd3MubGVmdCA9ICQoJzxkaXYgLz4nLCB7XG4gICAgICAgICAgICAnY2xhc3MnOiB0aGlzLm9wdGlvbnMuYXJyb3dNYWluQ2xhc3MgKyAnICcgKyB0aGlzLm9wdGlvbnMuYXJyb3dMZWZ0Q2xhc3MsXG4gICAgICAgICAgICAvLyBEaXJlY3Rpb24gYW5kIGRpc3RhbmNlIC0+IE9uZSBiYWNrd2FyZFxuICAgICAgICAgICAgJ2RhdGEtZGlzdGFuY2UnOiAnLTEnLFxuICAgICAgICAgICAgJ2h0bWwnOiB0aGlzLm9wdGlvbnMuYXJyb3dMZWZ0VGV4dFxuICAgICAgICB9KS5hcHBlbmRUbyh0aGlzLmFycm93cy53cmFwcGVyKTtcblxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBGdW5jdGlvbiBiaW5kaW5nc1xuICAgICAqL1xuICAgIEp1YXJlei5wcm90b3R5cGUuYmluZGluZ3MgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxuICAgICAgICAgICAgbyA9IHRoaXMub3B0aW9ucyxcbiAgICAgICAgICAgIHByZWZpeCA9IHRoaXMuY3NzLmdldFByZWZpeCgpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZXR1cCBzbGlkZXIgd3JhcHBlciBiaW5kaW5nc1xuICAgICAgICAgKiBmb3IgdHJhbnNsYXRlIGFuZCB0cmFuc2l0aW9uIGNvbnRyb2xcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMud3JhcHBlci5iaW5kKHtcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBTZXQgdHJhbnNpdGlvblxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICAnc2V0VHJhbnNpdGlvbic6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmNzcyggcHJlZml4ICsgJ3RyYW5zaXRpb24nLCBwcmVmaXggKyAndHJhbnNmb3JtICcgKyBvLmFuaW1hdGlvbkR1cmF0aW9uICsgJ21zICcgKyBvLmFuaW1hdGlvblRpbWluZ0Z1bmMpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBDbGVhciB0cmFuc2l0aW9uXG4gICAgICAgICAgICAgKiBmb3IgaW1tZWRpYXRlIGp1bXAgZWZmZWN0XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICdjbGVhclRyYW5zaXRpb24nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgJCh0aGlzKS5jc3MoIHByZWZpeCArICd0cmFuc2l0aW9uJywgJ25vbmUnKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogU2V0IHRyYW5zbGF0ZSB2YWx1ZVxuICAgICAgICAgICAgICogQHBhcmFtICB7T2JqZWN0fSBldmVudFxuICAgICAgICAgICAgICogQHBhcmFtICB7SW5kfSB0cmFuc2xhdGVcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgJ3NldFRyYW5zbGF0ZSc6IGZ1bmN0aW9uKGV2ZW50LCB0cmFuc2xhdGUpIHtcbiAgICAgICAgICAgICAgICAvLyBpZiBjc3MzIHN1cG9ydGVkIHNldCB0cmFuc2xhdGUzZFxuICAgICAgICAgICAgICAgIGlmIChzZWxmLmNzc1N1cHBvcnQpICQodGhpcykuY3NzKCBwcmVmaXggKyAndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZTNkKCcgKyB0cmFuc2xhdGUgKyAncHgsIDBweCwgMHB4KScpO1xuICAgICAgICAgICAgICAgIC8vIGlmIG5vdCBzZXQgbGVmdCBtYXJnaW5cbiAgICAgICAgICAgICAgICBlbHNlICQodGhpcykuY3NzKCdtYXJnaW4tbGVmdCcsIHRyYW5zbGF0ZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSk7XG5cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogRXZlbnRzIGNvbnRyb2xsZXJzXG4gICAgICovXG4gICAgSnVhcmV6LnByb3RvdHlwZS5ldmVudHMgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFN3aXBlXG4gICAgICAgICAqIElmIHN3aXBlIG9wdGlvbiBpcyB0cnVlXG4gICAgICAgICAqIEF0dGFjaCB0b3VjaCBldmVudHNcbiAgICAgICAgICovXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMudG91Y2hEaXN0YW5jZSkge1xuICAgICAgICAgICAgdGhpcy5wYXJlbnQub24oe1xuICAgICAgICAgICAgICAgICd0b3VjaHN0YXJ0IE1TUG9pbnRlckRvd24nOiAkLnByb3h5KHRoaXMuZXZlbnRzLnRvdWNoc3RhcnQsIHRoaXMpLFxuICAgICAgICAgICAgICAgICd0b3VjaG1vdmUgTVNQb2ludGVyTW92ZSc6ICQucHJveHkodGhpcy5ldmVudHMudG91Y2htb3ZlLCB0aGlzKSxcbiAgICAgICAgICAgICAgICAndG91Y2hlbmQgTVNQb2ludGVyVXAnOiAkLnByb3h5KHRoaXMuZXZlbnRzLnRvdWNoZW5kLCB0aGlzKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogQXJyb3dzXG4gICAgICAgICAqIElmIGFycm93cyBleGlzdHNcbiAgICAgICAgICogQXR0YWNoIGNsaWNrIGV2ZW50XG4gICAgICAgICAqL1xuICAgICAgICBpZiAodGhpcy5hcnJvd3Mud3JhcHBlcikge1xuICAgICAgICAgICAgJCh0aGlzLmFycm93cy53cmFwcGVyKS5jaGlsZHJlbigpLm9uKCdjbGljayB0b3VjaHN0YXJ0JyxcbiAgICAgICAgICAgICAgICAkLnByb3h5KHRoaXMuZXZlbnRzLmFycm93cywgdGhpcylcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogTmF2aWdhdGlvblxuICAgICAgICAgKiBJZiBuYXZpZ2F0aW9uIGV4aXN0c1xuICAgICAgICAgKiBBdHRhY2ggY2xpY2sgZXZlbnRcbiAgICAgICAgICovXG4gICAgICAgIGlmICh0aGlzLm5hdmlnYXRpb24ud3JhcHBlcikge1xuICAgICAgICAgICAgJCh0aGlzLm5hdmlnYXRpb24ud3JhcHBlcikuY2hpbGRyZW4oKS5vbignY2xpY2sgdG91Y2hzdGFydCcsXG4gICAgICAgICAgICAgICAgJC5wcm94eSh0aGlzLmV2ZW50cy5uYXZpZ2F0aW9uLCB0aGlzKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBLZXlib2FyZFxuICAgICAgICAgKiBJZiBrZXlib2FyZCBvcHRpb24gaXMgdHJ1ZVxuICAgICAgICAgKiBBdHRhY2ggcHJlc3MgZXZlbnRcbiAgICAgICAgICovXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMua2V5Ym9hcmQpIHtcbiAgICAgICAgICAgICQoZG9jdW1lbnQpLm9uKCdrZXl1cC5qdWFyZXpLZXl1cCcsXG4gICAgICAgICAgICAgICAgJC5wcm94eSh0aGlzLmV2ZW50cy5rZXlib2FyZCwgdGhpcylcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogU2xpZGVyIGhvdmVyXG4gICAgICAgICAqIElmIGhvdmVyIG9wdGlvbiBpcyB0cnVlXG4gICAgICAgICAqIEF0dGFjaCBob3ZlciBldmVudFxuICAgICAgICAgKi9cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5ob3ZlcnBhdXNlKSB7XG4gICAgICAgICAgICB0aGlzLnBhcmVudC5vbignbW91c2VvdmVyIG1vdXNlb3V0JyxcbiAgICAgICAgICAgICAgICAkLnByb3h5KHRoaXMuZXZlbnRzLmhvdmVyLCB0aGlzKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTbGlkZXIgcmVzaXplXG4gICAgICAgICAqIE9uIHdpbmRvdyByZXNpemVcbiAgICAgICAgICogQXR0YWNoIHJlc2l6ZSBldmVudFxuICAgICAgICAgKi9cbiAgICAgICAgJCh3aW5kb3cpLm9uKCdyZXNpemUnLFxuICAgICAgICAgICAgJC5wcm94eSh0aGlzLmV2ZW50cy5yZXNpemUsIHRoaXMpXG4gICAgICAgICk7XG5cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogTmF2aWdhdGlvbiBldmVudCBjb250cm9sbGVyXG4gICAgICogT24gY2xpY2sgaW4gbmF2aWdhdGlvbiBpdGVtIGdldCBkaXN0YW5jZVxuICAgICAqIFRoZW4gc2xpZGUgc3BlY2lmaWVkIGRpc3RhbmNlIHdpdGgganVtcFxuICAgICAqL1xuICAgIEp1YXJlei5wcm90b3R5cGUuZXZlbnRzLm5hdmlnYXRpb24gPSBmdW5jdGlvbiAoZXZlbnQpIHtcblxuICAgICAgICBpZiAoIXRoaXMud3JhcHBlci5hdHRyKCdkaXNhYmxlZCcpKSB7XG4gICAgICAgICAgICAvLyBQcmV2ZW50IGRlZmF1bHQgYmVoYXZpb3VyXG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgLy8gU2xpZGUgZGlzdGFuY2Ugc3BlY2lmaWVkIGluIGRhdGEgYXR0cmlidXRlXG4gICAgICAgICAgICB0aGlzLnNsaWRlKCQoZXZlbnQuY3VycmVudFRhcmdldCkuZGF0YSgnZGlzdGFuY2UnKSwgdHJ1ZSk7XG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBBcnJvd3MgZXZlbnQgY29udHJvbGxlclxuICAgICAqIE9uIGNsaWNrIGluIGFycm93cyBnZXQgZGlyZWN0aW9uIGFuZCBkaXN0YW5jZVxuICAgICAqIFRoZW4gc2xpZGUgc3BlY2lmaWVkIGRpc3RhbmNlIHdpdGhvdXQganVtcFxuICAgICAqIEBwYXJhbSAge09iZWpjdH0gZXZlbnRcbiAgICAgKi9cbiAgICBKdWFyZXoucHJvdG90eXBlLmV2ZW50cy5hcnJvd3MgPSBmdW5jdGlvbiAoZXZlbnQpIHtcblxuICAgICAgICBpZiAoIXRoaXMud3JhcHBlci5hdHRyKCdkaXNhYmxlZCcpKSB7XG4gICAgICAgICAgICAvLyBQcmV2ZW50IGRlZmF1bHQgYmVoYXZpb3VyXG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgLy8gU2xpZGUgZGlzdGFuY2Ugc3BlY2lmaWVkIGluIGRhdGEgYXR0cmlidXRlXG4gICAgICAgICAgICB0aGlzLnNsaWRlKCQoZXZlbnQuY3VycmVudFRhcmdldCkuZGF0YSgnZGlzdGFuY2UnKSwgZmFsc2UpO1xuICAgICAgICB9XG5cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogS2V5Ym9hcmQgYXJyb3dzIGV2ZW50IGNvbnRyb2xsZXJcbiAgICAgKiBLZXlib2FyZCBsZWZ0IGFuZCByaWdodCBhcnJvdyBrZXlzIHByZXNzXG4gICAgICovXG4gICAgSnVhcmV6LnByb3RvdHlwZS5ldmVudHMua2V5Ym9hcmQgPSBmdW5jdGlvbiAoZXZlbnQpIHtcblxuICAgICAgICBpZiAoIXRoaXMud3JhcHBlci5hdHRyKCdkaXNhYmxlZCcpKSB7XG4gICAgICAgICAgICAvLyBOZXh0XG4gICAgICAgICAgICBpZiAoZXZlbnQua2V5Q29kZSA9PT0gMzkpIHRoaXMuc2xpZGUoMSk7XG4gICAgICAgICAgICAvLyBQcmV2XG4gICAgICAgICAgICBpZiAoZXZlbnQua2V5Q29kZSA9PT0gMzcpIHRoaXMuc2xpZGUoLTEpO1xuICAgICAgICB9XG5cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogV2hlbiBtb3VzZSBpcyBvdmVyIHNsaWRlciwgcGF1c2UgYXV0b3BsYXlcbiAgICAgKiBPbiBvdXQsIHN0YXJ0IGF1dG9wbGF5IGFnYWluXG4gICAgICovXG4gICAgSnVhcmV6LnByb3RvdHlwZS5ldmVudHMuaG92ZXIgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIHRpbWU7XG4gICAgICAgIC8vIFBhdXNlIGF1dG9wbGF5XG4gICAgICAgIHRoaXMucGF1c2UoKTtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIC8vIFdoZW4gbW91c2UgbGVmdCBzbGlkZXIgb3IgdG91Y2ggZW5kLCBzdGFydCBhdXRvcGxheSBhbmV3XG4gICAgICAgIGlmIChldmVudC50eXBlID09PSAnbW91c2VvdXQnKSB7XG4gICAgICAgICAgICBzZWxmLnBsYXkoKTtcbiAgICAgICAgfVxuXG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFdoZW4gcmVzaXplIGJyb3dzZXIgd2luZG93XG4gICAgICogUmVpbml0IHBsdWdpbiBmb3IgbmV3IHNsaWRlciBkaW1lbnNpb25zXG4gICAgICogQ29ycmVjdCBjcm9wIHRvIGN1cnJlbnQgc2xpZGVcbiAgICAgKi9cbiAgICBKdWFyZXoucHJvdG90eXBlLmV2ZW50cy5yZXNpemUgPSBmdW5jdGlvbiAoZXZlbnQpIHtcblxuICAgICAgICAvLyBSZWluaXQgcGx1Z2luIChzZXQgbmV3IHNsaWRlciBkaW1lbnNpb25zKVxuICAgICAgICB0aGlzLmRpbWVuc2lvbnMoKTtcbiAgICAgICAgLy8gQ3JvcCB0byBjdXJyZW50IHNsaWRlXG4gICAgICAgIHRoaXMuc2xpZGUoMCk7XG5cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogRGlzYWJsZSBldmVudHMgdGhhdHMgY29udHJvbHMgc2xpZGUgY2hhbmdlc1xuICAgICAqL1xuICAgIEp1YXJlei5wcm90b3R5cGUuZGlzYWJsZUV2ZW50cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy53cmFwcGVyLmF0dHIoXCJkaXNhYmxlZFwiLCB0cnVlKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogRW5hYmxlIGV2ZW50cyB0aGF0cyBjb250cm9scyBzbGlkZSBjaGFuZ2VzXG4gICAgICovXG4gICAgSnVhcmV6LnByb3RvdHlwZS5lbmFibGVFdmVudHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMud3JhcHBlci5hdHRyKFwiZGlzYWJsZWRcIiwgZmFsc2UpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAqIFRvdWNoIHN0YXJ0XG4gICAgKiBAcGFyYW0gIHtPYmplY3R9IGUgZXZlbnRcbiAgICAqL1xuICAgIEp1YXJlei5wcm90b3R5cGUuZXZlbnRzLnRvdWNoc3RhcnQgPSBmdW5jdGlvbiAoZXZlbnQpIHtcblxuICAgICAgICBpZiAoIXRoaXMud3JhcHBlci5hdHRyKCdkaXNhYmxlZCcpKSB7XG4gICAgICAgICAgICAvLyBDYWNoZSBldmVudFxuICAgICAgICAgICAgdmFyIHRvdWNoID0gZXZlbnQub3JpZ2luYWxFdmVudC50b3VjaGVzWzBdIHx8IGV2ZW50Lm9yaWdpbmFsRXZlbnQuY2hhbmdlZFRvdWNoZXNbMF07XG5cbiAgICAgICAgICAgIC8vIEdldCB0b3VjaCBzdGFydCBwb2ludHNcbiAgICAgICAgICAgIHRoaXMuZXZlbnRzLnRvdWNoU3RhcnRYID0gdG91Y2gucGFnZVg7XG4gICAgICAgICAgICB0aGlzLmV2ZW50cy50b3VjaFN0YXJ0WSA9IHRvdWNoLnBhZ2VZO1xuICAgICAgICAgICAgdGhpcy5ldmVudHMudG91Y2hTaW4gPSBudWxsO1xuICAgICAgICB9XG5cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgKiBUb3VjaCBtb3ZlXG4gICAgKiBGcm9tIHN3aXBlIGxlbmd0aCBzZWdtZW50cyBjYWxjdWxhdGUgc3dpcGUgYW5nbGVcbiAgICAqIEBwYXJhbSAge09iZWpjdH0gZSBldmVudFxuICAgICovXG4gICAgSnVhcmV6LnByb3RvdHlwZS5ldmVudHMudG91Y2htb3ZlID0gZnVuY3Rpb24gKGV2ZW50KSB7XG5cbiAgICAgICAgaWYgKCF0aGlzLndyYXBwZXIuYXR0cignZGlzYWJsZWQnKSkge1xuICAgICAgICAgICAgLy8gQ2FjaGUgZXZlbnRcbiAgICAgICAgICAgIHZhciB0b3VjaCA9IGV2ZW50Lm9yaWdpbmFsRXZlbnQudG91Y2hlc1swXSB8fCBldmVudC5vcmlnaW5hbEV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdO1xuXG4gICAgICAgICAgICAvLyBDYWxjdWxhdGUgc3RhcnQsIGVuZCBwb2ludHNcbiAgICAgICAgICAgIHZhciBzdWJFeFN4ID0gdG91Y2gucGFnZVggLSB0aGlzLmV2ZW50cy50b3VjaFN0YXJ0WDtcbiAgICAgICAgICAgIHZhciBzdWJFeVN5ID0gdG91Y2gucGFnZVkgLSB0aGlzLmV2ZW50cy50b3VjaFN0YXJ0WTtcbiAgICAgICAgICAgIC8vIEJpdHdpc2Ugc3ViRXhTeCBwb3dcbiAgICAgICAgICAgIHZhciBwb3dFWCA9IE1hdGguYWJzKCBzdWJFeFN4IDw8IDIgKTtcbiAgICAgICAgICAgIC8vIEJpdHdpc2Ugc3ViRXlTeSBwb3dcbiAgICAgICAgICAgIHZhciBwb3dFWSA9IE1hdGguYWJzKCBzdWJFeVN5IDw8IDIgKTtcbiAgICAgICAgICAgIC8vIENhbGN1bGF0ZSB0aGUgbGVuZ3RoIG9mIHRoZSBoeXBvdGVudXNlIHNlZ21lbnRcbiAgICAgICAgICAgIHZhciB0b3VjaEh5cG90ZW51c2UgPSBNYXRoLnNxcnQoIHBvd0VYICsgcG93RVkgKTtcbiAgICAgICAgICAgIC8vIENhbGN1bGF0ZSB0aGUgbGVuZ3RoIG9mIHRoZSBjYXRoZXR1cyBzZWdtZW50XG4gICAgICAgICAgICB2YXIgdG91Y2hDYXRoZXR1cyA9IE1hdGguc3FydCggcG93RVkgKTtcblxuICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBzaW5lIG9mIHRoZSBhbmdsZVxuICAgICAgICAgICAgdGhpcy5ldmVudHMudG91Y2hTaW4gPSBNYXRoLmFzaW4odG91Y2hDYXRoZXR1cyAvIHRvdWNoSHlwb3RlbnVzZSk7XG5cbiAgICAgICAgICAgIGlmICggKHRoaXMuZXZlbnRzLnRvdWNoU2luICogKDE4MCAvIE1hdGguUEkpKSA8IDQ1ICkgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfVxuXG4gICAgfTtcblxuICAgIC8qKlxuICAgICogVG91Y2ggZW5kXG4gICAgKiBAcGFyYW0gIHtPYmplY3R9IGUgZXZlbnRcbiAgICAqL1xuICAgIEp1YXJlei5wcm90b3R5cGUuZXZlbnRzLnRvdWNoZW5kID0gZnVuY3Rpb24gKGV2ZW50KSB7XG5cbiAgICAgICAgaWYgKCAhdGhpcy53cmFwcGVyLmF0dHIoJ2Rpc2FibGVkJykgKSB7XG4gICAgICAgICAgICAvLyBDYWNoZSBldmVudFxuICAgICAgICAgICAgdmFyIHRvdWNoID0gZXZlbnQub3JpZ2luYWxFdmVudC50b3VjaGVzWzBdIHx8IGV2ZW50Lm9yaWdpbmFsRXZlbnQuY2hhbmdlZFRvdWNoZXNbMF07XG5cbiAgICAgICAgICAgIC8vIENhbGN1bGF0ZSB0b3VjaCBkaXN0YW5jZVxuICAgICAgICAgICAgdmFyIHRvdWNoRGlzdGFuY2UgPSB0b3VjaC5wYWdlWCAtIHRoaXMuZXZlbnRzLnRvdWNoU3RhcnRYO1xuXG4gICAgICAgICAgICAvLyBXaGlsZSB0b3VjaCBpcyBwb3NpdGl2ZSBhbmQgZ3JlYXRlciB0aGFuIGRpc3RhbmNlIHNldCBpbiBvcHRpb25zXG4gICAgICAgICAgICBpZiAoICh0b3VjaERpc3RhbmNlID4gdGhpcy5vcHRpb25zLnRvdWNoRGlzdGFuY2UpICYmICggKHRoaXMuZXZlbnRzLnRvdWNoU2luICogKDE4MCAvIE1hdGguUEkpKSA8IDQ1KSApIHtcbiAgICAgICAgICAgICAgICAvLyBTbGlkZSBvbmUgYmFja3dhcmRcbiAgICAgICAgICAgICAgICB0aGlzLnNsaWRlKC0xKTtcbiAgICAgICAgICAgIC8vIFdoaWxlIHRvdWNoIGlzIG5lZ2F0aXZlIGFuZCBsb3dlciB0aGFuIG5lZ2F0aXZlIGRpc3RhbmNlIHNldCBpbiBvcHRpb25zXG4gICAgICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgICAgICh0b3VjaERpc3RhbmNlIDwgLXRoaXMub3B0aW9ucy50b3VjaERpc3RhbmNlKSAmJiAoICh0aGlzLmV2ZW50cy50b3VjaFNpbiAqICgxODAgLyBNYXRoLlBJKSkgPCA0NSkgKSB7XG4gICAgICAgICAgICAgICAgLy8gU2xpZGUgb25lIGZvcndhcmRcbiAgICAgICAgICAgICAgICB0aGlzLnNsaWRlKDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogU2xpZGVzIGNoYW5nZSAmIGFuaW1hdGUgbG9naWNcbiAgICAgKiBAcGFyYW0gIHtpbnR9IGRpc3RhbmNlXG4gICAgICogQHBhcmFtICB7Ym9vbH0ganVtcFxuICAgICAqIEBwYXJhbSAge2Z1bmN0aW9ufSBjYWxsYmFja1xuICAgICAqL1xuICAgIEp1YXJlei5wcm90b3R5cGUuc2xpZGUgPSBmdW5jdGlvbihkaXN0YW5jZSwganVtcCwgY2FsbGJhY2spIHtcblxuICAgICAgICAvLyBJZiB0aGVyZSBpcyBvbmUgc2xpZGUsIGVzY2FwZVxuICAgICAgICBpZiAodGhpcy5zbGlkZXMubGVuZ3RoIDw9IDEpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTdG9wIGF1dG9wbGF5XG4gICAgICAgICAqIENsZWFyaW5nIHRpbWVyXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnBhdXNlKCk7XG5cbiAgICAgICAgLy8gQ2FsbGJhY2tzIGJlZm9yZSBzbGlkZSBjaGFuZ2VcbiAgICAgICAgdGhpcy5vcHRpb25zLmJlZm9yZVRyYW5zaXRpb24uY2FsbCh0aGlzKTtcblxuICAgICAgICAvLyBTZXR1cCB2YXJpYWJsZXNcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxuICAgICAgICAgICAgY3VycmVudFNsaWRlID0gKGp1bXApID8gMCA6IHRoaXMuY3VycmVudFNsaWRlLFxuICAgICAgICAgICAgc2xpZGVzTGVuZ3RoID0gLSh0aGlzLnNsaWRlcy5sZW5ndGgtMSksXG4gICAgICAgICAgICBmcm9tRmlyc3QgPSBmYWxzZSxcbiAgICAgICAgICAgIGZyb21MYXN0ID0gZmFsc2U7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENoZWNrIGlmIGN1cnJlbnQgc2xpZGUgaXMgZmlyc3QgYW5kIGRpcmVjdGlvbiBpcyBwcmV2aW91cywgdGhlbiBnbyB0byBsYXN0IHNsaWRlXG4gICAgICAgICAqIG9yIGN1cnJlbnQgc2xpZGUgaXMgbGFzdCBhbmQgZGlyZWN0aW9uIGlzIG5leHQsIHRoZW4gZ28gdG8gdGhlIGZpcnN0IHNsaWRlXG4gICAgICAgICAqIGVsc2UgY2hhbmdlIGN1cnJlbnQgc2xpZGUgbm9ybWFsbHlcbiAgICAgICAgICovXG4gICAgICAgIGlmICggY3VycmVudFNsaWRlID09PSAwICYmIGRpc3RhbmNlID09PSAtMSApIHtcbiAgICAgICAgICAgIGZyb21GaXJzdCA9IHRydWU7XG4gICAgICAgICAgICBjdXJyZW50U2xpZGUgPSBzbGlkZXNMZW5ndGg7XG4gICAgICAgIH0gZWxzZSBpZiAoIGN1cnJlbnRTbGlkZSA9PT0gc2xpZGVzTGVuZ3RoICYmIGRpc3RhbmNlID09PSAxICkge1xuICAgICAgICAgICAgZnJvbUxhc3QgPSB0cnVlO1xuICAgICAgICAgICAgY3VycmVudFNsaWRlID0gMDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGN1cnJlbnRTbGlkZSA9IGN1cnJlbnRTbGlkZSArICgtZGlzdGFuY2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENyb3AgdG8gY3VycmVudCBzbGlkZS5cbiAgICAgICAgICogTXVsIHNsaWRlIHdpZHRoIGJ5IGN1cnJlbnQgc2xpZGUgbnVtYmVyLlxuICAgICAgICAgKi9cbiAgICAgICAgdmFyIG9mZnNldCA9IHRoaXMuc2xpZGVzLnNwcmVhZCAqIGN1cnJlbnRTbGlkZTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogV2hpbGUgY2lyY3VsYXIgZGVjcmVhc2Ugb2Zmc2V0IHdpdGggdGhlIHdpZHRoIG9mIHNpbmdsZSBzbGlkZVxuICAgICAgICAgKiBXaGVuIGZyb21GaXJzdCBhbmQgZnJvbUxhc3QgZmxhZ3MgYXJlIHNldCwgdW5iaW5kIGV2ZW50cyB0aGF0cyBjb250cm9scyBjaGFuZ2luZ1xuICAgICAgICAgKiBXaGVuIGZyb21MYXN0IGZsYWdzIGlzIHNldCwgc2V0IG9mZnNldCB0byBzbGlkZSB3aWR0aCBtdWxsZWQgYnkgc2xpZGVzIGNvdW50IHdpdGhvdXQgY2xvbmVkIHNsaWRlc1xuICAgICAgICAgKiBXaGVuIGZyb21GaXJzdCBmbGFncyBpcyBzZXQsIHNldCBvZmZzZXQgdG8gemVyb1xuICAgICAgICAgKi9cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5jaXJjdWxhcikge1xuICAgICAgICAgICAgb2Zmc2V0ID0gb2Zmc2V0IC0gdGhpcy5zbGlkZXMuc3ByZWFkO1xuICAgICAgICAgICAgaWYgKGZyb21MYXN0IHx8IGZyb21GaXJzdCkgdGhpcy5kaXNhYmxlRXZlbnRzKCk7XG4gICAgICAgICAgICBpZiAoZnJvbUxhc3QpIG9mZnNldCA9IHRoaXMuc2xpZGVzLnNwcmVhZCAqIChzbGlkZXNMZW5ndGggLSAyKTtcbiAgICAgICAgICAgIGlmIChmcm9tRmlyc3QpIG9mZnNldCA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogU2xpZGUgY2hhbmdlIGFuaW1hdGlvblxuICAgICAgICAgKiBXaGlsZSBDU1MzIGlzIHN1cHBvcnRlZCB1c2Ugb2Zmc2V0XG4gICAgICAgICAqIGlmIG5vdCwgdXNlICQuYW5pbWF0ZSgpO1xuICAgICAgICAgKi9cbiAgICAgICAgaWYgKHRoaXMuY3NzU3VwcG9ydCkgdGhpcy53cmFwcGVyLnRyaWdnZXIoJ3NldFRyYW5zaXRpb24nKS50cmlnZ2VyKCdzZXRUcmFuc2xhdGUnLCBbb2Zmc2V0XSk7XG4gICAgICAgIGVsc2UgdGhpcy53cmFwcGVyLnN0b3AoKS5hbmltYXRlKHsgJ21hcmdpbi1sZWZ0Jzogb2Zmc2V0IH0sIHRoaXMub3B0aW9ucy5hbmltYXRpb25EdXJhdGlvbik7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFdoaWxlIGNpcmN1bGFyXG4gICAgICAgICAqL1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmNpcmN1bGFyKSB7XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogXHRXaGVuIGZyb21GaXJzdCBhbmQgZnJvbUxhc3QgZmxhZ3MgYXJlIHNldFxuICAgICAgICAgICAgICogXHRhZnRlciBhbmltYXRpb24gY2xlYXIgdHJhbnNpdGlvbiBhbmQgYmluZCBldmVudHMgdGhhdCBjb250cm9sIHNsaWRlcyBjaGFuZ2luZ1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBpZiAoZnJvbUZpcnN0IHx8IGZyb21MYXN0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hZnRlckFuaW1hdGlvbihmdW5jdGlvbiAoKXtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi53cmFwcGVyLnRyaWdnZXIoJ2NsZWFyVHJhbnNpdGlvbicpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmVuYWJsZUV2ZW50cygpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFdoZW4gZnJvbUxhc3QgZmxhZyBpcyBzZXRcbiAgICAgICAgICAgICAqIGFmdGVyIGFuaW1hdGlvbiBtYWtlIGltbWVkaWF0ZSBqdW1wIGZyb20gY2xvbmVkIHNsaWRlIHRvIHByb3BlciBvbmVcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgaWYgKGZyb21MYXN0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hZnRlckFuaW1hdGlvbihmdW5jdGlvbiAoKXtcbiAgICAgICAgICAgICAgICAgICAgZnJvbUxhc3QgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi53cmFwcGVyLnRyaWdnZXIoJ3NldFRyYW5zbGF0ZScsIFstc2VsZi5zbGlkZXMuc3ByZWFkXSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogV2hlbiBmcm9tRmlyc3QgZmxhZyBpcyBzZXRcbiAgICAgICAgICAgICAqIGFmdGVyIGFuaW1hdGlvbiBtYWtlIGltbWVkaWF0ZSBqdW1wIGZyb20gY2xvbmVkIHNsaWRlIHRvIHByb3BlciBvbmVcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgaWYgKGZyb21GaXJzdCkge1xuICAgICAgICAgICAgICAgIHRoaXMuYWZ0ZXJBbmltYXRpb24oZnVuY3Rpb24gKCl7XG4gICAgICAgICAgICAgICAgICAgIGZyb21GaXJzdCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLndyYXBwZXIudHJpZ2dlcignc2V0VHJhbnNsYXRlJywgW3NlbGYuc2xpZGVzLnNwcmVhZCAqIChzbGlkZXNMZW5ndGgtMSldKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2V0IHRvIG5hdmlnYXRpb24gaXRlbSBjdXJyZW50IGNsYXNzXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMubmF2aWdhdGlvbiAmJiB0aGlzLm5hdmlnYXRpb24ud3JhcHBlcikge1xuICAgICAgICAgICAgJCgnLicgKyB0aGlzLm9wdGlvbnMubmF2aWdhdGlvbkNsYXNzLCAodGhpcy5vcHRpb25zLm5hdmlnYXRpb24gPT09IHRydWUpID8gdGhpcy5wYXJlbnQgOiB0aGlzLm9wdGlvbnMubmF2aWdhdGlvbikuY2hpbGRyZW4oKVxuICAgICAgICAgICAgICAgIC5lcSgtY3VycmVudFNsaWRlKVxuICAgICAgICAgICAgICAgICAgICAuYWRkQ2xhc3ModGhpcy5vcHRpb25zLm5hdmlnYXRpb25DdXJyZW50SXRlbUNsYXNzKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnNpYmxpbmdzKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3ModGhpcy5vcHRpb25zLm5hdmlnYXRpb25DdXJyZW50SXRlbUNsYXNzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFVwZGF0ZSBjdXJyZW50IHNsaWRlIGdsb2JhbHlcbiAgICAgICAgdGhpcy5jdXJyZW50U2xpZGUgPSBjdXJyZW50U2xpZGU7XG5cbiAgICAgICAgLy8gQ2FsbGJhY2tzIGFmdGVyIHNsaWRlIGNoYW5nZVxuICAgICAgICB0aGlzLmFmdGVyQW5pbWF0aW9uKGZ1bmN0aW9uICgpe1xuICAgICAgICAgICAgc2VsZi5vcHRpb25zLmFmdGVyVHJhbnNpdGlvbi5jYWxsKHNlbGYpO1xuICAgICAgICAgICAgaWYgKCAoY2FsbGJhY2sgIT09ICd1bmRlZmluZWQnKSAmJiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSApIGNhbGxiYWNrKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTdGFydCBhdXRvcGxheVxuICAgICAgICAgKiBTZXR0aW5nIHVwIHRpbWVyXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnBsYXkoKTtcblxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBBdXRvcGxheSBsb2dpY1xuICAgICAqIFNldHVwIGNvdW50aW5nXG4gICAgICovXG4gICAgSnVhcmV6LnByb3RvdHlwZS5wbGF5ID0gZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIC8vIENhY2hlIHRoaXNcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJZiBhdXRvcGxheSB0dXJuIG9uXG4gICAgICAgICAqIFNsaWRlIG9uZSBmb3J3YXJkIGFmdGVyIGEgc2V0IHRpbWVcbiAgICAgICAgICovXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYXV0b3BsYXkpIHtcbiAgICAgICAgICAgIHRoaXMuYXV0byA9IHNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBzZWxmLnNsaWRlKDEsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBzbGlkZXJTdGF0ZSA9IHRydWU7XG4gICAgICAgICAgICB9LCB0aGlzLm9wdGlvbnMuYXV0b3BsYXkpO1xuXG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBBdXRvcGxheSBwYXVzZVxuICAgICAqIENsZWFyIGNvdW50aW5nXG4gICAgICovXG4gICAgSnVhcmV6LnByb3RvdHlwZS5wYXVzZSA9IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAvKipcbiAgICAgICAgICogSWYgYXV0b3BsYXkgdHVybiBvblxuICAgICAgICAgKiBDbGVhciBpbnRlcmlhbFxuICAgICAgICAgKi9cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5hdXRvcGxheSkgeyBcbiAgICAgICAgICAgIHRoaXMuYXV0byA9IGNsZWFySW50ZXJ2YWwodGhpcy5hdXRvKTsgXG4gICAgICAgICAgICBzbGlkZXJTdGF0ZSA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQ2FsbCBjYWxsYmFjayBhZnRlciBhbmltYXRpb24gZHVyYXRpb25cbiAgICAgKiBBZGRlZCAxMCBtcyB0byBkdXJhdGlvbiB0byBiZSBzdXJlIGlzIGZpcmVkIGFmdGVyIGFuaW1hdGlvblxuICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjYWxsYmFja1xuICAgICAqL1xuICAgIEp1YXJlei5wcm90b3R5cGUuYWZ0ZXJBbmltYXRpb24gPSBmdW5jdGlvbihjYWxsYmFjaykge1xuXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCl7XG4gICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICB9LCB0aGlzLm9wdGlvbnMuYW5pbWF0aW9uRHVyYXRpb24gKyAxMCk7XG5cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogRGltZW5zaW9uc1xuICAgICAqIEdldCAmIHNldCBkaW1lbnNpb25zIG9mIHNsaWRlciBlbGVtZW50c1xuICAgICAqL1xuICAgIEp1YXJlei5wcm90b3R5cGUuZGltZW5zaW9ucyA9IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAvLyBHZXQgc2xpZGUgd2lkdGhcbiAgICAgICAgdGhpcy5zbGlkZXMuc3ByZWFkID0gdGhpcy5wYXJlbnQud2lkdGgoKTtcbiAgICAgICAgLy8gU2V0IHdyYXBwZXIgd2lkdGhcbiAgICAgICAgdGhpcy53cmFwcGVyLndpZHRoKHRoaXMuc2xpZGVzLnNwcmVhZCAqICh0aGlzLnNsaWRlcy5sZW5ndGggKyB0aGlzLm9mZnNldCkpO1xuICAgICAgICAvLyBTZXQgc2xpZGUgd2lkdGhcbiAgICAgICAgdGhpcy5zbGlkZXMuYWRkKHRoaXMuZmlyc3RDbG9uZSkuYWRkKHRoaXMubGFzdENsb25lKS53aWR0aCh0aGlzLnNsaWRlcy5zcHJlYWQpO1xuXG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIERlc3Ryb3lcbiAgICAgKiBSZXZlcnQgaW5pdCBtb2RpZmljYXRpb25zIGFuZCBmcmVlemUgc2xpZGVzXG4gICAgICovXG4gICAgSnVhcmV6LnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIHRoaXMucGFyZW50LnVuYmluZCgpO1xuICAgICAgICB0aGlzLndyYXBwZXIudW5iaW5kKCk7XG4gICAgICAgIHRoaXMud3JhcHBlci5yZW1vdmVBdHRyKFwic3R5bGVcIik7XG4gICAgICAgICQodGhpcy5uYXZpZ2F0aW9uLndyYXBwZXIpLmNoaWxkcmVuKCkudW5iaW5kKCk7XG4gICAgICAgICQodGhpcy5hcnJvd3Mud3JhcHBlcikuY2hpbGRyZW4oKS51bmJpbmQoKTtcbiAgICAgICAgdGhpcy5zbGlkZSgwLCB0cnVlKTtcbiAgICAgICAgdGhpcy5wYXVzZSgpO1xuXG4gICAgICAgIGlmKHRoaXMub3B0aW9ucy5jaXJjdWxhcikge1xuICAgICAgICAgICAgdGhpcy5maXJzdENsb25lLnJlbW92ZSgpO1xuICAgICAgICAgICAgdGhpcy5sYXN0Q2xvbmUucmVtb3ZlKCk7XG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplXG4gICAgICogU2V0IHdyYXBwZXJcbiAgICAgKiBTZXQgc2xpZGVzXG4gICAgICogU2V0IGFuaW1hdGlvbiB0eXBlXG4gICAgICovXG4gICAgSnVhcmV6LnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLndyYXBwZXIgPSB0aGlzLnBhcmVudC5jaGlsZHJlbigpO1xuICAgICAgICAvLyBTZXQgc2xpZGVzXG4gICAgICAgIHRoaXMuc2xpZGVzID0gdGhpcy53cmFwcGVyLmNoaWxkcmVuKCk7XG4gICAgICAgIC8vIFNldCBzbGlkZXIgZGltZW50aW9uc1xuICAgICAgICB0aGlzLmRpbWVuc2lvbnMoKTtcbiAgICAgICAgLy8gQnVpbGQgRE9NXG4gICAgICAgIHRoaXMuYnVpbGQoKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogTWV0aG9kcyBmb3IgY3NzMyBtYW5hZ2VtZW50XG4gICAgICovXG4gICAgSnVhcmV6LnByb3RvdHlwZS5jc3MgPSB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENoZWNrIGNzczMgc3VwcG9ydFxuICAgICAgICAgKiBAcGFyYW0gIHtTdHJpbmd9ICBEZWNsYXJhdGlvbiBuYW1lIHRvIGNoZWNrXG4gICAgICAgICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAgICAgICAqL1xuICAgICAgICBpc1N1cHBvcnRlZDogZnVuY3Rpb24oZGVjbGFyYXRpb24pIHtcblxuICAgICAgICAgICAgdmFyIGlzU3VwcG9ydGVkID0gZmFsc2UsXG4gICAgICAgICAgICAgICAgcHJlZml4ZXMgPSAnS2h0bWwgbXMgTyBNb3ogV2Via2l0Jy5zcGxpdCgnICcpLFxuICAgICAgICAgICAgICAgIGNsb25lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG4gICAgICAgICAgICAgICAgZGVjbGFyYXRpb25DYXBpdGFsID0gbnVsbDtcblxuICAgICAgICAgICAgZGVjbGFyYXRpb24gPSBkZWNsYXJhdGlvbi50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgaWYgKGNsb25lLnN0eWxlW2RlY2xhcmF0aW9uXSAhPT0gdW5kZWZpbmVkKSBpc1N1cHBvcnRlZCA9IHRydWU7XG4gICAgICAgICAgICBpZiAoaXNTdXBwb3J0ZWQgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgZGVjbGFyYXRpb25DYXBpdGFsID0gZGVjbGFyYXRpb24uY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBkZWNsYXJhdGlvbi5zdWJzdHIoMSk7XG4gICAgICAgICAgICAgICAgZm9yKCB2YXIgaSA9IDA7IGkgPCBwcmVmaXhlcy5sZW5ndGg7IGkrKyApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYoIGNsb25lLnN0eWxlW3ByZWZpeGVzW2ldICsgZGVjbGFyYXRpb25DYXBpdGFsIF0gIT09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzU3VwcG9ydGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAod2luZG93Lm9wZXJhKSB7XG4gICAgICAgICAgICAgICAgaWYgKHdpbmRvdy5vcGVyYS52ZXJzaW9uKCkgPCAxMykgaXNTdXBwb3J0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGlzU3VwcG9ydGVkID09PSAndW5kZWZpbmVkJyB8fCBpc1N1cHBvcnRlZCA9PT0gdW5kZWZpbmVkKSBpc1N1cHBvcnRlZCA9IGZhbHNlO1xuXG4gICAgICAgICAgICByZXR1cm4gaXNTdXBwb3J0ZWQ7XG5cbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IGJyb3dzZXIgY3NzIHByZWZpeFxuICAgICAgICAgKiBAcmV0dXJuIHtTdHJpbmd9IFx0UmV0dXJucyBwcmVmaXggaW4gXCIte3ByZWZpeH0tXCIgZm9ybWF0XG4gICAgICAgICAqL1xuICAgICAgICBnZXRQcmVmaXg6IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgICAgaWYgKCF3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSkgcmV0dXJuICcnO1xuXG4gICAgICAgICAgICB2YXIgc3R5bGVzID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCAnJyk7XG4gICAgICAgICAgICByZXR1cm4gJy0nICsgKEFycmF5LnByb3RvdHlwZS5zbGljZVxuICAgICAgICAgICAgICAgIC5jYWxsKHN0eWxlcylcbiAgICAgICAgICAgICAgICAuam9pbignJylcbiAgICAgICAgICAgICAgICAubWF0Y2goLy0obW96fHdlYmtpdHxtcyktLykgfHwgKHN0eWxlcy5PTGluayA9PT0gJycgJiYgWycnLCAnbyddKVxuICAgICAgICAgICAgKVsxXSArICctJztcblxuICAgICAgICB9XG5cbiAgICB9O1xuXG4gICAgJC5mbltuYW1lXSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoICEkLmRhdGEodGhpcywgJycpICkge1xuICAgICAgICAgICAgICAgICQuZGF0YSh0aGlzLCAnJywgbmV3IEp1YXJleigkKHRoaXMpLCBvcHRpb25zKSApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuXG59O1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgbHVrbmF0b3IgPSBmdW5jdGlvbigkKSB7XG4gICAgICAgIHRoaXMuJCA9ICQ7XG4gICAgICAgIHRoaXMuY29uZmlndXJlKCk7XG4gICAgICAgIHRoaXMuYnVpbGQoKTtcbiAgICB9O1xuXG4gICAgdmFyIGlzTW9iaWxlID0gL0FuZHJvaWR8d2ViT1N8aVBob25lfGlQYWR8aVBvZHxCbGFja0JlcnJ5fElFTW9iaWxlfE9wZXJhIE1pbmkvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpO1xuXG4gICAgbHVrbmF0b3IucHJvdG90eXBlLmNvbmZpZ3VyZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmNvbnZlcnNhdGlvbklkID0gbnVsbDtcbiAgICAgICAgdGhpcy53YWl0aW5nUmVzcG9uc2UgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pbml0R29vZ2xlTWFwcygpO1xuXG4gICAgICAgIHZhciBwYXJhbXMgPSB3aW5kb3cubHVrbmF0b3JQYXJhbXM7XG4gICAgICAgIGlmICh0eXBlb2YgcGFyYW1zID09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICB0aGlzLnVybCA9IHBhcmFtcy51cmw7XG4gICAgICAgICAgICB0aGlzLmJ0X2Nsb3NlID0gcGFyYW1zLmJ0X2Nsb3NlO1xuICAgICAgICAgICAgdGhpcy5idF9zZW5kID0gcGFyYW1zLmJ0X3NlbmQ7XG4gICAgICAgICAgICB0aGlzLmJvdF9jb2luID0gcGFyYW1zLmJvdF9jb2luO1xuICAgICAgICAgICAgdGhpcy5ib3RfYnViYmxlID0gcGFyYW1zLmJvdF9idWJibGU7XG4gICAgICAgICAgICB0aGlzLnRpdGxlID0gcGFyYW1zLnRpdGxlO1xuXHQgICAgdGhpcy50YWdDYWxsYmFjayA9IHBhcmFtcy50YWdDYWxsYmFjaztcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBsdWtuYXRvci5wcm90b3R5cGUuaW5pdEdvb2dsZU1hcHMgPSBmdW5jdGlvbihhY3Rpb24pIHtcblxuICAgICAgICB3aW5kb3cuaW5pdE1hcCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgd2luZG93Lmdvb2dsZU1hcHNJbml0aWFsaXplZCA9IHRydWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy4kKCdoZWFkJykuYXBwZW5kKFxuICAgICAgICAgICAgJzxzY3JpcHQgYXN5bmMgZGVmZXIgJyArXG4gICAgICAgICAgICAnc3JjPVwiaHR0cHM6Ly9tYXBzLmdvb2dsZWFwaXMuY29tL21hcHMvYXBpL2pzP2tleT1BSXphU3lDdjZzSG5sM3lzdGM3SjJ0TXBFVFVTLS0tdU91dkxGQmcmY2FsbGJhY2s9aW5pdE1hcFwiPicgK1xuICAgICAgICAgICAgJzwvc2NyaXB0PidcbiAgICAgICAgKTtcbiAgICB9O1xuXG4gICAgbHVrbmF0b3IucHJvdG90eXBlLmJ1aWxkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vLy8vLy8vLy8vLy8vLy8vXG4gICAgICAgIC8vIENIQU5HRSBUSElTIC8vXG4gICAgICAgIHZhciBob2x5SFRNTCA9ICc8ZGl2IGNsYXNzPVwiYm94LWhlYWRlclwiPjxkaXYgY2xhc3M9XCJ0aXRsZVwiPjxoMj4nICsgdGhpcy50aXRsZSArICc8L2gyPjwvZGl2PjxkaXYgY2xhc3M9XCJjbG9zZS1idXR0b25cIj48aSBjbGFzcz1cImNsb3NlIHN2Zy1jbG9zZS1jaGF0XCIgc3R5bGU9XCJjdXJzb3I6cG9pbnRlclwiPjwvaT48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVwiYm94LWNvbnRlbnRcIj48ZGl2IGNsYXNzPVwiYm94LWFsZXJ0XCI+PC9kaXY+PGRpdiBjbGFzcz1cImNoYXQtY29udGVudFwiPjxkaXYgY2xhc3M9XCJjaGF0LWl0ZW0gYm90XCI+PGRpdiBjbGFzcz1cImJveC1vcHRpb25zXCIvPjwvZGl2PjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XCJib3gtZm9vdGVyXCI+PGRpdiBjbGFzcz1cImZvcm0tYXJlYVwiPjxkaXYgY2xhc3M9XCJib3gtaW5wdXRcIj48ZGl2IGNsYXNzPVwiaW5wdXQtd3JhcHBlclwiPjxidXR0b24gaWQ9XCJzdWJtaXRjaGF0XCIgY2xhc3M9XCJzdWJtaXQtY2hhdFwiPjwvYnV0dG9uPjxpbnB1dCBjbGFzcz1cInVzZXItaW5wdXRcIiB0eXBlPVwidGV4dFwiIGRhdGEtZW1vamlhYmxlPVwidHJ1ZVwiIHBsYWNlaG9sZGVyPVwiRXNjcmV2YSBzdWEgbWVuc2FnZW0uLi5cIj48L2Rpdj48L2Rpdj48L2Rpdj48L2Rpdj4nO1xuICAgICAgICAvLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgICAgIHZhciBjaGF0V2lkZ2V0ID0gdGhpcy4kKCc8ZGl2Lz4nLCB7XG4gICAgICAgICAgICAnaWQnOiAnY2hhdC13aWRnZXQnLFxuICAgICAgICAgICAgJ2NsYXNzJzogJ3VzZXJjaGF0LXVpIG91dCdcbiAgICAgICAgfSk7XG4gICAgICAgIGNoYXRXaWRnZXQuaHRtbChob2x5SFRNTCk7XG5cbiAgICAgICAgLy8gQ29pblxuICAgICAgICB2YXIgY29pbkRpdiA9IHRoaXMuJCgnPGRpdi8+Jywge1xuICAgICAgICAgICAgJ2lkJzogJ2NoYXQtY29pbi1pY29uJ1xuICAgICAgICB9KTtcbiAgICAgICAgdmFyIGNvaW5Db250YWluZXIgPSB0aGlzLiQoJzxkaXYvPicsIHtcbiAgICAgICAgICAgICdjbGFzcyc6ICdhdmF0YXItY29udGFpbmVyJ1xuICAgICAgICB9KTtcbiAgICAgICAgdmFyIGNvaW5JbWcgPSB0aGlzLiQoJzxpbWcvPicsIHtcbiAgICAgICAgICAgICdzcmMnOiB0aGlzLmJvdF9jb2luLFxuICAgICAgICAgICAgJ2RyYWdnYWJsZSc6ICdmYWxzZSdcbiAgICAgICAgfSk7XG4gICAgICAgIGNvaW5Db250YWluZXIuYXBwZW5kKGNvaW5JbWcpO1xuICAgICAgICBjb2luRGl2LmFwcGVuZChjb2luQ29udGFpbmVyKTtcblxuICAgICAgICB0aGlzLiQoJ2x1a25hdG9yLWNvbnRhaW5lcicpLmFwcGVuZChjaGF0V2lkZ2V0KTtcbiAgICAgICAgdGhpcy4kKCdsdWtuYXRvci1jb250YWluZXInKS5hcHBlbmQoY29pbkRpdik7XG5cbiAgICAgICAgLy8gQnV0dG9uIENsb3NlXG4gICAgICAgIHRoaXMuJCgnLmJveC1oZWFkZXIgLmNsb3NlLWJ1dHRvbicpLmNzcyhcbiAgICAgICAgICAgICdiYWNrZ3JvdW5kJyxcbiAgICAgICAgICAgICd1cmwoJyArIHRoaXMuYnRfY2xvc2UgKyAnKSdcbiAgICAgICAgKTtcblxuICAgICAgICAvLyBCdXR0b24gU2VuZFxuICAgICAgICB0aGlzLiQoJy5zdWJtaXQtY2hhdCcpLmNzcyhcbiAgICAgICAgICAgICdiYWNrZ3JvdW5kLWltYWdlJyxcbiAgICAgICAgICAgICd1cmwoJyArIHRoaXMuYnRfc2VuZCArICcpJ1xuICAgICAgICApO1xuXG4gICAgICAgIHRoaXMuYmluZCgpO1xuXG4gICAgICAgIHZhciB1cmxQYXJhbXMgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKHdpbmRvdy5sb2NhdGlvbi5zZWFyY2gpO1xuICAgICAgICB2YXIgb3BlbkNoYXQgPSB1cmxQYXJhbXMuZ2V0KCdvcGVuQ2hhdCcpO1xuXG4gICAgICAgIGlmIChvcGVuQ2hhdCkge1xuICAgICAgICAgICAgJCgnI2NoYXQtY29pbi1pY29uJykuY2xpY2soKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBsdWtuYXRvci5wcm90b3R5cGUuYmluZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaGlkZV9hbGVydF9kZWxheSA9IDYwMDAwO1xuXG4gICAgICAgIC8vQmluZCBJbnB1dFxuICAgICAgICB0aGlzLiQoJy51c2VyLWlucHV0JykuZm9jdXNpbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuJCgnI2NoYXQtY29pbi1pY29uJykuYWRkQ2xhc3MoJ291dCcpO1xuICAgICAgICAgICAgdGhpcy4kKCcjY2hhdC13aWRnZXQnKS5hZGRDbGFzcygnZnVsbCcpO1xuICAgICAgICB9LmJpbmQodGhpcykpO1xuXG4gICAgICAgIC8vIEJpbmQgQ29pblxuICAgICAgICB0aGlzLiQoJyNjaGF0LWNvaW4taWNvbicpLm9mZigpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gdmVyaWZ5IGNvb2tpZXNcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlQ29va2llVXNlclVuaXF1ZSgpO1xuXG4gICAgICAgICAgICAvLyByZW1vdmUgbWVzc2FnZVxuICAgICAgICAgICAgaWYgKCQoJy5ib3gtYWxlcnQnKS5sZW5ndGgpe1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgJCgnLmJveC1hbGVydCcpLnNsaWRlVXAoIFwic2xvd1wiLCBmdW5jdGlvbigpeyAkKHRoaXMpLnJlbW92ZSgpO30pO1xuICAgICAgICAgICAgICAgIH0sIGhpZGVfYWxlcnRfZGVsYXkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhpcy4kKCcjY2hhdC13aWRnZXQnKS5oYXNDbGFzcygnb3V0JykgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWx1a25hdG9yLmNvbnZlcnNhdGlvbklkICYmICF0aGlzLndhaXRpbmdSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLndhaXRpbmdSZXNwb25zZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuJC5hamF4KHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vZGU6ICdjb3JzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybDogdGhpcy51cmxcbiAgICAgICAgICAgICAgICAgICAgfSkuZG9uZShmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRNZXNzYWdlQW5kQWxlcnQocmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgfS5iaW5kKHRoaXMpKVxuICAgICAgICAgICAgICAgICAgICAuZmFpbChmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdC5yZXNwb25zZUpTT047XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldE1lc3NhZ2VBbmRBbGVydChyZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuJCgnI2NoYXQtd2lkZ2V0JykucmVtb3ZlQ2xhc3MoJ291dCcpO1xuICAgICAgICAgICAgICAgICAgICBpZihpc01vYmlsZSkgeyB0aGlzLiQoJ2h0bWwnKS5jc3MoXCJvdmVyZmxvd1wiLCBcImhpZGRlblwiKTsgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy4kKCcjY2hhdC13aWRnZXQnKS5hZGRDbGFzcygnb3V0Jyk7XG4gICAgICAgICAgICAgICAgICBpZihpc01vYmlsZSkgeyB0aGlzLiQoJ2h0bWwnKS5jc3MoXCJvdmVyZmxvd1wiLCBcImF1dG9cIik7IH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgICBcbiAgICAgICAgLy8gQmluZCBDbG9zZVxuICAgICAgICB0aGlzLiQoJyNjaGF0LXdpZGdldCAuY2xvc2UtYnV0dG9uJykub2ZmKCkub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLiQoJyNjaGF0LWNvaW4taWNvbicpLnJlbW92ZUNsYXNzKCdvdXQnKTtcbiAgICAgICAgICAgIHRoaXMuJCgnI2NoYXQtd2lkZ2V0JykuYWRkQ2xhc3MoJ291dCcpO1xuICAgICAgICAgICAgdGhpcy4kKCcjY2hhdC13aWRnZXQnKS5yZW1vdmVDbGFzcygnZnVsbCcpO1xuICAgICAgICAgICAgaWYoaXNNb2JpbGUpIHsgdGhpcy4kKCdodG1sJykucmVtb3ZlQ2xhc3MoJ2ktYW1waHRtbC1zY3JvbGwtZGlzYWJsZWQnKTsgfVxuICAgICAgICB9LmJpbmQodGhpcykpO1xuXG4gICAgICAgIC8vIEJpbmQgQ2xpY2sgU3VibWl0XG4gICAgICAgIHRoaXMuJCgnI2NoYXQtd2lkZ2V0IC5zdWJtaXQtY2hhdCcpLm9mZigpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICB0aGlzLmNsZWFuTWVzc2FnZSgpO1xuICAgICAgICAgICAgXG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG5cblxuICAgICAgICAvLyBCaW5kIHRleHQgQXJlYVxuICAgICAgICB0aGlzLiQoJyNjaGF0LXdpZGdldCAudXNlci1pbnB1dCcpLmtleXVwKGZ1bmN0aW9uKGUpIHtcblxuICAgICAgICAgICAgaWYgKGUua2V5Q29kZSA9PSAxMykge1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYW5NZXNzYWdlKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcblxuICAgICAgICBsdWtuYXRvci5wcm90b3R5cGUuaGFuZGxlQ29va2llVXNlclVuaXF1ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGNvb2tpZXMgPSBkb2N1bWVudC5jb29raWUuc3BsaXQoXCI7XCIpO1xuICAgICAgICAgICAgdmFyIG1sMl9zaWRfYyA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKGNvb2tpZXMuZmluZChlbCA9PiBlbC5pbmNsdWRlcyhcIm1sMl9zaWRfY1wiKSkpIHtcbiAgICAgICAgICAgICAgICBiID0gY29va2llcy5maW5kKGVsID0+IGVsLmluY2x1ZGVzKFwibWwyX3NpZF9jXCIpKTtcbiAgICAgICAgICAgICAgICBtbDJfc2lkX2MgPSBkZWNvZGVVUklDb21wb25lbnQoYi5yZXBsYWNlKFwibWwyX3NpZF9jPVwiLCBcIlwiKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1sMl9zaWRfYztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGNoYXRfdXNlcl91dWlkID0gdGhpcy5jcmVhdGVVVUlEKCk7XG4gICAgICAgICAgICB0aGlzLnNldENvb2tpZSgnY2hhdF91c2VyX3V1aWQnLCBjaGF0X3VzZXJfdXVpZCwgMzY1KTtcbiAgICAgICAgICAgIHJldHVybiBjaGF0X3VzZXJfdXVpZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGx1a25hdG9yLnByb3RvdHlwZS5zZXRDb29raWUgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSwgIGV4cERheXMpIHtcbiAgICAgICAgICAgIHZhciBkYXRlID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgIGRhdGUuc2V0VGltZShkYXRlLmdldERhdGUoKSArIChleHBEYXlzICogMjQgKiA2MCAqIDYwICogMTAwMCkpO1xuICAgICAgICAgICAgdmFyIGV4cGlyZXMgPSBcImV4cGlyZXM9XCIgKyBkYXRlLnRvVVRDU3RyaW5nKCk7XG4gICAgICAgICAgICBkb2N1bWVudC5jb29raWUgPSBuYW1lICsgXCI9XCIgKyB2YWx1ZSArIFwiO1wiICsgZXhwaXJlcyArIFwiO1wiXG4gICAgICAgIH1cbiAgICAgICAgbHVrbmF0b3IucHJvdG90eXBlLmNyZWF0ZVVVSUQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiAneHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIGZ1bmN0aW9uKGMpIHtcbiAgICAgICAgICAgICAgICB2YXIgciA9IE1hdGgucmFuZG9tKCkgKiAxNiB8IDAsIHYgPSBjID09ICd4JyA/IHIgOiAociAmIDB4MyB8IDB4OCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHYudG9TdHJpbmcoMTYpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBsdWtuYXRvci5wcm90b3R5cGUuc2V0TWVzc2FnZUFuZEFsZXJ0ID0gZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICAgICAgICBsdWtuYXRvci5jb252ZXJzYXRpb25JZCA9IHJlc3VsdC5jb252ZXJzYXRpb25faWQ7XG4gICAgICAgICAgICBpZiAocmVzdWx0LnRyeV9jYiAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgbHVrbmF0b3IudHJ5X2NiID0gcmVzdWx0LnRyeV9jYlxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5jcmVhdGVNZXNzYWdlKCdib3QnLCByZXN1bHQpO1xuICAgICAgICAgICAgdGhpcy53YWl0aW5nUmVzcG9uc2UgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuJCgnLmJveC1hbGVydCcpLmFwcGVuZChyZXN1bHQubWVzc2FnZV9hbGVydCk7XG4gICAgICAgICAgICBpZihpc01vYmlsZSkgeyB0aGlzLiQoJ2h0bWwnKS5jc3MoXCJvdmVyZmxvd1wiLCBcImhpZGRlblwiKTsgfVxuICAgICAgICB9XG5cbiAgICAgICAgbHVrbmF0b3IucHJvdG90eXBlLnNlbmRUZXh0ID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgIHZhciB1c2VydGV4dCA9IHRoaXMuJCgnI2NoYXQtd2lkZ2V0IC51c2VyLWlucHV0JykudmFsKCk7XG5cbiAgICAgICAgICAgIHRoaXMuY3JlYXRlTWVzc2FnZSgndXNlcicsIHtcbiAgICAgICAgICAgICAgICAncmVzcG9uc2VzJzogW3VzZXJ0ZXh0XVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHRoaXMuJCgnI2NoYXQtd2lkZ2V0IC51c2VyLWlucHV0JykudmFsKCcnKTtcbiAgICAgICAgICAgIHRoaXMuJCgnLm9wdGlvbnMnKS5yZW1vdmUoKTtcbiAgICAgICAgICAgIHRoaXMuJCgnI2NoYXQtY29pbi1pY29uJykuYWRkQ2xhc3MoJ291dCcpO1xuICAgICAgICAgICAgdGhpcy4kKCcjY2hhdC13aWRnZXQnKS5hZGRDbGFzcygnZnVsbCcpO1xuICAgICAgICAgICAgdGhpcy4kKCcuYm90IC5zcGVhaycpLmxhc3QoKS5yZW1vdmVDbGFzcygnc3BlYWstb3B0aW9uJyk7XG5cbiAgICAgICAgICAgIHRoaXMuYm90UmVxdWVzdCh1c2VydGV4dCk7XG5cbiAgICAgICAgfTtcblxuICAgICAgICBsdWtuYXRvci5wcm90b3R5cGUuY2xlYW5NZXNzYWdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmICgkLnRyaW0oJCgnI2NoYXQtd2lkZ2V0IC51c2VyLWlucHV0JykudmFsKCkpICE9IFwiXCIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNlbmRUZXh0KCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgIH07XG5cblxuICAgIH07XG5cbiAgICBsdWtuYXRvci5wcm90b3R5cGUuYm90UmVxdWVzdCA9IGZ1bmN0aW9uKHRleHQpIHtcbiAgICAgICAgdmFyIGJveEluZGljYXRvciA9IHRoaXMuJCgnI2NoYXQtd2lkZ2V0IC5zcGVhaycpLmxhc3QoKTtcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICB2YXIgZGF0YSA9IHsgJ2NvbnZlcnNhdGlvbl9pZCc6IGx1a25hdG9yLmNvbnZlcnNhdGlvbklkIH1cbiAgICAgICAgaWYgKGx1a25hdG9yLnRyeV9jYiAhPSBudWxsKSB7XG4gICAgICAgICAgICBkYXRhID0geyAnY29udmVyc2F0aW9uX2lkJzogbHVrbmF0b3IuY29udmVyc2F0aW9uSWQsICd0cnlfY2InOiBsdWtuYXRvci50cnlfY2IgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0ZXh0KSB7IGRhdGEudGV4dCA9IHRleHQgfVxuXG4gICAgICAgIGlmICh0aGlzLnVybC5pbmRleE9mKCdqdXBpdGVyJykgIT09IC0xKSB7IGRhdGEud2FfaWQgPSAnNTUzNDkyMzk3ODk1J31cblxuICAgICAgICB0aGlzLiQuYWpheCh7XG4gICAgICAgICAgICB1cmw6IHRoaXMudXJsLFxuICAgICAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICAgICAgbW9kZTogJ2NvcnMnLFxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KGRhdGEpLFxuICAgICAgICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04JyxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKHJlc3VsdCl7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgJCgnI2NoYXQtd2lkZ2V0IC51c2VyLWlucHV0JykucHJvcCgnZGlzYWJsZWQnLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICQoXCJkaXYuZmxvYXQtdHlwaW5nXCIpLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgICAgICBsdWtuYXRvci50cnlfY2IgPSByZXN1bHQudHJ5X2NiO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhhdC5jcmVhdGVNZXNzYWdlKCdib3QnLCByZXN1bHQpO1xuICAgICAgICAgICAgICAgIH0sIDgwMCk7XG5cbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSxcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5yZXNwb25zZVRleHQuaW5kZXhPZignaHRtbCcpICE9IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5yZXNwb25zZXMgPSBbJ0h1bW1tISBUw7QgY29tIHVtIHByb2JsZW1pbmhhIGFxdWkgbm9zIG1ldXMgYWxnb3LDrXRpbW9zIGUgbsOjbyBwZWd1ZWkgbyBxdWUgdmMgbWUgbWFuZG91LiBQb2RlIGVzY3JldmVyIG91dHJhIHZlej8nXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5yZXNwb25zZXMgPSBKU09OLnBhcnNlKHJlc3VsdC5yZXNwb25zZVRleHQpLnJlc3BvbnNlcztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignZXJyb3IgcHJvY2Vzc2luZyByZXF1ZXN0OiAnICsgcmVzdWx0LnJlc3BvbnNlcyArICdcXG5zdGF0dXM6ICcgKyByZXN1bHQuc3RhdHVzICsgJyBcXG5zdGF0dXNUZXh0OicgKyByZXN1bHQuc3RhdHVzVGV4dCk7XG5cbiAgICAgICAgICAgICAgICAkKCcjY2hhdC13aWRnZXQgLnVzZXItaW5wdXQnKS5wcm9wKCdkaXNhYmxlZCcsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAkKFwiZGl2LmZsb2F0LXR5cGluZ1wiKS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZihcInJlc3BvbnNlSlNPTlwiIGluIHJlc3VsdCl7XG4gICAgICAgICAgICAgICAgICAgIHZhciByZXNwb25zZUpTT04gPSByZXN1bHQucmVzcG9uc2VKU09OO1xuICAgICAgICAgICAgICAgICAgICBpZihcImNvbnZlcnNhdGlvbl9pZFwiIGluIHJlc3BvbnNlSlNPTil7XG4gICAgICAgICAgICAgICAgICAgICAgICBsdWtuYXRvci5jb252ZXJzYXRpb25faWQgPSByZXNwb25zZUpTT04uY29udmVyc2F0aW9uX2lkO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnJlc3BvbnNlcyA9IHJlc3BvbnNlSlNPTi5yZXNwb25zZXM7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzdWx0KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhhdC5jcmVhdGVNZXNzYWdlKCdib3QnLCByZXN1bHQpO1xuICAgICAgICAgICAgfS5iaW5kKHRoaXMpXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuJCgnI2NoYXQtd2lkZ2V0IC51c2VyLWlucHV0JykucHJvcCgnZGlzYWJsZWQnLCB0cnVlKTtcblxuICAgICAgICBib3hJbmRpY2F0b3IuYWZ0ZXIoJzxkaXYgY2xhc3M9XCJmbG9hdC10eXBpbmdcIj48ZGl2IGNsYXNzPVwidHlwaW5nLWluZGljYXRvclwiPjxzcGFuPjwvc3Bhbj48c3Bhbj48L3NwYW4+PHNwYW4+PC9zcGFuPjwvZGl2PjwvZGl2PicpO1xuICAgIH07XG5cbiAgICBsdWtuYXRvci5wcm90b3R5cGUuYWN0aW9uQ2xvc2VDaGF0ID0gZnVuY3Rpb24oYWN0aW9uKSB7XG4gICAgICAgIHRoaXMuJCgnI2NoYXQtd2lkZ2V0JykuYWRkQ2xhc3MoJ291dCcpO1xuICAgIH07XG5cblxuICAgIGx1a25hdG9yLnByb3RvdHlwZS5hY3Rpb25EaXNwbGF5T3B0aW9ucyA9IGZ1bmN0aW9uKGFjdGlvbikge1xuXG4gICAgICAgIHZhciBib3hPcHRpb25zID0gdGhpcy4kKCcjY2hhdC13aWRnZXQgLnNwZWFrJykubGFzdCgpO1xuICAgICAgICB2YXIgb3B0aW9ucyA9IGFjdGlvbi5vcHRpb25zO1xuICAgICAgICB2YXIgZGl2X29wdGlvbnMgPSB0aGlzLiQoJzxkaXY+Jywge1xuICAgICAgICAgICAgJ2NsYXNzJzogJ29wdGlvbnMnXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3B0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIG9wdGlvbl90ZXh0ID0gb3B0aW9uc1tpXTtcblxuICAgICAgICAgICAgdmFyIG9wdGlvbiA9IHRoaXMuJCgnPGlucHV0PicpLmF0dHIoe1xuICAgICAgICAgICAgICAgIHR5cGU6ICdidXR0b24nLFxuICAgICAgICAgICAgICAgIGlkOiBvcHRpb25fdGV4dCxcbiAgICAgICAgICAgICAgICB2YWx1ZTogb3B0aW9uX3RleHQsXG4gICAgICAgICAgICAgICAgY2xhc3M6ICdpbnB1dC1vcHRpb24nXG4gICAgICAgICAgICB9KS5vZmYoKS5vbignY2xpY2snLCBmdW5jdGlvbihidXR0b24pIHtcblxuICAgICAgICAgICAgICAgIHZhciBvcHRpb25fdGV4dCA9IGJ1dHRvbi50YXJnZXQuaWQ7XG4gICAgICAgICAgICAgICAgdGhpcy5jcmVhdGVNZXNzYWdlKCd1c2VyJywge1xuICAgICAgICAgICAgICAgICAgICAncmVzcG9uc2VzJzogW29wdGlvbl90ZXh0XVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuJCgnLm9wdGlvbnMnKS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICB0aGlzLiQoJyNjaGF0LXdpZGdldCAudXNlci1pbnB1dCcpLnZhbCgnJyk7XG4gICAgICAgICAgICAgICAgdGhpcy4kKCcjY2hhdC1jb2luLWljb24nKS5hZGRDbGFzcygnb3V0Jyk7XG4gICAgICAgICAgICAgICAgdGhpcy4kKCcjY2hhdC13aWRnZXQnKS5hZGRDbGFzcygnZnVsbCcpO1xuICAgICAgICAgICAgICAgIGJveE9wdGlvbnMucmVtb3ZlQ2xhc3MoJ3NwZWFrLW9wdGlvbicpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5ib3RSZXF1ZXN0KG9wdGlvbl90ZXh0KTtcblxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcblxuICAgICAgICAgICAgZGl2X29wdGlvbnMuYXBwZW5kKG9wdGlvbik7XG4gICAgICAgIH1cblxuICAgICAgICBib3hPcHRpb25zLmFkZENsYXNzKCdzcGVhay1vcHRpb24nKTtcblxuICAgICAgICB0aGlzLiQoJyNjaGF0LXdpZGdldCAuYm94LWNvbnRlbnQnKS5hbmltYXRlKHtcbiAgICAgICAgICAgIHNjcm9sbFRvcDogOTk5OTlcbiAgICAgICAgfSwgNTAwKTtcbiBcbiAgICAgICAgYm94T3B0aW9ucy5hcHBlbmQoZGl2X29wdGlvbnMpO1xuXG4gICAgfTtcblxuICAgIGx1a25hdG9yLnByb3RvdHlwZS5hY3Rpb25UcmFuc2ZlclplbmRlc2sgPSBmdW5jdGlvbihjb250ZXh0KSB7XG4gICAgICAgIHZhciBzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNjcmlwdFwiKTtcbiAgICAgICAgcy50eXBlID0gXCJ0ZXh0L2phdmFzY3JpcHRcIjtcbiAgICAgICAgcy5zcmMgPSBjb250ZXh0Wyd1cmxfemVuZGVzayddO1xuICAgICAgICBzLmlkID0gXCJ6ZS1zbmlwcGV0XCI7XG4gICAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kKHMpO1xuICAgICAgICBcbiAgICAgICAgdmFyIHdhaXRGb3Jab3BpbSA9IHNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICB3aW5kb3cuJHpvcGltID09PSB1bmRlZmluZWQgfHxcbiAgICAgICAgICAgICAgICB3aW5kb3cuJHpvcGltLmxpdmVjaGF0ID09PSB1bmRlZmluZWQgfHxcbiAgICAgICAgICAgICAgICB3aW5kb3cuJHpvcGltLmxpdmVjaGF0LmRlcGFydG1lbnRzID09PSB1bmRlZmluZWRcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgICAgICB6RShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgJHpvcGltKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEkem9waW0ubGl2ZWNoYXQuaXNDaGF0dGluZygpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkem9waW0ubGl2ZWNoYXQuY2xlYXJBbGwoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgJHpvcGltLmxpdmVjaGF0LnNldE9uQ29ubmVjdGVkKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICR6b3BpbS5saXZlY2hhdC5kZXBhcnRtZW50cy5zZXRWaXNpdG9yRGVwYXJ0bWVudChjb250ZXh0WydkZXBhcnRtZW50J10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnRGVwYXJ0bWVudD09PicsIGNvbnRleHRbJ2RlcGFydG1lbnQnXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnRGVwYXJ0bWVudCBUYWc9PT4nLCAgY29udGV4dFsnZGVwYXJ0bWVudF90YWcnXSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb250ZXh0WydvcmRlcl9pZCddKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHpvcGltLmxpdmVjaGF0LmFkZFRhZ3MoXCJwZWRpZG9fXCIgKyBjb250ZXh0WydvcmRlcl9pZCddLCBcImNwZl9cIiArIGNvbnRleHRbJ2N1c3RvbWVyX2NwZiddLCBjb250ZXh0WydkZXBhcnRtZW50X3RhZyddKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHpvcGltLmxpdmVjaGF0LmFkZFRhZ3MoXCJjcGZfXCIgKyBjb250ZXh0WydjdXN0b21lcl9jcGYnXSwgY29udGV4dFsnZGVwYXJ0bWVudF90YWcnXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICR6b3BpbS5saXZlY2hhdC5zZXQoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGNvbnRleHRbJ2N1c3RvbWVyX25hbWUnXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbWFpbDogY29udGV4dFsnY3VzdG9tZXJfZW1haWwnXVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICR6b3BpbS5saXZlY2hhdC53aW5kb3cuc2hvdygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRlcGFydG1lbnRfaW5mbyA9ICR6b3BpbS5saXZlY2hhdC5kZXBhcnRtZW50cy5nZXREZXBhcnRtZW50KGNvbnRleHRbJ2RlcGFydG1lbnQnXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZihkZXBhcnRtZW50X2luZm8uc3RhdHVzID09PSBcIm9ubGluZVwiICYmIChjb250ZXh0Wyd0b2dnbGVfb3ZlcmZsb3dfbWVzc2FnZSddID09IHRydWUgfHwgY29udGV4dFsndG9nZ2xlX292ZXJmbG93X21lc3NhZ2UnXSA9PSBcInRydWVcIikpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR6b3BpbS5saXZlY2hhdC5zYXkoY29udGV4dFsnb3ZlcmZsb3dfbWVzc2FnZSddKVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHRoaXMuJCgnI2NoYXQtd2lkZ2V0JykuYWRkQ2xhc3MoJ291dCcpO1xuICAgICAgICAgICAgdGhpcy4kKCcjY2hhdC13aWRnZXQnKS5yZW1vdmVDbGFzcygnZnVsbCcpO1xuICAgICAgICAgICAgaWYoaXNNb2JpbGUpIHsgdGhpcy4kKCdodG1sJykucmVtb3ZlQ2xhc3MoJ2ktYW1waHRtbC1zY3JvbGwtZGlzYWJsZWQnKTsgfVxuXG4gICAgICAgICAgICBjbGVhckludGVydmFsKHdhaXRGb3Jab3BpbSk7XG4gICAgICAgIH0sIDEwMCk7XG4gICAgfTtcblxuICAgIGx1a25hdG9yLnByb3RvdHlwZS5jcmVhdGVNZXNzYWdlID0gZnVuY3Rpb24oY2xhc3NOYW1lLCByZXN1bHQpIHtcbiAgICAgICAgdGhpcy4kKCcjY2hhdC13aWRnZXQnKS5yZW1vdmVDbGFzcygnb3V0Jyk7XG4gICAgICAgIGlmIChyZXN1bHQuaGFzT3duUHJvcGVydHkoJ2NvbnRleHQnKSAmJiByZXN1bHQuY29udGV4dC5oYXNPd25Qcm9wZXJ0eSgnd2FpdF9hdHRlbmRhbnQnKSl7XG4gICAgICAgICAgICB0aGlzLiQoJyNjaGF0LXdpZGdldCAudXNlci1pbnB1dCcpLnByb3AoJ2Rpc2FibGVkJywgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgXG5cdC8vIGV4cG9zZSBib3QgdGFnXG4gICAgICAgIHdpbmRvdy5Cb3RUYWcgPSByZXN1bHQudGFnO1xuXHRpZiAodGhpcy50YWdDYWxsYmFjayAmJiBjbGFzc05hbWUgPT0gJ2JvdCcpIHtcblx0ICAgIHRoaXMudGFnQ2FsbGJhY2socmVzdWx0LnRhZyk7XG5cdH1cblx0XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgcmVzdWx0LnJlc3BvbnNlcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgdmFyIHRleHQgPSByZXN1bHQucmVzcG9uc2VzW2pdO1xuICAgICAgICAgICAgdmFyIGZ1bGxDbGFzc05hbWUgPSAnY2hhdC1pdGVtICcgKyBjbGFzc05hbWU7XG4gICAgICAgICAgICB2YXIgY2hhdEl0ZW0gPSB0aGlzLiQoJzxkaXY+Jywge1xuICAgICAgICAgICAgICAgJ2NsYXNzJzogZnVsbENsYXNzTmFtZVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHZhciBzcGFuID0gdGhpcy4kKCc8c3Bhbj4nKTtcblxuICAgICAgICAgICAgaWYgKGNsYXNzTmFtZSA9PSAnYm90Jykge1xuICAgICAgICAgICAgICAgIHZhciBhdmF0YXIgPSB0aGlzLiQoJzxkaXY+Jywge1xuICAgICAgICAgICAgICAgICAgICAnY2xhc3MnOiAnYXZhdGFyJ1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHZhciBpbWcgPSB0aGlzLiQoJzxpbWc+JylcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ3NyYycsIHRoaXMuYm90X2J1YmJsZSlcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2RyYWdnYWJsZScsICdmYWxzZScpO1xuICAgICAgICAgICAgICAgIGF2YXRhci5hcHBlbmQoaW1nKTtcbiAgICAgICAgICAgICAgICBjaGF0SXRlbS5hcHBlbmQoYXZhdGFyKTtcbiAgICAgICAgICAgICAgICBzcGFuLmh0bWwodGV4dCk7XG4gICAgICAgICAgICAgICAgJCgnI2NoYXQtd2lkZ2V0IC51c2VyLWlucHV0JykuZm9jdXMoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc3Bhbi50ZXh0KHRleHQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgc3BlYWsgPSB0aGlzLiQoJzxkaXY+Jywge1xuICAgICAgICAgICAgICAgICdjbGFzcyc6ICdzcGVhaydcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgc3BlYWsuYXBwZW5kKHNwYW4pO1xuICAgICAgICAgICAgY2hhdEl0ZW0uYXBwZW5kKHNwZWFrKTtcblxuICAgICAgICAgICAgdGhpcy4kKCcjY2hhdC13aWRnZXQgLmNoYXQtY29udGVudCcpLmFwcGVuZChjaGF0SXRlbSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChyZXN1bHQudHJ5X2NiICE9IG51bGwgJiYgcmVzdWx0LnRyeV9jYiA+IDApIHtcbiAgICAgICAgICAgIGlmIChyZXN1bHQudHJ5X2NiID09IDEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFjdGlvbkRpc3BsYXlPcHRpb25zKHtcIm9wdGlvbnNcIjogW1wiRmFsYXIgY29tIGF0ZW5kZW50ZVwiLCBcIk7Do28gcHJlY2lzYVwiXSB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hY3Rpb25EaXNwbGF5T3B0aW9ucyh7XCJvcHRpb25zXCI6IFtcIkZhbGFyIGNvbSBhdGVuZGVudGVcIiwgXCJBdMOpIG1haXMgdGFyZGVcIl0gfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyZXN1bHQuYWN0aW9ucykge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZXN1bHQuYWN0aW9ucy5sZW5ndGg7IGkrKykge1xuXG4gICAgICAgICAgICAgICAgdmFyIGFjdGlvbiA9IHJlc3VsdC5hY3Rpb25zW2ldO1xuXG4gICAgICAgICAgICAgICAgaWYgKGFjdGlvbi50eXBlID09ICdhdXRvX3JlcGx5Jykge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnQVVUTyBSRVBMWScpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYm90UmVxdWVzdCgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChhY3Rpb24udHlwZSA9PSAnb3B0aW9uJyB8fCBhY3Rpb24udHlwZSA9PSAnZGlzcGxheV9vcHRpb25zJykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFjdGlvbkRpc3BsYXlPcHRpb25zKGFjdGlvbik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGFjdGlvbi50eXBlID09ICd0cmFuc2Zlcl96ZW5kZXNrJykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFjdGlvblRyYW5zZmVyWmVuZGVzayhyZXN1bHQuY29udGV4dCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGFjdGlvbi50eXBlID09ICdjbG9zZV9jaGF0Jykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFjdGlvbkNsb3NlQ2hhdCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuJCgnI2NoYXQtd2lkZ2V0IC5ib3gtY29udGVudCcpLmFuaW1hdGUoe1xuICAgICAgICAgICAgc2Nyb2xsVG9wOiA5OTk5OVxuICAgICAgICB9LCAwKTtcblxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBtYWluKHBhcmFtcykge1xuICAgICAgICB3aW5kb3cualF1ZXJ5KGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbigkKSB7XG5cbiAgICAgICAgICAgIGlmICghd2luZG93Ll9sdWtuYXRvcikge1xuICAgICAgICAgICAgICAgIHZhciBjc3NMaW5rID0gJCgnPGxpbms+Jywge1xuICAgICAgICAgICAgICAgICAgICByZWw6ICdzdHlsZXNoZWV0JyxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3RleHQvY3NzJyxcbiAgICAgICAgICAgICAgICAgICAgaHJlZjogd2luZG93Lmx1a25hdG9yUGFyYW1zLmNzc1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNzc0xpbmsuYXBwZW5kVG8oJ2hlYWQnKTtcbiAgICAgICAgICAgICAgICB3aW5kb3cuX2x1a25hdG9yID0gbmV3IGx1a25hdG9yKCQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvLy8vLy8vLy8vLy9cbiAgICAvLyBMb2FkZXIgLy9cbiAgICAvLy8vLy8vLy8vLy9cbiAgICB2YXIgalF1ZXJ5O1xuICAgIGlmICh3aW5kb3cualF1ZXJ5ID09PSB1bmRlZmluZWQgfHwgd2luZG93LmpRdWVyeS5mbi5qcXVlcnkgIT09ICcxLjEyLjQnKSB7XG5cbiAgICAgICAgdmFyIHNjcmlwdF90YWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcblxuICAgICAgICBzY3JpcHRfdGFnLnNldEF0dHJpYnV0ZSgndHlwZScsICd0ZXh0L2phdmFzY3JpcHQnKTtcbiAgICAgICAgc2NyaXB0X3RhZy5zZXRBdHRyaWJ1dGUoXG4gICAgICAgICAgICAnc3JjJyxcbiAgICAgICAgICAgICcvL2FqYXguZ29vZ2xlYXBpcy5jb20vYWpheC9saWJzL2pxdWVyeS8xLjEyLjQvanF1ZXJ5Lm1pbi5qcydcbiAgICAgICAgKTtcblxuICAgICAgICBpZiAoc2NyaXB0X3RhZy5yZWFkeVN0YXRlKSB7XG4gICAgICAgICAgICBzY3JpcHRfdGFnLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkgeyAvLyBGb3Igb2xkIHZlcnNpb25zIG9mIElFXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucmVhZHlTdGF0ZSA9PSAnY29tcGxldGUnIHx8IHRoaXMucmVhZHlTdGF0ZSA9PSAnbG9hZGVkJykge1xuICAgICAgICAgICAgICAgICAgICBzY3JpcHRMb2FkSGFuZGxlcigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzY3JpcHRfdGFnLm9ubG9hZCA9IHNjcmlwdExvYWRIYW5kbGVyO1xuICAgICAgICB9XG4gICAgICAgIChkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdIHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCkuYXBwZW5kQ2hpbGQoc2NyaXB0X3RhZyk7XG5cbiAgICB9IGVsc2Uge1xuICAgICAgICBqUXVlcnkgPSB3aW5kb3cualF1ZXJ5O1xuICAgICAgICBtYWluKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2NyaXB0TG9hZEhhbmRsZXIoKSB7XG4gICAgICAgIGpRdWVyeSA9IHdpbmRvdy5qUXVlcnkubm9Db25mbGljdCh0cnVlKTtcbiAgICAgICAgbWFpbigpO1xuICAgIH07XG5cbn0pKCk7IiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgbHVrbmF0b3IgPSBmdW5jdGlvbigkKSB7XG4gICAgICAgIHRoaXMuJCA9ICQ7XG4gICAgICAgIHRoaXMuY29uZmlndXJlKCk7XG4gICAgICAgIHRoaXMuYnVpbGQoKTtcbiAgICB9O1xuXG4gICAgdmFyIGlzTW9iaWxlID0gL0FuZHJvaWR8d2ViT1N8aVBob25lfGlQYWR8aVBvZHxCbGFja0JlcnJ5fElFTW9iaWxlfE9wZXJhIE1pbmkvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpO1xuXG4gICAgbHVrbmF0b3IucHJvdG90eXBlLmNvbmZpZ3VyZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmNvbnZlcnNhdGlvbklkID0gbnVsbDtcbiAgICAgICAgdGhpcy53YWl0aW5nUmVzcG9uc2UgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pbml0R29vZ2xlTWFwcygpO1xuXG4gICAgICAgIHZhciBwYXJhbXMgPSB3aW5kb3cubHVrbmF0b3JQYXJhbXM7XG4gICAgICAgIGlmICh0eXBlb2YgcGFyYW1zID09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICB0aGlzLnVybCA9IHBhcmFtcy51cmw7XG4gICAgICAgICAgICB0aGlzLmJ0X2Nsb3NlID0gcGFyYW1zLmJ0X2Nsb3NlO1xuICAgICAgICAgICAgdGhpcy5idF9zZW5kID0gcGFyYW1zLmJ0X3NlbmQ7XG4gICAgICAgICAgICB0aGlzLmJvdF9jb2luID0gcGFyYW1zLmJvdF9jb2luO1xuICAgICAgICAgICAgdGhpcy5ib3RfYnViYmxlID0gcGFyYW1zLmJvdF9idWJibGU7XG4gICAgICAgICAgICB0aGlzLnRpdGxlID0gcGFyYW1zLnRpdGxlO1xuXHQgICAgdGhpcy50YWdDYWxsYmFjayA9IHBhcmFtcy50YWdDYWxsYmFjaztcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBsdWtuYXRvci5wcm90b3R5cGUuaW5pdEdvb2dsZU1hcHMgPSBmdW5jdGlvbihhY3Rpb24pIHtcblxuICAgICAgICB3aW5kb3cuaW5pdE1hcCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgd2luZG93Lmdvb2dsZU1hcHNJbml0aWFsaXplZCA9IHRydWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy4kKCdoZWFkJykuYXBwZW5kKFxuICAgICAgICAgICAgJzxzY3JpcHQgYXN5bmMgZGVmZXIgJyArXG4gICAgICAgICAgICAnc3JjPVwiaHR0cHM6Ly9tYXBzLmdvb2dsZWFwaXMuY29tL21hcHMvYXBpL2pzP2tleT1BSXphU3lDdjZzSG5sM3lzdGM3SjJ0TXBFVFVTLS0tdU91dkxGQmcmY2FsbGJhY2s9aW5pdE1hcFwiPicgK1xuICAgICAgICAgICAgJzwvc2NyaXB0PidcbiAgICAgICAgKTtcbiAgICB9O1xuXG4gICAgbHVrbmF0b3IucHJvdG90eXBlLmJ1aWxkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vLy8vLy8vLy8vLy8vLy8vXG4gICAgICAgIC8vIENIQU5HRSBUSElTIC8vXG4gICAgICAgIHZhciBob2x5SFRNTCA9ICc8ZGl2IGNsYXNzPVwiYm94LWhlYWRlclwiPjxkaXYgY2xhc3M9XCJ0aXRsZVwiPjxoMj4nICsgdGhpcy50aXRsZSArICc8L2gyPjwvZGl2PjxkaXYgY2xhc3M9XCJjbG9zZS1idXR0b25cIj48aSBjbGFzcz1cImNsb3NlIHN2Zy1jbG9zZS1jaGF0XCIgc3R5bGU9XCJjdXJzb3I6cG9pbnRlclwiPjwvaT48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPVwiYm94LWNvbnRlbnRcIj48ZGl2IGNsYXNzPVwiYm94LWFsZXJ0XCI+PC9kaXY+PGRpdiBjbGFzcz1cImNoYXQtY29udGVudFwiPjxkaXYgY2xhc3M9XCJjaGF0LWl0ZW0gYm90XCI+PGRpdiBjbGFzcz1cImJveC1vcHRpb25zXCIvPjwvZGl2PjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XCJib3gtZm9vdGVyXCI+PGRpdiBjbGFzcz1cImZvcm0tYXJlYVwiPjxkaXYgY2xhc3M9XCJib3gtaW5wdXRcIj48ZGl2IGNsYXNzPVwiaW5wdXQtd3JhcHBlclwiPjxidXR0b24gaWQ9XCJzdWJtaXRjaGF0XCIgY2xhc3M9XCJzdWJtaXQtY2hhdFwiPjwvYnV0dG9uPjxpbnB1dCBjbGFzcz1cInVzZXItaW5wdXRcIiB0eXBlPVwidGV4dFwiIGRhdGEtZW1vamlhYmxlPVwidHJ1ZVwiIHBsYWNlaG9sZGVyPVwiRXNjcmV2YSBzdWEgbWVuc2FnZW0uLi5cIj48L2Rpdj48L2Rpdj48L2Rpdj48L2Rpdj4nO1xuICAgICAgICAvLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgICAgIHZhciBjaGF0V2lkZ2V0ID0gdGhpcy4kKCc8ZGl2Lz4nLCB7XG4gICAgICAgICAgICAnaWQnOiAnY2hhdC13aWRnZXQnLFxuICAgICAgICAgICAgJ2NsYXNzJzogJ3VzZXJjaGF0LXVpIG91dCdcbiAgICAgICAgfSk7XG4gICAgICAgIGNoYXRXaWRnZXQuaHRtbChob2x5SFRNTCk7XG5cbiAgICAgICAgLy8gQ29pblxuICAgICAgICB2YXIgY29pbkRpdiA9IHRoaXMuJCgnPGRpdi8+Jywge1xuICAgICAgICAgICAgJ2lkJzogJ2NoYXQtY29pbi1pY29uJ1xuICAgICAgICB9KTtcbiAgICAgICAgdmFyIGNvaW5Db250YWluZXIgPSB0aGlzLiQoJzxkaXYvPicsIHtcbiAgICAgICAgICAgICdjbGFzcyc6ICdhdmF0YXItY29udGFpbmVyJ1xuICAgICAgICB9KTtcbiAgICAgICAgdmFyIGNvaW5JbWcgPSB0aGlzLiQoJzxpbWcvPicsIHtcbiAgICAgICAgICAgICdzcmMnOiB0aGlzLmJvdF9jb2luLFxuICAgICAgICAgICAgJ2RyYWdnYWJsZSc6ICdmYWxzZSdcbiAgICAgICAgfSk7XG4gICAgICAgIGNvaW5Db250YWluZXIuYXBwZW5kKGNvaW5JbWcpO1xuICAgICAgICBjb2luRGl2LmFwcGVuZChjb2luQ29udGFpbmVyKTtcblxuICAgICAgICB0aGlzLiQoJ2x1a25hdG9yLWNvbnRhaW5lcicpLmFwcGVuZChjaGF0V2lkZ2V0KTtcbiAgICAgICAgdGhpcy4kKCdsdWtuYXRvci1jb250YWluZXInKS5hcHBlbmQoY29pbkRpdik7XG5cbiAgICAgICAgLy8gQnV0dG9uIENsb3NlXG4gICAgICAgIHRoaXMuJCgnLmJveC1oZWFkZXIgLmNsb3NlLWJ1dHRvbicpLmNzcyhcbiAgICAgICAgICAgICdiYWNrZ3JvdW5kJyxcbiAgICAgICAgICAgICd1cmwoJyArIHRoaXMuYnRfY2xvc2UgKyAnKSdcbiAgICAgICAgKTtcblxuICAgICAgICAvLyBCdXR0b24gU2VuZFxuICAgICAgICB0aGlzLiQoJy5zdWJtaXQtY2hhdCcpLmNzcyhcbiAgICAgICAgICAgICdiYWNrZ3JvdW5kLWltYWdlJyxcbiAgICAgICAgICAgICd1cmwoJyArIHRoaXMuYnRfc2VuZCArICcpJ1xuICAgICAgICApO1xuXG4gICAgICAgIHRoaXMuYmluZCgpO1xuXG4gICAgICAgIHZhciB1cmxQYXJhbXMgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKHdpbmRvdy5sb2NhdGlvbi5zZWFyY2gpO1xuICAgICAgICB2YXIgb3BlbkNoYXQgPSB1cmxQYXJhbXMuZ2V0KCdvcGVuQ2hhdCcpO1xuXG4gICAgICAgIGlmIChvcGVuQ2hhdCkge1xuICAgICAgICAgICAgJCgnI2NoYXQtY29pbi1pY29uJykuY2xpY2soKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBsdWtuYXRvci5wcm90b3R5cGUuYmluZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaGlkZV9hbGVydF9kZWxheSA9IDYwMDAwO1xuXG4gICAgICAgIC8vQmluZCBJbnB1dFxuICAgICAgICB0aGlzLiQoJy51c2VyLWlucHV0JykuZm9jdXNpbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuJCgnI2NoYXQtY29pbi1pY29uJykuYWRkQ2xhc3MoJ291dCcpO1xuICAgICAgICAgICAgdGhpcy4kKCcjY2hhdC13aWRnZXQnKS5hZGRDbGFzcygnZnVsbCcpO1xuICAgICAgICB9LmJpbmQodGhpcykpO1xuXG4gICAgICAgIC8vIEJpbmQgQ29pblxuICAgICAgICB0aGlzLiQoJyNjaGF0LWNvaW4taWNvbicpLm9mZigpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gdmVyaWZ5IGNvb2tpZXNcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlQ29va2llVXNlclVuaXF1ZSgpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyByZW1vdmUgbWVzc2FnZVxuICAgICAgICAgICAgaWYgKCQoJy5ib3gtYWxlcnQnKS5sZW5ndGgpe1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgJCgnLmJveC1hbGVydCcpLnNsaWRlVXAoIFwic2xvd1wiLCBmdW5jdGlvbigpeyAkKHRoaXMpLnJlbW92ZSgpO30pO1xuICAgICAgICAgICAgICAgIH0sIGhpZGVfYWxlcnRfZGVsYXkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhpcy4kKCcjY2hhdC13aWRnZXQnKS5oYXNDbGFzcygnb3V0JykgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWx1a25hdG9yLmNvbnZlcnNhdGlvbklkICYmICF0aGlzLndhaXRpbmdSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLndhaXRpbmdSZXNwb25zZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuJC5hamF4KHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vZGU6ICdjb3JzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybDogdGhpcy51cmxcbiAgICAgICAgICAgICAgICAgICAgfSkuZG9uZShmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRNZXNzYWdlQW5kQWxlcnQocmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgfS5iaW5kKHRoaXMpKVxuICAgICAgICAgICAgICAgICAgICAuZmFpbChmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdC5yZXNwb25zZUpTT047XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldE1lc3NhZ2VBbmRBbGVydChyZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuJCgnI2NoYXQtd2lkZ2V0JykucmVtb3ZlQ2xhc3MoJ291dCcpO1xuICAgICAgICAgICAgICAgICAgICBpZihpc01vYmlsZSkgeyB0aGlzLiQoJ2h0bWwnKS5jc3MoXCJvdmVyZmxvd1wiLCBcImhpZGRlblwiKTsgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy4kKCcjY2hhdC13aWRnZXQnKS5hZGRDbGFzcygnb3V0Jyk7XG4gICAgICAgICAgICAgICAgICBpZihpc01vYmlsZSkgeyB0aGlzLiQoJ2h0bWwnKS5jc3MoXCJvdmVyZmxvd1wiLCBcImF1dG9cIik7IH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgICBcbiAgICAgICAgLy8gQmluZCBDbG9zZVxuICAgICAgICB0aGlzLiQoJyNjaGF0LXdpZGdldCAuY2xvc2UtYnV0dG9uJykub2ZmKCkub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLiQoJyNjaGF0LWNvaW4taWNvbicpLnJlbW92ZUNsYXNzKCdvdXQnKTtcbiAgICAgICAgICAgIHRoaXMuJCgnI2NoYXQtd2lkZ2V0JykuYWRkQ2xhc3MoJ291dCcpO1xuICAgICAgICAgICAgdGhpcy4kKCcjY2hhdC13aWRnZXQnKS5yZW1vdmVDbGFzcygnZnVsbCcpO1xuICAgICAgICAgICAgaWYoaXNNb2JpbGUpIHsgdGhpcy4kKCdodG1sJykucmVtb3ZlQ2xhc3MoJ2ktYW1waHRtbC1zY3JvbGwtZGlzYWJsZWQnKTsgfVxuICAgICAgICB9LmJpbmQodGhpcykpO1xuXG4gICAgICAgIC8vIEJpbmQgQ2xpY2sgU3VibWl0XG4gICAgICAgIHRoaXMuJCgnI2NoYXQtd2lkZ2V0IC5zdWJtaXQtY2hhdCcpLm9mZigpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICB0aGlzLmNsZWFuTWVzc2FnZSgpO1xuICAgICAgICAgICAgXG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG5cblxuICAgICAgICAvLyBCaW5kIHRleHQgQXJlYVxuICAgICAgICB0aGlzLiQoJyNjaGF0LXdpZGdldCAudXNlci1pbnB1dCcpLmtleXVwKGZ1bmN0aW9uKGUpIHtcblxuICAgICAgICAgICAgaWYgKGUua2V5Q29kZSA9PSAxMykge1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYW5NZXNzYWdlKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcblxuICAgICAgICBsdWtuYXRvci5wcm90b3R5cGUuaGFuZGxlQ29va2llVXNlclVuaXF1ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGNvb2tpZXMgPSBkb2N1bWVudC5jb29raWUuc3BsaXQoXCI7XCIpO1xuICAgICAgICAgICAgdmFyIG1sMl9zaWRfYyA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKGNvb2tpZXMuZmluZChlbCA9PiBlbC5pbmNsdWRlcyhcIm1sMl9zaWRfY1wiKSkpIHtcbiAgICAgICAgICAgICAgICBiID0gY29va2llcy5maW5kKGVsID0+IGVsLmluY2x1ZGVzKFwibWwyX3NpZF9jXCIpKTtcbiAgICAgICAgICAgICAgICBtbDJfc2lkX2MgPSBkZWNvZGVVUklDb21wb25lbnQoYi5yZXBsYWNlKFwibWwyX3NpZF9jPVwiLCBcIlwiKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1sMl9zaWRfYztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGNoYXRfdXNlcl91dWlkID0gdGhpcy5jcmVhdGVVVUlEKCk7XG4gICAgICAgICAgICB0aGlzLnNldENvb2tpZSgnY2hhdF91c2VyX3V1aWQnLCBjaGF0X3VzZXJfdXVpZCwgMzY1KTtcbiAgICAgICAgICAgIHJldHVybiBjaGF0X3VzZXJfdXVpZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGx1a25hdG9yLnByb3RvdHlwZS5zZXRDb29raWUgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSwgIGV4cERheXMpIHtcbiAgICAgICAgICAgIHZhciBkYXRlID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgIGRhdGUuc2V0VGltZShkYXRlLmdldERhdGUoKSArIChleHBEYXlzICogMjQgKiA2MCAqIDYwICogMTAwMCkpO1xuICAgICAgICAgICAgdmFyIGV4cGlyZXMgPSBcImV4cGlyZXM9XCIgKyBkYXRlLnRvVVRDU3RyaW5nKCk7XG4gICAgICAgICAgICBkb2N1bWVudC5jb29raWUgPSBuYW1lICsgXCI9XCIgKyB2YWx1ZSArIFwiO1wiICsgZXhwaXJlcyArIFwiO1wiXG4gICAgICAgIH1cbiAgICAgICAgbHVrbmF0b3IucHJvdG90eXBlLmNyZWF0ZVVVSUQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiAneHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIGZ1bmN0aW9uKGMpIHtcbiAgICAgICAgICAgICAgICB2YXIgciA9IE1hdGgucmFuZG9tKCkgKiAxNiB8IDAsIHYgPSBjID09ICd4JyA/IHIgOiAociAmIDB4MyB8IDB4OCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHYudG9TdHJpbmcoMTYpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBsdWtuYXRvci5wcm90b3R5cGUuc2V0TWVzc2FnZUFuZEFsZXJ0ID0gZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICAgICAgICBsdWtuYXRvci5jb252ZXJzYXRpb25JZCA9IHJlc3VsdC5jb252ZXJzYXRpb25faWQ7XG4gICAgICAgICAgICBpZiAocmVzdWx0LnRyeV9jYiAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgbHVrbmF0b3IudHJ5X2NiID0gcmVzdWx0LnRyeV9jYlxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5jcmVhdGVNZXNzYWdlKCdib3QnLCByZXN1bHQpO1xuICAgICAgICAgICAgdGhpcy53YWl0aW5nUmVzcG9uc2UgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuJCgnLmJveC1hbGVydCcpLmFwcGVuZChyZXN1bHQubWVzc2FnZV9hbGVydCk7XG4gICAgICAgICAgICBpZihpc01vYmlsZSkgeyB0aGlzLiQoJ2h0bWwnKS5jc3MoXCJvdmVyZmxvd1wiLCBcImhpZGRlblwiKTsgfVxuICAgICAgICB9XG5cbiAgICAgICAgbHVrbmF0b3IucHJvdG90eXBlLnNlbmRUZXh0ID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgIHZhciB1c2VydGV4dCA9IHRoaXMuJCgnI2NoYXQtd2lkZ2V0IC51c2VyLWlucHV0JykudmFsKCk7XG5cbiAgICAgICAgICAgIHRoaXMuY3JlYXRlTWVzc2FnZSgndXNlcicsIHtcbiAgICAgICAgICAgICAgICAncmVzcG9uc2VzJzogW3VzZXJ0ZXh0XVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHRoaXMuJCgnI2NoYXQtd2lkZ2V0IC51c2VyLWlucHV0JykudmFsKCcnKTtcbiAgICAgICAgICAgIHRoaXMuJCgnLm9wdGlvbnMnKS5yZW1vdmUoKTtcbiAgICAgICAgICAgIHRoaXMuJCgnI2NoYXQtY29pbi1pY29uJykuYWRkQ2xhc3MoJ291dCcpO1xuICAgICAgICAgICAgdGhpcy4kKCcjY2hhdC13aWRnZXQnKS5hZGRDbGFzcygnZnVsbCcpO1xuICAgICAgICAgICAgdGhpcy4kKCcuYm90IC5zcGVhaycpLmxhc3QoKS5yZW1vdmVDbGFzcygnc3BlYWstb3B0aW9uJyk7XG5cbiAgICAgICAgICAgIHRoaXMuYm90UmVxdWVzdCh1c2VydGV4dCk7XG5cbiAgICAgICAgfTtcblxuICAgICAgICBsdWtuYXRvci5wcm90b3R5cGUuY2xlYW5NZXNzYWdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmICgkLnRyaW0oJCgnI2NoYXQtd2lkZ2V0IC51c2VyLWlucHV0JykudmFsKCkpICE9IFwiXCIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNlbmRUZXh0KCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgIH07XG5cblxuICAgIH07XG5cbiAgICBsdWtuYXRvci5wcm90b3R5cGUuYm90UmVxdWVzdCA9IGZ1bmN0aW9uKHRleHQpIHtcbiAgICAgICAgdmFyIGJveEluZGljYXRvciA9IHRoaXMuJCgnI2NoYXQtd2lkZ2V0IC5zcGVhaycpLmxhc3QoKTtcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICB2YXIgZGF0YSA9IHsgJ2NvbnZlcnNhdGlvbl9pZCc6IGx1a25hdG9yLmNvbnZlcnNhdGlvbklkIH1cbiAgICAgICAgaWYgKGx1a25hdG9yLnRyeV9jYiAhPSBudWxsKSB7XG4gICAgICAgICAgICBkYXRhID0geyAnY29udmVyc2F0aW9uX2lkJzogbHVrbmF0b3IuY29udmVyc2F0aW9uSWQsICd0cnlfY2InOiBsdWtuYXRvci50cnlfY2IgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0ZXh0KSB7IGRhdGEudGV4dCA9IHRleHQgfVxuXG4gICAgICAgIGlmICh0aGlzLnVybC5pbmRleE9mKCdqdXBpdGVyJykgIT09IC0xKSB7IGRhdGEud2FfaWQgPSAnNTUzNDkyMzk3ODk1J31cblxuICAgICAgICB0aGlzLiQuYWpheCh7XG4gICAgICAgICAgICB1cmw6IHRoaXMudXJsLFxuICAgICAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICAgICAgbW9kZTogJ2NvcnMnLFxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KGRhdGEpLFxuICAgICAgICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04JyxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKHJlc3VsdCl7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgJCgnI2NoYXQtd2lkZ2V0IC51c2VyLWlucHV0JykucHJvcCgnZGlzYWJsZWQnLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICQoXCJkaXYuZmxvYXQtdHlwaW5nXCIpLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgICAgICBsdWtuYXRvci50cnlfY2IgPSByZXN1bHQudHJ5X2NiO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhhdC5jcmVhdGVNZXNzYWdlKCdib3QnLCByZXN1bHQpO1xuICAgICAgICAgICAgICAgIH0sIDgwMCk7XG5cbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSxcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5yZXNwb25zZVRleHQuaW5kZXhPZignaHRtbCcpICE9IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5yZXNwb25zZXMgPSBbJ0h1bW1tISBUw7QgY29tIHVtIHByb2JsZW1pbmhhIGFxdWkgbm9zIG1ldXMgYWxnb3LDrXRpbW9zIGUgbsOjbyBwZWd1ZWkgbyBxdWUgdmMgbWUgbWFuZG91LiBQb2RlIGVzY3JldmVyIG91dHJhIHZlej8nXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5yZXNwb25zZXMgPSBKU09OLnBhcnNlKHJlc3VsdC5yZXNwb25zZVRleHQpLnJlc3BvbnNlcztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignZXJyb3IgcHJvY2Vzc2luZyByZXF1ZXN0OiAnICsgcmVzdWx0LnJlc3BvbnNlcyArICdcXG5zdGF0dXM6ICcgKyByZXN1bHQuc3RhdHVzICsgJyBcXG5zdGF0dXNUZXh0OicgKyByZXN1bHQuc3RhdHVzVGV4dCk7XG5cbiAgICAgICAgICAgICAgICAkKCcjY2hhdC13aWRnZXQgLnVzZXItaW5wdXQnKS5wcm9wKCdkaXNhYmxlZCcsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAkKFwiZGl2LmZsb2F0LXR5cGluZ1wiKS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZihcInJlc3BvbnNlSlNPTlwiIGluIHJlc3VsdCl7XG4gICAgICAgICAgICAgICAgICAgIHZhciByZXNwb25zZUpTT04gPSByZXN1bHQucmVzcG9uc2VKU09OO1xuICAgICAgICAgICAgICAgICAgICBpZihcImNvbnZlcnNhdGlvbl9pZFwiIGluIHJlc3BvbnNlSlNPTil7XG4gICAgICAgICAgICAgICAgICAgICAgICBsdWtuYXRvci5jb252ZXJzYXRpb25faWQgPSByZXNwb25zZUpTT04uY29udmVyc2F0aW9uX2lkO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnJlc3BvbnNlcyA9IHJlc3BvbnNlSlNPTi5yZXNwb25zZXM7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzdWx0KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhhdC5jcmVhdGVNZXNzYWdlKCdib3QnLCByZXN1bHQpO1xuICAgICAgICAgICAgfS5iaW5kKHRoaXMpXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuJCgnI2NoYXQtd2lkZ2V0IC51c2VyLWlucHV0JykucHJvcCgnZGlzYWJsZWQnLCB0cnVlKTtcblxuICAgICAgICBib3hJbmRpY2F0b3IuYWZ0ZXIoJzxkaXYgY2xhc3M9XCJmbG9hdC10eXBpbmdcIj48ZGl2IGNsYXNzPVwidHlwaW5nLWluZGljYXRvclwiPjxzcGFuPjwvc3Bhbj48c3Bhbj48L3NwYW4+PHNwYW4+PC9zcGFuPjwvZGl2PjwvZGl2PicpO1xuICAgIH07XG5cbiAgICBsdWtuYXRvci5wcm90b3R5cGUuYWN0aW9uQ2xvc2VDaGF0ID0gZnVuY3Rpb24oYWN0aW9uKSB7XG4gICAgICAgIHRoaXMuJCgnI2NoYXQtd2lkZ2V0JykuYWRkQ2xhc3MoJ291dCcpO1xuICAgIH07XG5cblxuICAgIGx1a25hdG9yLnByb3RvdHlwZS5hY3Rpb25EaXNwbGF5T3B0aW9ucyA9IGZ1bmN0aW9uKGFjdGlvbikge1xuXG4gICAgICAgIHZhciBib3hPcHRpb25zID0gdGhpcy4kKCcjY2hhdC13aWRnZXQgLnNwZWFrJykubGFzdCgpO1xuICAgICAgICB2YXIgb3B0aW9ucyA9IGFjdGlvbi5vcHRpb25zO1xuICAgICAgICB2YXIgZGl2X29wdGlvbnMgPSB0aGlzLiQoJzxkaXY+Jywge1xuICAgICAgICAgICAgJ2NsYXNzJzogJ29wdGlvbnMnXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3B0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIG9wdGlvbl90ZXh0ID0gb3B0aW9uc1tpXTtcblxuICAgICAgICAgICAgdmFyIG9wdGlvbiA9IHRoaXMuJCgnPGlucHV0PicpLmF0dHIoe1xuICAgICAgICAgICAgICAgIHR5cGU6ICdidXR0b24nLFxuICAgICAgICAgICAgICAgIGlkOiBvcHRpb25fdGV4dCxcbiAgICAgICAgICAgICAgICB2YWx1ZTogb3B0aW9uX3RleHQsXG4gICAgICAgICAgICAgICAgY2xhc3M6ICdpbnB1dC1vcHRpb24nXG4gICAgICAgICAgICB9KS5vZmYoKS5vbignY2xpY2snLCBmdW5jdGlvbihidXR0b24pIHtcblxuICAgICAgICAgICAgICAgIHZhciBvcHRpb25fdGV4dCA9IGJ1dHRvbi50YXJnZXQuaWQ7XG4gICAgICAgICAgICAgICAgdGhpcy5jcmVhdGVNZXNzYWdlKCd1c2VyJywge1xuICAgICAgICAgICAgICAgICAgICAncmVzcG9uc2VzJzogW29wdGlvbl90ZXh0XVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuJCgnLm9wdGlvbnMnKS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICB0aGlzLiQoJyNjaGF0LXdpZGdldCAudXNlci1pbnB1dCcpLnZhbCgnJyk7XG4gICAgICAgICAgICAgICAgdGhpcy4kKCcjY2hhdC1jb2luLWljb24nKS5hZGRDbGFzcygnb3V0Jyk7XG4gICAgICAgICAgICAgICAgdGhpcy4kKCcjY2hhdC13aWRnZXQnKS5hZGRDbGFzcygnZnVsbCcpO1xuICAgICAgICAgICAgICAgIGJveE9wdGlvbnMucmVtb3ZlQ2xhc3MoJ3NwZWFrLW9wdGlvbicpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5ib3RSZXF1ZXN0KG9wdGlvbl90ZXh0KTtcblxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcblxuICAgICAgICAgICAgZGl2X29wdGlvbnMuYXBwZW5kKG9wdGlvbik7XG4gICAgICAgIH1cblxuICAgICAgICBib3hPcHRpb25zLmFkZENsYXNzKCdzcGVhay1vcHRpb24nKTtcblxuICAgICAgICB0aGlzLiQoJyNjaGF0LXdpZGdldCAuYm94LWNvbnRlbnQnKS5hbmltYXRlKHtcbiAgICAgICAgICAgIHNjcm9sbFRvcDogOTk5OTlcbiAgICAgICAgfSwgNTAwKTtcbiBcbiAgICAgICAgYm94T3B0aW9ucy5hcHBlbmQoZGl2X29wdGlvbnMpO1xuXG4gICAgfTtcblxuICAgIGx1a25hdG9yLnByb3RvdHlwZS5hY3Rpb25UcmFuc2ZlclplbmRlc2sgPSBmdW5jdGlvbihjb250ZXh0KSB7XG4gICAgICAgIHZhciBzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNjcmlwdFwiKTtcbiAgICAgICAgcy50eXBlID0gXCJ0ZXh0L2phdmFzY3JpcHRcIjtcbiAgICAgICAgcy5zcmMgPSBjb250ZXh0Wyd1cmxfemVuZGVzayddO1xuICAgICAgICBzLmlkID0gXCJ6ZS1zbmlwcGV0XCI7XG4gICAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kKHMpO1xuICAgICAgICBcbiAgICAgICAgdmFyIHdhaXRGb3Jab3BpbSA9IHNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICB3aW5kb3cuJHpvcGltID09PSB1bmRlZmluZWQgfHxcbiAgICAgICAgICAgICAgICB3aW5kb3cuJHpvcGltLmxpdmVjaGF0ID09PSB1bmRlZmluZWQgfHxcbiAgICAgICAgICAgICAgICB3aW5kb3cuJHpvcGltLmxpdmVjaGF0LmRlcGFydG1lbnRzID09PSB1bmRlZmluZWRcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgICAgICB6RShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgJHpvcGltKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEkem9waW0ubGl2ZWNoYXQuaXNDaGF0dGluZygpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkem9waW0ubGl2ZWNoYXQuY2xlYXJBbGwoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgJHpvcGltLmxpdmVjaGF0LnNldE9uQ29ubmVjdGVkKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICR6b3BpbS5saXZlY2hhdC5kZXBhcnRtZW50cy5zZXRWaXNpdG9yRGVwYXJ0bWVudChjb250ZXh0WydkZXBhcnRtZW50J10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnRGVwYXJ0bWVudD09PicsIGNvbnRleHRbJ2RlcGFydG1lbnQnXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnRGVwYXJ0bWVudCBUYWc9PT4nLCAgY29udGV4dFsnZGVwYXJ0bWVudF90YWcnXSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb250ZXh0WydvcmRlcl9pZCddKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHpvcGltLmxpdmVjaGF0LmFkZFRhZ3MoXCJwZWRpZG9fXCIgKyBjb250ZXh0WydvcmRlcl9pZCddLCBcImNwZl9cIiArIGNvbnRleHRbJ2N1c3RvbWVyX2NwZiddLCBjb250ZXh0WydkZXBhcnRtZW50X3RhZyddKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHpvcGltLmxpdmVjaGF0LmFkZFRhZ3MoXCJjcGZfXCIgKyBjb250ZXh0WydjdXN0b21lcl9jcGYnXSwgY29udGV4dFsnZGVwYXJ0bWVudF90YWcnXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICR6b3BpbS5saXZlY2hhdC5zZXQoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGNvbnRleHRbJ2N1c3RvbWVyX25hbWUnXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbWFpbDogY29udGV4dFsnY3VzdG9tZXJfZW1haWwnXVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICR6b3BpbS5saXZlY2hhdC53aW5kb3cuc2hvdygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRlcGFydG1lbnRfaW5mbyA9ICR6b3BpbS5saXZlY2hhdC5kZXBhcnRtZW50cy5nZXREZXBhcnRtZW50KGNvbnRleHRbJ2RlcGFydG1lbnQnXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZihkZXBhcnRtZW50X2luZm8uc3RhdHVzID09PSBcIm9ubGluZVwiICYmIChjb250ZXh0Wyd0b2dnbGVfb3ZlcmZsb3dfbWVzc2FnZSddID09IHRydWUgfHwgY29udGV4dFsndG9nZ2xlX292ZXJmbG93X21lc3NhZ2UnXSA9PSBcInRydWVcIikpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR6b3BpbS5saXZlY2hhdC5zYXkoY29udGV4dFsnb3ZlcmZsb3dfbWVzc2FnZSddKVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHRoaXMuJCgnI2NoYXQtd2lkZ2V0JykuYWRkQ2xhc3MoJ291dCcpO1xuICAgICAgICAgICAgdGhpcy4kKCcjY2hhdC13aWRnZXQnKS5yZW1vdmVDbGFzcygnZnVsbCcpO1xuICAgICAgICAgICAgaWYoaXNNb2JpbGUpIHsgdGhpcy4kKCdodG1sJykucmVtb3ZlQ2xhc3MoJ2ktYW1waHRtbC1zY3JvbGwtZGlzYWJsZWQnKTsgfVxuXG4gICAgICAgICAgICBjbGVhckludGVydmFsKHdhaXRGb3Jab3BpbSk7XG4gICAgICAgIH0sIDEwMCk7XG4gICAgfTtcblxuICAgIGx1a25hdG9yLnByb3RvdHlwZS5jcmVhdGVNZXNzYWdlID0gZnVuY3Rpb24oY2xhc3NOYW1lLCByZXN1bHQpIHtcbiAgICAgICAgdGhpcy4kKCcjY2hhdC13aWRnZXQnKS5yZW1vdmVDbGFzcygnb3V0Jyk7XG4gICAgICAgIGlmIChyZXN1bHQuaGFzT3duUHJvcGVydHkoJ2NvbnRleHQnKSAmJiByZXN1bHQuY29udGV4dC5oYXNPd25Qcm9wZXJ0eSgnd2FpdF9hdHRlbmRhbnQnKSl7XG4gICAgICAgICAgICB0aGlzLiQoJyNjaGF0LXdpZGdldCAudXNlci1pbnB1dCcpLnByb3AoJ2Rpc2FibGVkJywgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgXG5cdC8vIGV4cG9zZSBib3QgdGFnXG4gICAgICAgIHdpbmRvdy5Cb3RUYWcgPSByZXN1bHQudGFnO1xuXHRpZiAodGhpcy50YWdDYWxsYmFjayAmJiBjbGFzc05hbWUgPT0gJ2JvdCcpIHtcblx0ICAgIHRoaXMudGFnQ2FsbGJhY2socmVzdWx0LnRhZyk7XG5cdH1cblx0XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgcmVzdWx0LnJlc3BvbnNlcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgdmFyIHRleHQgPSByZXN1bHQucmVzcG9uc2VzW2pdO1xuICAgICAgICAgICAgdmFyIGZ1bGxDbGFzc05hbWUgPSAnY2hhdC1pdGVtICcgKyBjbGFzc05hbWU7XG4gICAgICAgICAgICB2YXIgY2hhdEl0ZW0gPSB0aGlzLiQoJzxkaXY+Jywge1xuICAgICAgICAgICAgICAgJ2NsYXNzJzogZnVsbENsYXNzTmFtZVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHZhciBzcGFuID0gdGhpcy4kKCc8c3Bhbj4nKTtcblxuICAgICAgICAgICAgaWYgKGNsYXNzTmFtZSA9PSAnYm90Jykge1xuICAgICAgICAgICAgICAgIHZhciBhdmF0YXIgPSB0aGlzLiQoJzxkaXY+Jywge1xuICAgICAgICAgICAgICAgICAgICAnY2xhc3MnOiAnYXZhdGFyJ1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHZhciBpbWcgPSB0aGlzLiQoJzxpbWc+JylcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ3NyYycsIHRoaXMuYm90X2J1YmJsZSlcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2RyYWdnYWJsZScsICdmYWxzZScpO1xuICAgICAgICAgICAgICAgIGF2YXRhci5hcHBlbmQoaW1nKTtcbiAgICAgICAgICAgICAgICBjaGF0SXRlbS5hcHBlbmQoYXZhdGFyKTtcbiAgICAgICAgICAgICAgICBzcGFuLmh0bWwodGV4dCk7XG4gICAgICAgICAgICAgICAgJCgnI2NoYXQtd2lkZ2V0IC51c2VyLWlucHV0JykuZm9jdXMoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc3Bhbi50ZXh0KHRleHQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgc3BlYWsgPSB0aGlzLiQoJzxkaXY+Jywge1xuICAgICAgICAgICAgICAgICdjbGFzcyc6ICdzcGVhaydcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgc3BlYWsuYXBwZW5kKHNwYW4pO1xuICAgICAgICAgICAgY2hhdEl0ZW0uYXBwZW5kKHNwZWFrKTtcblxuICAgICAgICAgICAgdGhpcy4kKCcjY2hhdC13aWRnZXQgLmNoYXQtY29udGVudCcpLmFwcGVuZChjaGF0SXRlbSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChyZXN1bHQudHJ5X2NiICE9IG51bGwgJiYgcmVzdWx0LnRyeV9jYiA+IDApIHtcbiAgICAgICAgICAgIGlmIChyZXN1bHQudHJ5X2NiID09IDEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFjdGlvbkRpc3BsYXlPcHRpb25zKHtcIm9wdGlvbnNcIjogW1wiRmFsYXIgY29tIGF0ZW5kZW50ZVwiLCBcIk7Do28gcHJlY2lzYVwiXSB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hY3Rpb25EaXNwbGF5T3B0aW9ucyh7XCJvcHRpb25zXCI6IFtcIkZhbGFyIGNvbSBhdGVuZGVudGVcIiwgXCJBdMOpIG1haXMgdGFyZGVcIl0gfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyZXN1bHQuYWN0aW9ucykge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZXN1bHQuYWN0aW9ucy5sZW5ndGg7IGkrKykge1xuXG4gICAgICAgICAgICAgICAgdmFyIGFjdGlvbiA9IHJlc3VsdC5hY3Rpb25zW2ldO1xuXG4gICAgICAgICAgICAgICAgaWYgKGFjdGlvbi50eXBlID09ICdhdXRvX3JlcGx5Jykge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnQVVUTyBSRVBMWScpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYm90UmVxdWVzdCgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChhY3Rpb24udHlwZSA9PSAnb3B0aW9uJyB8fCBhY3Rpb24udHlwZSA9PSAnZGlzcGxheV9vcHRpb25zJykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFjdGlvbkRpc3BsYXlPcHRpb25zKGFjdGlvbik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGFjdGlvbi50eXBlID09ICd0cmFuc2Zlcl96ZW5kZXNrJykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFjdGlvblRyYW5zZmVyWmVuZGVzayhyZXN1bHQuY29udGV4dCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGFjdGlvbi50eXBlID09ICdjbG9zZV9jaGF0Jykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFjdGlvbkNsb3NlQ2hhdCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuJCgnI2NoYXQtd2lkZ2V0IC5ib3gtY29udGVudCcpLmFuaW1hdGUoe1xuICAgICAgICAgICAgc2Nyb2xsVG9wOiA5OTk5OVxuICAgICAgICB9LCAwKTtcblxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBtYWluKHBhcmFtcykge1xuICAgICAgICB3aW5kb3cualF1ZXJ5KGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbigkKSB7XG5cbiAgICAgICAgICAgIGlmICghd2luZG93Ll9sdWtuYXRvcikge1xuICAgICAgICAgICAgICAgIHZhciBjc3NMaW5rID0gJCgnPGxpbms+Jywge1xuICAgICAgICAgICAgICAgICAgICByZWw6ICdzdHlsZXNoZWV0JyxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3RleHQvY3NzJyxcbiAgICAgICAgICAgICAgICAgICAgaHJlZjogd2luZG93Lmx1a25hdG9yUGFyYW1zLmNzc1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNzc0xpbmsuYXBwZW5kVG8oJ2hlYWQnKTtcbiAgICAgICAgICAgICAgICB3aW5kb3cuX2x1a25hdG9yID0gbmV3IGx1a25hdG9yKCQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvLy8vLy8vLy8vLy9cbiAgICAvLyBMb2FkZXIgLy9cbiAgICAvLy8vLy8vLy8vLy9cbiAgICB2YXIgalF1ZXJ5O1xuICAgIGlmICh3aW5kb3cualF1ZXJ5ID09PSB1bmRlZmluZWQgfHwgd2luZG93LmpRdWVyeS5mbi5qcXVlcnkgIT09ICcxLjEyLjQnKSB7XG5cbiAgICAgICAgdmFyIHNjcmlwdF90YWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcblxuICAgICAgICBzY3JpcHRfdGFnLnNldEF0dHJpYnV0ZSgndHlwZScsICd0ZXh0L2phdmFzY3JpcHQnKTtcbiAgICAgICAgc2NyaXB0X3RhZy5zZXRBdHRyaWJ1dGUoXG4gICAgICAgICAgICAnc3JjJyxcbiAgICAgICAgICAgICcvL2FqYXguZ29vZ2xlYXBpcy5jb20vYWpheC9saWJzL2pxdWVyeS8xLjEyLjQvanF1ZXJ5Lm1pbi5qcydcbiAgICAgICAgKTtcblxuICAgICAgICBpZiAoc2NyaXB0X3RhZy5yZWFkeVN0YXRlKSB7XG4gICAgICAgICAgICBzY3JpcHRfdGFnLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkgeyAvLyBGb3Igb2xkIHZlcnNpb25zIG9mIElFXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucmVhZHlTdGF0ZSA9PSAnY29tcGxldGUnIHx8IHRoaXMucmVhZHlTdGF0ZSA9PSAnbG9hZGVkJykge1xuICAgICAgICAgICAgICAgICAgICBzY3JpcHRMb2FkSGFuZGxlcigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzY3JpcHRfdGFnLm9ubG9hZCA9IHNjcmlwdExvYWRIYW5kbGVyO1xuICAgICAgICB9XG4gICAgICAgIChkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdIHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCkuYXBwZW5kQ2hpbGQoc2NyaXB0X3RhZyk7XG5cbiAgICB9IGVsc2Uge1xuICAgICAgICBqUXVlcnkgPSB3aW5kb3cualF1ZXJ5O1xuICAgICAgICBtYWluKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2NyaXB0TG9hZEhhbmRsZXIoKSB7XG4gICAgICAgIGpRdWVyeSA9IHdpbmRvdy5qUXVlcnkubm9Db25mbGljdCh0cnVlKTtcbiAgICAgICAgbWFpbigpO1xuICAgIH07XG5cbn0pKCk7Il19
