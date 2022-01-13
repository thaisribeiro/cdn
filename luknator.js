var JuarezPlugin = function ($) {
  "use strict";
  var name = "juarez",
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
      animationTimingFunc: "cubic-bezier(0.165, 0.840, 0.440, 1.000)",

      /**
       * {Bool or String} Show/hide/appendTo arrows
       * True for append arrows to slider wrapper
       * False for not appending arrows
       * Id or class name (e.g. '.class-name') for appending to specific HTML markup
       */
      arrows: true,
      // {String} Arrows wrapper class
      arrowsWrapperClass: "slider__arrows",
      // {String} Main class for both arrows
      arrowMainClass: "slider__arrows-item",
      // {String} Right arrow
      arrowRightClass: "slider__arrows-item--right",
      // {String} Right arrow text
      arrowRightText: "next",
      // {String} Left arrow
      arrowLeftClass: "slider__arrows-item--left",
      // {String} Left arrow text
      arrowLeftText: "prev",

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
      navigationClass: "slider__nav",
      // {String} Navigation item class
      navigationItemClass: "slider__nav-item",
      // {String} Current navigation item class
      navigationCurrentItemClass: "slider__nav-item--current",

      // {String} show slider after load image
      sliderVisibleClass: "slider__visible",

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
      afterTransition: function () {},
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
    this.cssSupport =
      !this.css.isSupported("transition") || !this.css.isSupported("transform")
        ? false
        : true;
    // If circular set offset, two cloned slides
    this.offset = this.options.circular ? 2 : 0;

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
        return -self.currentSlide + 1;
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
        self.options.navigation = target ? target : self.options.navigation;
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
        self.options.arrows = target ? target : self.options.arrows;
        // Build
        self.arrows();
      },
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
    this.firstClone = this.slides
      .filter(":first-child")
      .clone()
      .width(this.slides.spread);
    this.lastClone = this.slides
      .filter(":last-child")
      .clone()
      .width(this.slides.spread);

    /**
     * Append clodes slides to slider wrapper at the beginning and end
     * Increase wrapper with with values of addional slides
     * Clear translate and skip cloned last slide at the beginning
     */
    this.wrapper
      .append(this.firstClone)
      .prepend(this.lastClone)
      .width(this.parent.width() * (this.slides.length + 2))
      .trigger("clearTransition")
      .trigger("setTranslate", [-this.slides.spread]);
  };

  /**
   * Building navigation DOM
   */
  Juarez.prototype.navigation = function () {
    var i;
    this.navigation.items = {};

    // Navigation wrapper
    this.navigation.wrapper = $("<div />", {
      class: this.options.navigationClass,
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
      this.navigation.items[i] = $("<a />", {
        href: "#",
        class: this.options.navigationItemClass,
        // Direction and distance -> Item index forward
        "data-distance": i,
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
        left: "50%",
        width:
          this.navigation.wrapper.children().outerWidth(true) *
          this.navigation.wrapper.children().length,
        "margin-left": -(this.navigation.wrapper.outerWidth(true) / 2),
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
    this.arrows.wrapper = $("<div />", {
      class: this.options.arrowsWrapperClass,
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
    this.arrows.right = $("<div />", {
      class: this.options.arrowMainClass + " " + this.options.arrowRightClass,
      // Direction and distance -> One forward
      "data-distance": "1",
      html: this.options.arrowRightText,
    }).appendTo(this.arrows.wrapper);

    /**
     * Left arrow
     * @type {Object}
     */
    this.arrows.left = $("<div />", {
      class: this.options.arrowMainClass + " " + this.options.arrowLeftClass,
      // Direction and distance -> One backward
      "data-distance": "-1",
      html: this.options.arrowLeftText,
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
      setTransition: function () {
        $(this).css(
          prefix + "transition",
          prefix +
            "transform " +
            o.animationDuration +
            "ms " +
            o.animationTimingFunc
        );
      },

      /**
       * Clear transition
       * for immediate jump effect
       */
      clearTransition: function () {
        $(this).css(prefix + "transition", "none");
      },

      /**
       * Set translate value
       * @param  {Object} event
       * @param  {Ind} translate
       */
      setTranslate: function (event, translate) {
        // if css3 suported set translate3d
        if (self.cssSupport)
          $(this).css(
            prefix + "transform",
            "translate3d(" + translate + "px, 0px, 0px)"
          );
        // if not set left margin
        else $(this).css("margin-left", translate);
      },
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
        "touchstart MSPointerDown": $.proxy(this.events.touchstart, this),
        "touchmove MSPointerMove": $.proxy(this.events.touchmove, this),
        "touchend MSPointerUp": $.proxy(this.events.touchend, this),
      });
    }

    /**
     * Arrows
     * If arrows exists
     * Attach click event
     */
    if (this.arrows.wrapper) {
      $(this.arrows.wrapper)
        .children()
        .on("click touchstart", $.proxy(this.events.arrows, this));
    }

    /**
     * Navigation
     * If navigation exists
     * Attach click event
     */
    if (this.navigation.wrapper) {
      $(this.navigation.wrapper)
        .children()
        .on("click touchstart", $.proxy(this.events.navigation, this));
    }

    /**
     * Keyboard
     * If keyboard option is true
     * Attach press event
     */
    if (this.options.keyboard) {
      $(document).on("keyup.juarezKeyup", $.proxy(this.events.keyboard, this));
    }

    /**
     * Slider hover
     * If hover option is true
     * Attach hover event
     */
    if (this.options.hoverpause) {
      this.parent.on("mouseover mouseout", $.proxy(this.events.hover, this));
    }

    /**
     * Slider resize
     * On window resize
     * Attach resize event
     */
    $(window).on("resize", $.proxy(this.events.resize, this));
  };

  /**
   * Navigation event controller
   * On click in navigation item get distance
   * Then slide specified distance with jump
   */
  Juarez.prototype.events.navigation = function (event) {
    if (!this.wrapper.attr("disabled")) {
      // Prevent default behaviour
      event.preventDefault();
      // Slide distance specified in data attribute
      this.slide($(event.currentTarget).data("distance"), true);
    }
  };

  /**
   * Arrows event controller
   * On click in arrows get direction and distance
   * Then slide specified distance without jump
   * @param  {Obejct} event
   */
  Juarez.prototype.events.arrows = function (event) {
    if (!this.wrapper.attr("disabled")) {
      // Prevent default behaviour
      event.preventDefault();
      // Slide distance specified in data attribute
      this.slide($(event.currentTarget).data("distance"), false);
    }
  };

  /**
   * Keyboard arrows event controller
   * Keyboard left and right arrow keys press
   */
  Juarez.prototype.events.keyboard = function (event) {
    if (!this.wrapper.attr("disabled")) {
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
    if (event.type === "mouseout") {
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
    if (!this.wrapper.attr("disabled")) {
      // Cache event
      var touch =
        event.originalEvent.touches[0] || event.originalEvent.changedTouches[0];

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
    if (!this.wrapper.attr("disabled")) {
      // Cache event
      var touch =
        event.originalEvent.touches[0] || event.originalEvent.changedTouches[0];

      // Calculate start, end points
      var subExSx = touch.pageX - this.events.touchStartX;
      var subEySy = touch.pageY - this.events.touchStartY;
      // Bitwise subExSx pow
      var powEX = Math.abs(subExSx << 2);
      // Bitwise subEySy pow
      var powEY = Math.abs(subEySy << 2);
      // Calculate the length of the hypotenuse segment
      var touchHypotenuse = Math.sqrt(powEX + powEY);
      // Calculate the length of the cathetus segment
      var touchCathetus = Math.sqrt(powEY);

      // Calculate the sine of the angle
      this.events.touchSin = Math.asin(touchCathetus / touchHypotenuse);

      if (this.events.touchSin * (180 / Math.PI) < 45) event.preventDefault();
    }
  };

  /**
   * Touch end
   * @param  {Object} e event
   */
  Juarez.prototype.events.touchend = function (event) {
    if (!this.wrapper.attr("disabled")) {
      // Cache event
      var touch =
        event.originalEvent.touches[0] || event.originalEvent.changedTouches[0];

      // Calculate touch distance
      var touchDistance = touch.pageX - this.events.touchStartX;

      // While touch is positive and greater than distance set in options
      if (
        touchDistance > this.options.touchDistance &&
        this.events.touchSin * (180 / Math.PI) < 45
      ) {
        // Slide one backward
        this.slide(-1);
        // While touch is negative and lower than negative distance set in options
      } else if (
        touchDistance < -this.options.touchDistance &&
        this.events.touchSin * (180 / Math.PI) < 45
      ) {
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
  Juarez.prototype.slide = function (distance, jump, callback) {
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
      currentSlide = jump ? 0 : this.currentSlide,
      slidesLength = -(this.slides.length - 1),
      fromFirst = false,
      fromLast = false;

    /**
     * Check if current slide is first and direction is previous, then go to last slide
     * or current slide is last and direction is next, then go to the first slide
     * else change current slide normally
     */
    if (currentSlide === 0 && distance === -1) {
      fromFirst = true;
      currentSlide = slidesLength;
    } else if (currentSlide === slidesLength && distance === 1) {
      fromLast = true;
      currentSlide = 0;
    } else {
      currentSlide = currentSlide + -distance;
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
    if (this.cssSupport)
      this.wrapper.trigger("setTransition").trigger("setTranslate", [offset]);
    else
      this.wrapper
        .stop()
        .animate({ "margin-left": offset }, this.options.animationDuration);

    /**
     * While circular
     */
    if (this.options.circular) {
      /**
       * 	When fromFirst and fromLast flags are set
       * 	after animation clear transition and bind events that control slides changing
       */
      if (fromFirst || fromLast) {
        this.afterAnimation(function () {
          self.wrapper.trigger("clearTransition");
          self.enableEvents();
        });
      }

      /**
       * When fromLast flag is set
       * after animation make immediate jump from cloned slide to proper one
       */
      if (fromLast) {
        this.afterAnimation(function () {
          fromLast = false;
          self.wrapper.trigger("setTranslate", [-self.slides.spread]);
        });
      }

      /**
       * When fromFirst flag is set
       * after animation make immediate jump from cloned slide to proper one
       */
      if (fromFirst) {
        this.afterAnimation(function () {
          fromFirst = false;
          self.wrapper.trigger("setTranslate", [
            self.slides.spread * (slidesLength - 1),
          ]);
        });
      }
    }

    // Set to navigation item current class
    if (this.options.navigation && this.navigation.wrapper) {
      $(
        "." + this.options.navigationClass,
        this.options.navigation === true ? this.parent : this.options.navigation
      )
        .children()
        .eq(-currentSlide)
        .addClass(this.options.navigationCurrentItemClass)
        .siblings()
        .removeClass(this.options.navigationCurrentItemClass);
    }

    // Update current slide globaly
    this.currentSlide = currentSlide;

    // Callbacks after slide change
    this.afterAnimation(function () {
      self.options.afterTransition.call(self);
      if (callback !== "undefined" && typeof callback === "function")
        callback();
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
  Juarez.prototype.afterAnimation = function (callback) {
    setTimeout(function () {
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
    this.slides
      .add(this.firstClone)
      .add(this.lastClone)
      .width(this.slides.spread);
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

    if (this.options.circular) {
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
    isSupported: function (declaration) {
      var isSupported = false,
        prefixes = "Khtml ms O Moz Webkit".split(" "),
        clone = document.createElement("div"),
        declarationCapital = null;

      declaration = declaration.toLowerCase();
      if (clone.style[declaration] !== undefined) isSupported = true;
      if (isSupported === false) {
        declarationCapital =
          declaration.charAt(0).toUpperCase() + declaration.substr(1);
        for (var i = 0; i < prefixes.length; i++) {
          if (clone.style[prefixes[i] + declarationCapital] !== undefined) {
            isSupported = true;
            break;
          }
        }
      }

      if (window.opera) {
        if (window.opera.version() < 13) isSupported = false;
      }

      if (isSupported === "undefined" || isSupported === undefined)
        isSupported = false;

      return isSupported;
    },

    /**
     * Get browser css prefix
     * @return {String} 	Returns prefix in "-{prefix}-" format
     */
    getPrefix: function () {
      if (!window.getComputedStyle) return "";

      var styles = window.getComputedStyle(document.documentElement, "");
      return (
        "-" +
        (Array.prototype.slice
          .call(styles)
          .join("")
          .match(/-(moz|webkit|ms)-/) ||
          (styles.OLink === "" && ["", "o"]))[1] +
        "-"
      );
    },
  };

  $.fn[name] = function (options) {
    return this.each(function () {
      if (!$.data(this, "")) {
        $.data(this, "", new Juarez($(this), options));
      }
    });
  };
};

(function () {
  luknator = function ($) {
    this.$ = $;
    this.configure();
    this.build();
  };

  var isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  luknator.prototype.configure = function () {
    this.conversationId = null;
    this.waitingResponse = false;
    this.initGoogleMaps();

    var params = window.luknatorParams;
    if (typeof params == "object") {
      this.url = params.url;
      this.bt_close = params.bt_close;
      this.bt_send = params.bt_send;
      this.bot_coin = params.bot_coin;
      this.bot_bubble = params.bot_bubble;
      this.title = params.title;
      this.tagCallback = params.tagCallback;
    }
  };

  luknator.prototype.initGoogleMaps = function (action) {
    window.initMap = function () {
      window.googleMapsInitialized = true;
    };

    this.$("head").append(
      "<script async defer " +
        'src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCv6sHnl3ystc7J2tMpETUS---uOuvLFBg&callback=initMap">' +
        "</script>"
    );
  };

  luknator.prototype.build = function () {
    /////////////////
    // CHANGE THIS //
    var holyHTML =
      '<div class="box-header"><div class="title"><h2>' +
      this.title +
      '</h2></div><div class="close-button"><i class="close svg-close-chat" style="cursor:pointer"></i></div></div><div class="box-content"><div class="box-alert"></div><div class="chat-content"><div class="chat-item bot"><div class="box-options"/></div></div></div><div class="box-footer"><div class="form-area"><div class="box-input"><div class="input-wrapper"><button id="submitchat" class="submit-chat"></button><input class="user-input" type="text" data-emojiable="true" placeholder="Escreva sua mensagem..."></div></div></div></div>';
    /////////////////

    var chatWidget = this.$("<div/>", {
      id: "chat-widget",
      class: "userchat-ui out",
    });
    chatWidget.html(holyHTML);

    // Coin
    var coinDiv = this.$("<div/>", {
      id: "chat-coin-icon",
    });
    var coinContainer = this.$("<div/>", {
      class: "avatar-container",
    });
    var coinImg = this.$("<img/>", {
      src: this.bot_coin,
      draggable: "false",
    });
    coinContainer.append(coinImg);
    coinDiv.append(coinContainer);

    this.$("luknator-container").append(chatWidget);
    this.$("luknator-container").append(coinDiv);

    // Button Close
    this.$(".box-header .close-button").css(
      "background",
      "url(" + this.bt_close + ")"
    );

    // Button Send
    this.$(".submit-chat").css("background-image", "url(" + this.bt_send + ")");

    this.bind();

    var urlParams = new URLSearchParams(window.location.search);
    var openChat = urlParams.get("openChat");

    if (openChat) {
      $("#chat-coin-icon").click();
    }
  };

  luknator.prototype.bind = function () {
    var hide_alert_delay = 60000;

    //Bind Input
    this.$(".user-input").focusin(
      function () {
        this.$("#chat-coin-icon").addClass("out");
        this.$("#chat-widget").addClass("full");
      }.bind(this)
    );

    // Bind Coin
    this.$("#chat-coin-icon")
      .off()
      .on(
        "click",
        function () {
          this.handleCookieUserUnique();
          if ($(".box-alert").length) {
            setTimeout(function () {
              $(".box-alert").slideUp("slow", function () {
                $(this).remove();
              });
            }, hide_alert_delay);
          }

          if (ml2_sid_c != undefined) {
            this.url += "?ml2_sid_c=" + ml2_sid_c;
          }

          if (this.$("#chat-widget").hasClass("out") === true) {
            if (!luknator.conversationId && !this.waitingResponse) {
              this.waitingResponse = true;
              this.$.ajax({
                mode: "cors",
                url: this.url,
              })
                .done(
                  function (result) {
                    this.setMessageAndAlert(result);
                  }.bind(this)
                )
                .fail(
                  function (result) {
                    result = result.responseJSON;
                    this.setMessageAndAlert(result);
                  }.bind(this)
                );
            } else {
              this.$("#chat-widget").removeClass("out");
              if (isMobile) {
                this.$("html").css("overflow", "hidden");
              }
            }
          } else {
            this.$("#chat-widget").addClass("out");
            if (isMobile) {
              this.$("html").css("overflow", "auto");
            }
          }
        }.bind(this)
      );

    // Bind Close
    this.$("#chat-widget .close-button")
      .off()
      .on(
        "click",
        function () {
          this.$("#chat-coin-icon").removeClass("out");
          this.$("#chat-widget").addClass("out");
          this.$("#chat-widget").removeClass("full");
          if (isMobile) {
            this.$("html").removeClass("i-amphtml-scroll-disabled");
          }
        }.bind(this)
      );

    // Bind Click Submit
    this.$("#chat-widget .submit-chat")
      .off()
      .on(
        "click",
        function () {
          this.cleanMessage();
        }.bind(this)
      );

    // Bind text Area
    this.$("#chat-widget .user-input").keyup(
      function (e) {
        if (e.keyCode == 13) {
          this.cleanMessage();
        }
      }.bind(this)
    );

    luknator.prototype.setMessageAndAlert = function (result) {
      luknator.conversationId = result.conversation_id;
      if (result.try_cb != null) {
        luknator.try_cb = result.try_cb;
      }
      this.createMessage("bot", result);
      this.waitingResponse = false;
      if (result.message_alert.length > 0) {
        this.$(".box-alert").addClass("box-alert-style");
        this.$(".box-alert").append(result.message_alert);
      }
      if (isMobile) {
        this.$("html").css("overflow", "hidden");
      }
    };

    luknator.prototype.sendText = function () {
      var usertext = this.$("#chat-widget .user-input").val();

      this.createMessage("user", {
        responses: [usertext],
      });

      this.$("#chat-widget .user-input").val("");
      this.$(".options").remove();
      this.$("#chat-coin-icon").addClass("out");
      this.$("#chat-widget").addClass("full");
      this.$(".bot .speak").last().removeClass("speak-option");

      this.botRequest(usertext);
    };

    luknator.prototype.cleanMessage = function () {
      if ($.trim($("#chat-widget .user-input").val()) != "") {
        this.sendText();
      }
    };
  };

  luknator.prototype.botRequest = function (text) {
    var boxIndicator = this.$("#chat-widget .speak").last();
    var that = this;
    var data = { conversation_id: luknator.conversationId };
    if (luknator.try_cb != null) {
      data = {
        conversation_id: luknator.conversationId,
        try_cb: luknator.try_cb,
      };
    }
    if (text) {
      data.text = text;
    }

    this.$.ajax({
      url: this.url,
      type: "POST",
      mode: "cors",
      dataType: "json",
      data: JSON.stringify(data),
      contentType: "application/json; charset=utf-8",
      success: function (result) {
        setTimeout(function () {
          $("#chat-widget .user-input").prop("disabled", false);
          $("div.float-typing").remove();
          luknator.try_cb = result.try_cb;
          return that.createMessage("bot", result);
        }, 800);
      }.bind(this),
      error: function (result) {
        console.error(
          "error processing request: " +
            result.responseText +
            "\nstatus: " +
            result.status +
            " \nstatusText:" +
            result.statusText
        );
        $("#chat-widget .user-input").prop("disabled", false);
        $("div.float-typing").remove();
        result.responses = [
          "Desculpa, estou tendo um probleminha, podemos falar mais tarde?",
        ];
        if ("responseJSON" in result) {
          var responseJSON = result.responseJSON;
          if ("conversation_id" in responseJSON) {
            luknator.conversation_id = responseJSON.conversation_id;
            result.responses = responseJSON.responses;
          }
        }
        console.log(result);
        return that.createMessage("bot", result);
      }.bind(this),
    });

    this.$("#chat-widget .user-input").prop("disabled", true);

    boxIndicator.after(
      '<div class="float-typing"><div class="typing-indicator"><span></span><span></span><span></span></div></div>'
    );
  };

  luknator.prototype.actionDisplayOptions = function (action) {
    var boxOptions = this.$("#chat-widget .speak").last();
    var options = action.options;
    var div_options = this.$("<div>", {
      class: "options",
    });

    for (var i = 0; i < options.length; i++) {
      var option_text = options[i];

      var option = this.$("<input>")
        .attr({
          type: "button",
          id: option_text,
          value: option_text,
          class: "input-option",
        })
        .off()
        .on(
          "click",
          function (button) {
            var option_text = button.target.id;
            this.createMessage("user", {
              responses: [option_text],
            });
            this.$(".options").remove();
            this.$("#chat-widget .user-input").val("");
            this.$("#chat-coin-icon").addClass("out");
            this.$("#chat-widget").addClass("full");
            boxOptions.removeClass("speak-option");

            this.botRequest(option_text);
          }.bind(this)
        );

      div_options.append(option);
    }

    boxOptions.addClass("speak-option");

    this.$("#chat-widget .box-content").animate(
      {
        scrollTop: 99999,
      },
      500
    );

    boxOptions.append(div_options);
  };

  luknator.prototype.createMessage = function (className, result) {
    this.$("#chat-widget").removeClass("out");

    // expose bot tag
    window.BotTag = result.tag;
    if (this.tagCallback && className == "bot") {
      this.tagCallback(result.tag);
    }

    for (var j = 0; j < result.responses.length; j++) {
      var text = result.responses[j];
      var fullClassName = "chat-item " + className;
      var chatItem = this.$("<div>", {
        class: fullClassName,
      });

      var span = this.$("<span>");

      if (className == "bot") {
        var avatar = this.$("<div>", {
          class: "avatar",
        });
        var img = this.$("<img>")
          .attr("src", this.bot_bubble)
          .attr("draggable", "false");
        avatar.append(img);
        chatItem.append(avatar);
        span.html(text);
      } else {
        span.text(text);
      }

      var speak = this.$("<div>", {
        class: "speak",
      });
      speak.append(span);
      chatItem.append(speak);

      this.$("#chat-widget .chat-content").append(chatItem);
    }

    if (result.try_cb != null && result.try_cb > 0) {
      if (result.try_cb == 1) {
        this.actionDisplayOptions({
          options: ["Falar com atendente", "Não precisa"],
        });
      } else {
        this.actionDisplayOptions({
          options: ["Falar com atendente", "Até mais tarde"],
        });
      }
    }

    if (result.actions) {
      for (var i = 0; i < result.actions.length; i++) {
        var action = result.actions[i];

        if (action.type == "auto_reply") {
          this.botRequest();
        }

        if (action.type == "option" || action.type == "display_options") {
          this.actionDisplayOptions(action);
        }
      }
    }

    this.$("#chat-widget .box-content").animate(
      {
        scrollTop: 99999,
      },
      0
    );
  };

  function main(params) {
    window.jQuery(document).ready(function ($) {
      if (!window._luknator) {
        var cssLink = $("<link>", {
          rel: "stylesheet",
          type: "text/css",
          href: window.luknatorParams.css,
        });
        cssLink.appendTo("head");
        window._luknator = new luknator($);
      }
    });
  }

  ////////////
  // Loader //
  ////////////
  var jQuery;
  if (window.jQuery === undefined || window.jQuery.fn.jquery !== "1.12.4") {
    var script_tag = document.createElement("script");

    script_tag.setAttribute("type", "text/javascript");
    script_tag.setAttribute(
      "src",
      "//ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js"
    );

    if (script_tag.readyState) {
      script_tag.onreadystatechange = function () {
        // For old versions of IE
        if (this.readyState == "complete" || this.readyState == "loaded") {
          scriptLoadHandler();
        }
      };
    } else {
      script_tag.onload = scriptLoadHandler;
    }
    (
      document.getElementsByTagName("head")[0] || document.documentElement
    ).appendChild(script_tag);
  } else {
    jQuery = window.jQuery;
    main();
  }

  function scriptLoadHandler() {
    jQuery = window.jQuery.noConflict(true);
    main();
  }
})();
(function () {
  luknator = function ($) {
    this.$ = $;
    this.configure();
    this.build();
  };

  var isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  var ml2_sid_c = undefined;
  var chat_user_uuid = undefined;

  luknator.prototype.configure = function () {
    this.conversationId = null;
    this.waitingResponse = false;
    this.initGoogleMaps();

    var params = window.luknatorParams;
    if (typeof params == "object") {
      this.url = params.url;
      this.bt_close = params.bt_close;
      this.bt_send = params.bt_send;
      this.bot_coin = params.bot_coin;
      this.bot_bubble = params.bot_bubble;
      this.title = params.title;
      this.tagCallback = params.tagCallback;
    }
  };

  luknator.prototype.initGoogleMaps = function (action) {
    window.initMap = function () {
      window.googleMapsInitialized = true;
    };

    this.$("head").append(
      "<script async defer " +
        'src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCv6sHnl3ystc7J2tMpETUS---uOuvLFBg&callback=initMap">' +
        "</script>"
    );
  };

  luknator.prototype.build = function () {
    /////////////////
    // CHANGE THIS //
    var holyHTML =
      '<div class="box-header"><div class="title"><h2>' +
      this.title +
      '</h2></div><div class="close-button"><i class="close svg-close-chat" style="cursor:pointer"></i></div></div><div class="box-content"><div class="box-alert"></div><div class="chat-content"><div class="chat-item bot"><div class="box-options"/></div></div></div><div class="box-footer"><div class="form-area"><div class="box-input"><div class="input-wrapper"><button id="submitchat" class="submit-chat"></button><input class="user-input" type="text" data-emojiable="true" placeholder="Escreva sua mensagem..."></div></div></div></div>';
    /////////////////

    var chatWidget = this.$("<div/>", {
      id: "chat-widget",
      class: "userchat-ui out",
    });
    chatWidget.html(holyHTML);

    // Coin
    var coinDiv = this.$("<div/>", {
      id: "chat-coin-icon",
    });
    var coinContainer = this.$("<div/>", {
      class: "avatar-container",
    });
    var coinImg = this.$("<img/>", {
      src: this.bot_coin,
      draggable: "false",
    });
    coinContainer.append(coinImg);
    coinDiv.append(coinContainer);

    this.$("luknator-container").append(chatWidget);
    this.$("luknator-container").append(coinDiv);

    // Button Close
    this.$(".box-header .close-button").css(
      "background",
      "url(" + this.bt_close + ")"
    );

    // Button Send
    this.$(".submit-chat").css("background-image", "url(" + this.bt_send + ")");

    this.bind();

    var urlParams = new URLSearchParams(window.location.search);
    var openChat = urlParams.get("openChat");

    if (openChat) {
      $("#chat-coin-icon").click();
    }
  };

  luknator.prototype.bind = function () {
    var hide_alert_delay = 60000;

    //Bind Input
    this.$(".user-input").focusin(
      function () {
        this.$("#chat-coin-icon").addClass("out");
        this.$("#chat-widget").addClass("full");
      }.bind(this)
    );

    // Bind Coin
    this.$("#chat-coin-icon")
      .off()
      .on(
        "click",
        function () {
          // verify cookies
          this.handleCookieUserUnique();

          // remove message
          if ($(".box-alert").length) {
            setTimeout(function () {
              $(".box-alert").slideUp("slow", function () {
                $(this).remove();
              });
            }, hide_alert_delay);
          }

          if (ml2_sid_c != undefined) {
            this.url += "?ml2_sid_c=" + ml2_sid_c;
          }

          if (this.$("#chat-widget").hasClass("out") === true) {
            if (!luknator.conversationId && !this.waitingResponse) {
              this.waitingResponse = true;
              this.$.ajax({
                mode: "cors",
                url: this.url,
              })
                .done(
                  function (result) {
                    this.setMessageAndAlert(result);
                  }.bind(this)
                )
                .fail(
                  function (result) {
                    result = result.responseJSON;
                    this.setMessageAndAlert(result);
                  }.bind(this)
                );
            } else {
              this.$("#chat-widget").removeClass("out");
              if (isMobile) {
                this.$("html").css("overflow", "hidden");
              }
            }
          } else {
            this.$("#chat-widget").addClass("out");
            if (isMobile) {
              this.$("html").css("overflow", "auto");
            }
          }
        }.bind(this)
      );

    // Bind Close
    this.$("#chat-widget .close-button")
      .off()
      .on(
        "click",
        function () {
          this.$("#chat-coin-icon").removeClass("out");
          this.$("#chat-widget").addClass("out");
          this.$("#chat-widget").removeClass("full");
          if (isMobile) {
            this.$("html").removeClass("i-amphtml-scroll-disabled");
          }
        }.bind(this)
      );

    // Bind Click Submit
    this.$("#chat-widget .submit-chat")
      .off()
      .on(
        "click",
        function () {
          this.cleanMessage();
        }.bind(this)
      );

    // Bind text Area
    this.$("#chat-widget .user-input").keyup(
      function (e) {
        if (e.keyCode == 13) {
          this.cleanMessage();
        }
      }.bind(this)
    );
    luknator.prototype.handleCookieUserUnique = function () {
      var cookies = document.cookie.split(";");
      if (cookies.find((el) => el.includes("ml2_sid_c"))) {
        b = cookies.find((el) => el.includes("ml2_sid_c"));
        ml2_sid_c = decodeURIComponent(b.replace("ml2_sid_c=", ""));
      }

      return true;
    };

    luknator.prototype.setCookie = function (name, value, expDays) {
      var date = new Date();
      date.setTime(date.getDate() + expDays * 24 * 60 * 60 * 1000);
      document.cookie = name + "=" + value;
    };

    luknator.prototype.setMessageAndAlert = function (result) {
      luknator.conversationId = result.conversation_id;
      if (result.try_cb != null) {
        luknator.try_cb = result.try_cb;
      }
      this.createMessage("bot", result);
      this.waitingResponse = false;
      this.$(".box-alert").append(result.message_alert);
      if (isMobile) {
        this.$("html").css("overflow", "hidden");
      }
    };

    luknator.prototype.sendText = function () {
      var usertext = this.$("#chat-widget .user-input").val();

      this.createMessage("user", {
        responses: [usertext],
      });

      this.$("#chat-widget .user-input").val("");
      this.$(".options").remove();
      this.$("#chat-coin-icon").addClass("out");
      this.$("#chat-widget").addClass("full");
      this.$(".bot .speak").last().removeClass("speak-option");

      this.botRequest(usertext);
    };

    luknator.prototype.cleanMessage = function () {
      if ($.trim($("#chat-widget .user-input").val()) != "") {
        this.sendText();
      }
    };
  };

  luknator.prototype.botRequest = function (text) {
    var boxIndicator = this.$("#chat-widget .speak").last();
    var that = this;
    var data = { conversation_id: luknator.conversationId };
    if (luknator.try_cb != null) {
      data = {
        conversation_id: luknator.conversationId,
        try_cb: luknator.try_cb,
      };
    }
    if (text) {
      data.text = text;
    }

    if (this.url.indexOf("jupiter") !== -1) {
      data.wa_id = "553492397895";
    }

    this.$.ajax({
      url: this.url,
      type: "POST",
      mode: "cors",
      dataType: "json",
      data: JSON.stringify(data),
      contentType: "application/json; charset=utf-8",
      success: function (result) {
        setTimeout(function () {
          $("#chat-widget .user-input").prop("disabled", false);
          $("div.float-typing").remove();
          luknator.try_cb = result.try_cb;
          return that.createMessage("bot", result);
        }, 800);
      }.bind(this),
      error: function (result) {
        if (result.responseText.indexOf("html") != -1) {
          result.responses = [
            "Hummm! Tô com um probleminha aqui nos meus algorítimos e não peguei o que vc me mandou. Pode escrever outra vez?",
          ];
        } else {
          result.responses = JSON.parse(result.responseText).responses;
        }

        console.error(
          "error processing request: " +
            result.responses +
            "\nstatus: " +
            result.status +
            " \nstatusText:" +
            result.statusText
        );

        $("#chat-widget .user-input").prop("disabled", false);
        $("div.float-typing").remove();

        if ("responseJSON" in result) {
          var responseJSON = result.responseJSON;
          if ("conversation_id" in responseJSON) {
            luknator.conversation_id = responseJSON.conversation_id;
            result.responses = responseJSON.responses;
          }
        }
        console.log(result);
        return that.createMessage("bot", result);
      }.bind(this),
    });

    this.$("#chat-widget .user-input").prop("disabled", true);

    boxIndicator.after(
      '<div class="float-typing"><div class="typing-indicator"><span></span><span></span><span></span></div></div>'
    );
  };

  luknator.prototype.actionCloseChat = function (action) {
    this.$("#chat-widget").addClass("out");
  };

  luknator.prototype.actionDisplayOptions = function (action) {
    var boxOptions = this.$("#chat-widget .speak").last();
    var options = action.options;
    var div_options = this.$("<div>", {
      class: "options",
    });

    for (var i = 0; i < options.length; i++) {
      var option_text = options[i];

      var option = this.$("<input>")
        .attr({
          type: "button",
          id: option_text,
          value: option_text,
          class: "input-option",
        })
        .off()
        .on(
          "click",
          function (button) {
            var option_text = button.target.id;
            this.createMessage("user", {
              responses: [option_text],
            });
            this.$(".options").remove();
            this.$("#chat-widget .user-input").val("");
            this.$("#chat-coin-icon").addClass("out");
            this.$("#chat-widget").addClass("full");
            boxOptions.removeClass("speak-option");

            this.botRequest(option_text);
          }.bind(this)
        );

      div_options.append(option);
    }

    boxOptions.addClass("speak-option");

    this.$("#chat-widget .box-content").animate(
      {
        scrollTop: 99999,
      },
      500
    );

    boxOptions.append(div_options);
  };

  luknator.prototype.actionTransferZendesk = function (context) {
    var s = document.createElement("script");
    s.type = "text/javascript";
    s.src = context["url_zendesk"];
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
            $zopim.livechat.departments.setVisitorDepartment(
              context["department"]
            );

            console.log("Department==>", context["department"]);
            console.log("Department Tag==>", context["department_tag"]);

            if (context["order_id"]) {
              $zopim.livechat.addTags(
                "pedido_" + context["order_id"],
                "cpf_" + context["customer_cpf"],
                context["department_tag"]
              );
            } else {
              $zopim.livechat.addTags(
                "cpf_" + context["customer_cpf"],
                context["department_tag"]
              );
            }

            $zopim.livechat.set({
              name: context["customer_name"],
              email: context["customer_email"],
            });

            $zopim.livechat.window.show();
            var department_info = $zopim.livechat.departments.getDepartment(
              context["department"]
            );
            if (
              department_info.status === "online" &&
              (context["toggle_overflow_message"] == true ||
                context["toggle_overflow_message"] == "true")
            ) {
              $zopim.livechat.say(context["overflow_message"]);
            }
          });
        });
      });

      this.$("#chat-widget").addClass("out");
      this.$("#chat-widget").removeClass("full");
      if (isMobile) {
        this.$("html").removeClass("i-amphtml-scroll-disabled");
      }

      clearInterval(waitForZopim);
    }, 100);
  };

  luknator.prototype.createMessage = function (className, result) {
    this.$("#chat-widget").removeClass("out");
    if (
      result.hasOwnProperty("context") &&
      result.context.hasOwnProperty("wait_attendant")
    ) {
      this.$("#chat-widget .user-input").prop("disabled", true);
    }

    // expose bot tag
    window.BotTag = result.tag;
    if (this.tagCallback && className == "bot") {
      this.tagCallback(result.tag);
    }

    for (var j = 0; j < result.responses.length; j++) {
      var text = result.responses[j];
      var fullClassName = "chat-item " + className;
      var chatItem = this.$("<div>", {
        class: fullClassName,
      });

      var span = this.$("<span>");

      if (className == "bot") {
        var avatar = this.$("<div>", {
          class: "avatar",
        });
        var img = this.$("<img>")
          .attr("src", this.bot_bubble)
          .attr("draggable", "false");
        avatar.append(img);
        chatItem.append(avatar);
        span.html(text);
        $("#chat-widget .user-input").focus();
      } else {
        span.text(text);
      }

      var speak = this.$("<div>", {
        class: "speak",
      });
      speak.append(span);
      chatItem.append(speak);

      this.$("#chat-widget .chat-content").append(chatItem);
    }

    if (result.try_cb != null && result.try_cb > 0) {
      if (result.try_cb == 1) {
        this.actionDisplayOptions({
          options: ["Falar com atendente", "Não precisa"],
        });
      } else {
        this.actionDisplayOptions({
          options: ["Falar com atendente", "Até mais tarde"],
        });
      }
    }

    if (result.actions) {
      for (var i = 0; i < result.actions.length; i++) {
        var action = result.actions[i];

        if (action.type == "auto_reply") {
          console.log("AUTO REPLY");
          this.botRequest();
        }

        if (action.type == "option" || action.type == "display_options") {
          this.actionDisplayOptions(action);
        }

        if (action.type == "transfer_zendesk") {
          this.actionTransferZendesk(result.context);
        }

        if (action.type == "close_chat") {
          this.actionCloseChat();
        }
      }
    }

    this.$("#chat-widget .box-content").animate(
      {
        scrollTop: 99999,
      },
      0
    );
  };

  function main(params) {
    window.jQuery(document).ready(function ($) {
      if (!window._luknator) {
        var cssLink = $("<link>", {
          rel: "stylesheet",
          type: "text/css",
          href: window.luknatorParams.css,
        });
        cssLink.appendTo("head");
        window._luknator = new luknator($);
      }
    });
  }

  ////////////
  // Loader //
  ////////////
  var jQuery;
  if (window.jQuery === undefined || window.jQuery.fn.jquery !== "1.12.4") {
    var script_tag = document.createElement("script");

    script_tag.setAttribute("type", "text/javascript");
    script_tag.setAttribute(
      "src",
      "//ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js"
    );

    if (script_tag.readyState) {
      script_tag.onreadystatechange = function () {
        // For old versions of IE
        if (this.readyState == "complete" || this.readyState == "loaded") {
          scriptLoadHandler();
        }
      };
    } else {
      script_tag.onload = scriptLoadHandler;
    }
    (
      document.getElementsByTagName("head")[0] || document.documentElement
    ).appendChild(script_tag);
  } else {
    jQuery = window.jQuery;
    main();
  }

  function scriptLoadHandler() {
    jQuery = window.jQuery.noConflict(true);
    main();
  }
})();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpxdWVyeS5qdWFyZXouanMiLCJsdWtuYXRvci1tdmMuanMiLCJsdWtuYXRvci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeCtCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2phQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJsdWtuYXRvci5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBKdWFyZXpQbHVnaW4gPSBmdW5jdGlvbiAoJCkge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICB2YXIgbmFtZSA9ICdqdWFyZXonLFxuICAgICAgICBzbGlkZXJTdGF0ZSxcbiAgICAgICAgZGVmYXVsdHMgPSB7XG5cbiAgICAgICAgICAgIC8vIHtJbnQgb3IgQm9vbH0gRmFsc2UgZm9yIHR1cm5pbmcgb2ZmIGF1dG9wbGF5XG4gICAgICAgICAgICBhdXRvcGxheTogNzAwMCxcbiAgICAgICAgICAgIC8vIHtCb29sfSBQYXVzZSBhdXRvcGxheSBvbiBtb3VzZW92ZXIgc2xpZGVyXG4gICAgICAgICAgICBob3ZlcnBhdXNlOiB0cnVlLFxuXG4gICAgICAgICAgICAvLyB7Qm9vbH0gQ2lyY3VhbCBwbGF5XG4gICAgICAgICAgICBjaXJjdWxhcjogdHJ1ZSxcblxuICAgICAgICAgICAgLy8ge0ludH0gQW5pbWF0aW9uIHRpbWVcbiAgICAgICAgICAgIGFuaW1hdGlvbkR1cmF0aW9uOiA3MDAsXG4gICAgICAgICAgICAvLyB7U3RyaW5nfSBBbmltYXRpb24gZWFzaW5nIGZ1bmN0aW9uXG4gICAgICAgICAgICBhbmltYXRpb25UaW1pbmdGdW5jOiAnY3ViaWMtYmV6aWVyKDAuMTY1LCAwLjg0MCwgMC40NDAsIDEuMDAwKScsXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICoge0Jvb2wgb3IgU3RyaW5nfSBTaG93L2hpZGUvYXBwZW5kVG8gYXJyb3dzXG4gICAgICAgICAgICAgKiBUcnVlIGZvciBhcHBlbmQgYXJyb3dzIHRvIHNsaWRlciB3cmFwcGVyXG4gICAgICAgICAgICAgKiBGYWxzZSBmb3Igbm90IGFwcGVuZGluZyBhcnJvd3NcbiAgICAgICAgICAgICAqIElkIG9yIGNsYXNzIG5hbWUgKGUuZy4gJy5jbGFzcy1uYW1lJykgZm9yIGFwcGVuZGluZyB0byBzcGVjaWZpYyBIVE1MIG1hcmt1cFxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBhcnJvd3M6IHRydWUsXG4gICAgICAgICAgICAvLyB7U3RyaW5nfSBBcnJvd3Mgd3JhcHBlciBjbGFzc1xuICAgICAgICAgICAgYXJyb3dzV3JhcHBlckNsYXNzOiAnc2xpZGVyX19hcnJvd3MnLFxuICAgICAgICAgICAgLy8ge1N0cmluZ30gTWFpbiBjbGFzcyBmb3IgYm90aCBhcnJvd3NcbiAgICAgICAgICAgIGFycm93TWFpbkNsYXNzOiAnc2xpZGVyX19hcnJvd3MtaXRlbScsXG4gICAgICAgICAgICAvLyB7U3RyaW5nfSBSaWdodCBhcnJvd1xuICAgICAgICAgICAgYXJyb3dSaWdodENsYXNzOiAnc2xpZGVyX19hcnJvd3MtaXRlbS0tcmlnaHQnLFxuICAgICAgICAgICAgLy8ge1N0cmluZ30gUmlnaHQgYXJyb3cgdGV4dFxuICAgICAgICAgICAgYXJyb3dSaWdodFRleHQ6ICduZXh0JyxcbiAgICAgICAgICAgIC8vIHtTdHJpbmd9IExlZnQgYXJyb3dcbiAgICAgICAgICAgIGFycm93TGVmdENsYXNzOiAnc2xpZGVyX19hcnJvd3MtaXRlbS0tbGVmdCcsXG4gICAgICAgICAgICAvLyB7U3RyaW5nfSBMZWZ0IGFycm93IHRleHRcbiAgICAgICAgICAgIGFycm93TGVmdFRleHQ6ICdwcmV2JyxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiB7Qm9vbCBvciBTdHJpbmd9IFNob3cvaGlkZS9hcHBlbmRUbyBidWxsZXRzIG5hdmlnYXRpb25cbiAgICAgICAgICAgICAqIFRydWUgZm9yIGFwcGVuZCBhcnJvd3MgdG8gc2xpZGVyIHdyYXBwZXJcbiAgICAgICAgICAgICAqIEZhbHNlIGZvciBub3QgYXBwZW5kaW5nIGFycm93c1xuICAgICAgICAgICAgICogSWQgb3IgY2xhc3MgbmFtZSAoZS5nLiAnLmNsYXNzLW5hbWUnKSBmb3IgYXBwZW5kaW5nIHRvIHNwZWNpZmljIEhUTUwgbWFya3VwXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIG5hdmlnYXRpb246IHRydWUsXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIHtJbnR9fSBQYXVzZSB0aW1lIGR1cmF0aW9uIGFmdGVyIG1vdXNlIGhvdmVyXG4gICAgICAgICAgICBwYXVzZUR1cmF0aW9uOiAzMDAwMCxcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8ge0Jvb2x9IENlbnRlciBidWxsZXQgbmF2aWdhdGlvblxuICAgICAgICAgICAgbmF2aWdhdGlvbkNlbnRlcjogdHJ1ZSxcbiAgICAgICAgICAgIC8vIHtTdHJpbmd9IE5hdmlnYXRpb24gY2xhc3NcbiAgICAgICAgICAgIG5hdmlnYXRpb25DbGFzczogJ3NsaWRlcl9fbmF2JyxcbiAgICAgICAgICAgIC8vIHtTdHJpbmd9IE5hdmlnYXRpb24gaXRlbSBjbGFzc1xuICAgICAgICAgICAgbmF2aWdhdGlvbkl0ZW1DbGFzczogJ3NsaWRlcl9fbmF2LWl0ZW0nLFxuICAgICAgICAgICAgLy8ge1N0cmluZ30gQ3VycmVudCBuYXZpZ2F0aW9uIGl0ZW0gY2xhc3NcbiAgICAgICAgICAgIG5hdmlnYXRpb25DdXJyZW50SXRlbUNsYXNzOiAnc2xpZGVyX19uYXYtaXRlbS0tY3VycmVudCcsXG5cblxuICAgICAgICAgICAgLy8ge1N0cmluZ30gc2hvdyBzbGlkZXIgYWZ0ZXIgbG9hZCBpbWFnZVxuICAgICAgICAgICAgc2xpZGVyVmlzaWJsZUNsYXNzOiAnc2xpZGVyX192aXNpYmxlJyxcblxuICAgICAgICAgICAgLy8ge0Jvb2x9IFNsaWRlIG9uIGxlZnQvcmlnaHQga2V5Ym9hcmQgYXJyb3dzIHByZXNzXG4gICAgICAgICAgICBrZXlib2FyZDogdHJ1ZSxcblxuICAgICAgICAgICAgLy8ge0ludCBvciBCb29sfSBUb3VjaCBzZXR0aW5nc1xuICAgICAgICAgICAgdG91Y2hEaXN0YW5jZTogNjAsXG5cbiAgICAgICAgICAgIC8vIHtGdW5jdGlvbn0gQ2FsbGJhY2sgYmVmb3JlIHBsdWdpbiBpbml0XG4gICAgICAgICAgICBiZWZvcmVJbml0OiBmdW5jdGlvbiAoKSB7fSxcbiAgICAgICAgICAgIC8vIHtGdW5jdGlvbn0gQ2FsbGJhY2sgYWZ0ZXIgcGx1Z2luIGluaXRcbiAgICAgICAgICAgIGFmdGVySW5pdDogZnVuY3Rpb24gKCkge30sXG5cbiAgICAgICAgICAgIC8vIHtGdW5jdGlvbn0gQ2FsbGJhY2sgYmVmb3JlIHNsaWRlIGNoYW5nZVxuICAgICAgICAgICAgYmVmb3JlVHJhbnNpdGlvbjogZnVuY3Rpb24gKCkge30sXG4gICAgICAgICAgICAvLyB7RnVuY3Rpb259IENhbGxiYWNrIGFmdGVyIHNsaWRlIGNoYW5nZVxuICAgICAgICAgICAgYWZ0ZXJUcmFuc2l0aW9uOiBmdW5jdGlvbiAoKSB7fVxuXG4gICAgICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTbGlkZXIgQ29uc3RydWN0b3JcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcGFyZW50XG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBKdWFyZXoocGFyZW50LCBvcHRpb25zKSB7XG5cbiAgICAgICAgLy8gQ2FjaGUgdGhpc1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgLy8gRXh0ZW5kIG9wdGlvbnNcbiAgICAgICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIGRlZmF1bHRzLCBvcHRpb25zKTtcbiAgICAgICAgLy8gQ3VycmVudCBzbGlkZSBpZFxuICAgICAgICB0aGlzLmN1cnJlbnRTbGlkZSA9IDA7XG4gICAgICAgIC8vIElmIENTUzMgVHJhbnNpdGlvbiBpc24ndCBzdXBwb3J0ZWQgc3dpdGNoIGNzc1N1cHBvcnQgdmFyaWFibGUgdG8gZmFsc2UgYW5kIHVzZSAkLmFuaW1hdGUoKVxuICAgICAgICB0aGlzLmNzc1N1cHBvcnQgPSAoIXRoaXMuY3NzLmlzU3VwcG9ydGVkKFwidHJhbnNpdGlvblwiKSB8fCAhdGhpcy5jc3MuaXNTdXBwb3J0ZWQoXCJ0cmFuc2Zvcm1cIikpID8gZmFsc2UgOiB0cnVlO1xuICAgICAgICAvLyBJZiBjaXJjdWxhciBzZXQgb2Zmc2V0LCB0d28gY2xvbmVkIHNsaWRlc1xuICAgICAgICB0aGlzLm9mZnNldCA9ICh0aGlzLm9wdGlvbnMuY2lyY3VsYXIpID8gMiA6IDA7XG5cbiAgICAgICAgLy8gQ2FsbGJhY2tzIGJlZm9yZSBwbHVnaW4gaW5pdFxuICAgICAgICB0aGlzLm9wdGlvbnMuYmVmb3JlSW5pdC5jYWxsKHRoaXMpO1xuXG4gICAgICAgIC8vIFNpZGViYXJcbiAgICAgICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG4gICAgICAgIC8vIEluaXRpYWxpemVcbiAgICAgICAgdGhpcy5pbml0KCk7XG4gICAgICAgIC8vIFN0YXJ0IGF1dG9wbGF5XG4gICAgICAgIHRoaXMucGxheSgpO1xuXG4gICAgICAgIC8vIENhbGxiYWNrIGFmdGVyIHBsdWdpbiBpbml0XG4gICAgICAgIHRoaXMub3B0aW9ucy5hZnRlckluaXQuY2FsbCh0aGlzKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQVBJXG4gICAgICAgICAqIFJldHVybmluZyBzbGlkZXIgbWV0aG9kc1xuICAgICAgICAgKi9cbiAgICAgICAgcmV0dXJuIHtcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBHZXQgY3VycmVudCBzbGlkZSBudW1iZXJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge0ludH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgY3VycmVudDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAtKHNlbGYuY3VycmVudFNsaWRlKSArIDE7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFJlaW5pdFxuICAgICAgICAgICAgICogUmVidWlsZCBhbmQgcmVjYWxjdWxhdGUgZGltZW5zaW9ucyBvZiBzbGlkZXIgZWxlbWVudHNcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgcmVpbml0OiBmdW5jdGlvbiAoanNvbikge1xuICAgICAgICAgICAgICAgIHNlbGYuaW5pdChqc29uKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIERlc3Ryb3lcbiAgICAgICAgICAgICAqIFJldmVydCBpbml0IG1vZGlmaWNhdGlvbnMgYW5kIGZyZWV6ZSBzbGlkZXNcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZGVzdHJveTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBTdGFydCBhdXRvcGxheVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBwbGF5OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNsaWRlclN0YXRlID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYucGxheSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogU3RvcCBhdXRvcGxheVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBwYXVzZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChzbGlkZXJTdGF0ZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5wYXVzZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogU2xpZGUgb25lIGZvcndhcmRcbiAgICAgICAgICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjYWxsYmFja1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBuZXh0OiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBzZWxmLnNsaWRlKDEsIGZhbHNlLCBjYWxsYmFjayk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFNsaWRlIG9uZSBiYWNrd2FyZFxuICAgICAgICAgICAgICogQHBhcmFtICB7RnVuY3Rpb259IGNhbGxiYWNrXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHByZXY6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIHNlbGYuc2xpZGUoLTEsIGZhbHNlLCBjYWxsYmFjayk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEp1bXAgdG8gc3BlY2lmZWQgc2xpZGVcbiAgICAgICAgICAgICAqIEBwYXJhbSAge0ludH0gZGlzdGFuY2VcbiAgICAgICAgICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjYWxsYmFja1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBqdW1wOiBmdW5jdGlvbiAoZGlzdGFuY2UsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5zbGlkZShkaXN0YW5jZSAtIDEsIHRydWUsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQXBwZW5kIG5hdmlnYXRpb24gdG8gc3BlY2lmZXQgdGFyZ2V0XG4gICAgICAgICAgICAgKiBAcGFyYW0gIHtNaXhlZH0gdGFyZ2V0XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIG5hdjogZnVuY3Rpb24gKHRhcmdldCkge1xuXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogSWYgbmF2aWdhdGlvbiB3cmFwcGVyIGFscmVhZHkgZXhpc3RcbiAgICAgICAgICAgICAgICAgKiBSZW1vdmUgaXQsIHByb3RlY3Rpb24gYmVmb3JlIGRvdWJsZWQgbmF2aWdhdGlvblxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLm5hdmlnYXRpb24ud3JhcHBlcikge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLm5hdmlnYXRpb24ud3JhcHBlci5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gV2hpbGUgdGFyZ2V0IGlzbid0IHNwZWNpZmVkLCB1c2Ugc2xpZGVyIHdyYXBwZXJcbiAgICAgICAgICAgICAgICBzZWxmLm9wdGlvbnMubmF2aWdhdGlvbiA9ICh0YXJnZXQpID8gdGFyZ2V0IDogc2VsZi5vcHRpb25zLm5hdmlnYXRpb247XG4gICAgICAgICAgICAgICAgLy8gQnVpbGRcbiAgICAgICAgICAgICAgICBzZWxmLm5hdmlnYXRpb24oKTtcblxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBBcHBlbmQgYXJyb3dzIHRvIHNwZWNpZmV0IHRhcmdldFxuICAgICAgICAgICAgICogQHBhcmFtICB7TWl4ZWR9IHRhcmdldFxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBhcnJvd3M6IGZ1bmN0aW9uICh0YXJnZXQpIHtcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIElmIGFycm93cyB3cmFwcGVyIGFscmVhZHkgZXhpc3RcbiAgICAgICAgICAgICAgICAgKiBSZW1vdmUgaXQsIHByb3RlY3Rpb24gYmVmb3JlIGRvdWJsZWQgYXJyb3dzXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgaWYgKHNlbGYuYXJyb3dzLndyYXBwZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5hcnJvd3Mud3JhcHBlci5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBXaGlsZSB0YXJnZXQgaXNuJ3Qgc3BlY2lmZWQsIHVzZSBzbGlkZXIgd3JhcHBlclxuICAgICAgICAgICAgICAgIHNlbGYub3B0aW9ucy5hcnJvd3MgPSAodGFyZ2V0KSA/IHRhcmdldCA6IHNlbGYub3B0aW9ucy5hcnJvd3M7XG4gICAgICAgICAgICAgICAgLy8gQnVpbGRcbiAgICAgICAgICAgICAgICBzZWxmLmFycm93cygpO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfTtcblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEJ1aWxkaW5nIHNsaWRlclxuICAgICAqL1xuICAgIEp1YXJlei5wcm90b3R5cGUuYnVpbGQgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEF0dGF0Y2ggYmluZGluZ3NcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuYmluZGluZ3MoKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlcmUgaXMgbW9yZSB0aGFuIG9uZSBzbGlkZVxuICAgICAgICAgKi9cbiAgICAgICAgaWYgKHRoaXMuc2xpZGVzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ2lyY3VsYXJcbiAgICAgICAgICAgICAqIElmIGNpcmN1bGFyIG9wdGlvbiBpcyB0cnVlXG4gICAgICAgICAgICAgKiBBcHBlbmQgbGVmdCBhbmQgcmlnaHQgYXJyb3dcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5jaXJjdWxhcikge1xuICAgICAgICAgICAgICAgIHRoaXMuY2lyY3VsYXIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQXJyb3dzXG4gICAgICAgICAgICAgKiBJZiBhcnJvd3Mgb3B0aW9uIGlzIHRydWVcbiAgICAgICAgICAgICAqIEFwcGVuZCBsZWZ0IGFuZCByaWdodCBhcnJvd1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmFycm93cykge1xuICAgICAgICAgICAgICAgIHRoaXMuYXJyb3dzKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogTmF2aWdhdGlvblxuICAgICAgICAgICAgICogSWYgbmF2aWdhdGlvbiBvcHRpb24gaXMgdHJ1ZVxuICAgICAgICAgICAgICogQXBwZW5kIG5hdmlnYXRpb24gaXRlbSBmb3IgZWFjaCBzbGlkZVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLm5hdmlnYXRpb24pIHtcbiAgICAgICAgICAgICAgICB0aGlzLm5hdmlnYXRpb24oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBdHRhdGNoIGV2ZW50c1xuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5ldmVudHMoKTtcblxuICAgIH07XG4gICAgLyoqXG4gICAgICogQnVpbGQgY2lyY3VsYXIgRE9NIGVsZW1lbnRzXG4gICAgICogQ2xvbmUgZmlyc3QgYW5kIGxhc3Qgc2xpZGVcbiAgICAgKiBTZXQgd3JhcHBlciB3aWR0aCB3aXRoIGFkZGlvbmFsIHNsaWRlc1xuICAgICAqIE1vdmUgc2xpZGVyIHdyYXBwZXIgdG8gZmlyc3Qgc2xpZGVcbiAgICAgKi9cbiAgICBKdWFyZXoucHJvdG90eXBlLmNpcmN1bGFyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAvKipcbiAgICAgICAgICogQ2xvbmUgZmlyc3QgYW5kIGxhc3Qgc2xpZGVcbiAgICAgICAgICogYW5kIHNldCB3aWR0aCBmb3IgZWFjaFxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5maXJzdENsb25lID0gdGhpcy5zbGlkZXMuZmlsdGVyKCc6Zmlyc3QtY2hpbGQnKS5jbG9uZSgpLndpZHRoKHRoaXMuc2xpZGVzLnNwcmVhZCk7XG4gICAgICAgIHRoaXMubGFzdENsb25lID0gdGhpcy5zbGlkZXMuZmlsdGVyKCc6bGFzdC1jaGlsZCcpLmNsb25lKCkud2lkdGgodGhpcy5zbGlkZXMuc3ByZWFkKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQXBwZW5kIGNsb2RlcyBzbGlkZXMgdG8gc2xpZGVyIHdyYXBwZXIgYXQgdGhlIGJlZ2lubmluZyBhbmQgZW5kXG4gICAgICAgICAqIEluY3JlYXNlIHdyYXBwZXIgd2l0aCB3aXRoIHZhbHVlcyBvZiBhZGRpb25hbCBzbGlkZXNcbiAgICAgICAgICogQ2xlYXIgdHJhbnNsYXRlIGFuZCBza2lwIGNsb25lZCBsYXN0IHNsaWRlIGF0IHRoZSBiZWdpbm5pbmdcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMud3JhcHBlci5hcHBlbmQodGhpcy5maXJzdENsb25lKS5wcmVwZW5kKHRoaXMubGFzdENsb25lKS53aWR0aCh0aGlzLnBhcmVudC53aWR0aCgpICogKHRoaXMuc2xpZGVzLmxlbmd0aCArIDIpKVxuICAgICAgICAgICAgLnRyaWdnZXIoJ2NsZWFyVHJhbnNpdGlvbicpXG4gICAgICAgICAgICAgICAgLnRyaWdnZXIoJ3NldFRyYW5zbGF0ZScsIFstdGhpcy5zbGlkZXMuc3ByZWFkXSk7XG5cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQnVpbGRpbmcgbmF2aWdhdGlvbiBET01cbiAgICAgKi9cbiAgICBKdWFyZXoucHJvdG90eXBlLm5hdmlnYXRpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBpO1xuICAgICAgICB0aGlzLm5hdmlnYXRpb24uaXRlbXMgPSB7fTtcblxuICAgICAgICAvLyBOYXZpZ2F0aW9uIHdyYXBwZXJcbiAgICAgICAgdGhpcy5uYXZpZ2F0aW9uLndyYXBwZXIgPSAkKCc8ZGl2IC8+Jywge1xuICAgICAgICAgICAgJ2NsYXNzJzogdGhpcy5vcHRpb25zLm5hdmlnYXRpb25DbGFzc1xuICAgICAgICB9KS5hcHBlbmRUbyhcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogU2V0dGluZyBhcHBlbmQgdGFyZ2V0XG4gICAgICAgICAgICAgKiBJZiBvcHRpb24gaXMgdHJ1ZSBzZXQgZGVmYXVsdCB0YXJnZXQsIHRoYXQgaXMgc2xpZGVyIHdyYXBwZXJcbiAgICAgICAgICAgICAqIEVsc2UgZ2V0IHRhcmdldCBzZXQgaW4gb3B0aW9uc1xuICAgICAgICAgICAgICogQHR5cGUge0Jvb2wgb3IgU3RyaW5nfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICAodGhpcy5vcHRpb25zLm5hdmlnYXRpb24gPT09IHRydWUpID8gdGhpcy5wYXJlbnQgOiB0aGlzLm9wdGlvbnMubmF2aWdhdGlvblxuICAgICAgICApO1xuICAgICAgICBcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMuc2xpZGVzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICB0aGlzLm5hdmlnYXRpb24uaXRlbXNbaV0gPSAkKCc8YSAvPicsIHtcbiAgICAgICAgICAgICAgICAnaHJlZic6ICcjJyxcbiAgICAgICAgICAgICAgICAnY2xhc3MnOiB0aGlzLm9wdGlvbnMubmF2aWdhdGlvbkl0ZW1DbGFzcyxcbiAgICAgICAgICAgICAgICAvLyBEaXJlY3Rpb24gYW5kIGRpc3RhbmNlIC0+IEl0ZW0gaW5kZXggZm9yd2FyZFxuICAgICAgICAgICAgICAgICdkYXRhLWRpc3RhbmNlJzogaVxuICAgICAgICAgICAgfSkuYXBwZW5kVG8odGhpcy5uYXZpZ2F0aW9uLndyYXBwZXIpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBcbiAgICAgICAgLypIZXJlIEkgdHJ5IG1ha2UgdGhpcyBtb3JlIHNlbWFudGljXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5zbGlkZXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm5hdmlnYXRpb24uaXRlbXNbaV0gPSAkKCc8bGkgLz4nKS5hcHBlbmRUbyh0aGlzLm5hdmlnYXRpb24ud3JhcHBlcik7XG4gICAgICAgICAgICAgICAgdGhpcy5uYXZpZ2F0aW9uLml0ZW1zW2ldLmFwcGVuZCgkKFwiPGEgLz5cIiwge1xuICAgICAgICAgICAgICAgICAgICAnaHJlZic6ICcjJyxcbiAgICAgICAgICAgICAgICAgICAgJ2NsYXNzJzogdGhpcy5vcHRpb25zLm5hdmlnYXRpb25JdGVtQ2xhc3MsXG4gICAgICAgICAgICAgICAgICAgIC8vIERpcmVjdGlvbiBhbmQgZGlzdGFuY2UgLT4gSXRlbSBpbmRleCBmb3J3YXJkXG4gICAgICAgICAgICAgICAgICAgICdkYXRhLWRpc3RhbmNlJzogaVxuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgKi9cbiAgICAgICAgXG4gICAgICAgIC8vIEFkZCBuYXZDdXJyZW50SXRlbUNsYXNzIHRvIHRoZSBmaXJzdCBuYXZpZ2F0aW9uIGl0ZW1cbiAgICAgICAgdGhpcy5uYXZpZ2F0aW9uLml0ZW1zWzBdLmFkZENsYXNzKHRoaXMub3B0aW9ucy5uYXZpZ2F0aW9uQ3VycmVudEl0ZW1DbGFzcyk7XG5cbiAgICAgICAgLy8gSWYgY2VudGVyZWQgb3B0aW9uIGlzIHRydWVcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5uYXZpZ2F0aW9uQ2VudGVyKSB7XG4gICAgICAgICAgICAvLyBDZW50ZXIgYnVsbGV0IG5hdmlnYXRpb25cbiAgICAgICAgICAgIHRoaXMubmF2aWdhdGlvbi53cmFwcGVyLmNzcyh7XG4gICAgICAgICAgICAgICAgJ2xlZnQnOiAnNTAlJyxcbiAgICAgICAgICAgICAgICAnd2lkdGgnOiB0aGlzLm5hdmlnYXRpb24ud3JhcHBlci5jaGlsZHJlbigpLm91dGVyV2lkdGgodHJ1ZSkgKiB0aGlzLm5hdmlnYXRpb24ud3JhcHBlci5jaGlsZHJlbigpLmxlbmd0aCxcbiAgICAgICAgICAgICAgICAnbWFyZ2luLWxlZnQnOiAtKHRoaXMubmF2aWdhdGlvbi53cmFwcGVyLm91dGVyV2lkdGgodHJ1ZSkgLyAyKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgIH07XG4gICAgICAgIC8qKlxuICAgICAqIEJ1aWxkaW5nIGFycm93cyBET01cbiAgICAgKi9cbiAgICBKdWFyZXoucHJvdG90eXBlLmFycm93cyA9IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQXJyb3dzIHdyYXBwZXJcbiAgICAgICAgICogQHR5cGUge09iZWpjdH1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuYXJyb3dzLndyYXBwZXIgPSAkKCc8ZGl2IC8+Jywge1xuICAgICAgICAgICAgJ2NsYXNzJzogdGhpcy5vcHRpb25zLmFycm93c1dyYXBwZXJDbGFzc1xuICAgICAgICB9KS5hcHBlbmRUbyhcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogU2V0dGluZyBhcHBlbmQgdGFyZ2V0XG4gICAgICAgICAgICAgKiBJZiBvcHRpb24gaXMgdHJ1ZSBzZXQgZGVmYXVsdCB0YXJnZXQsIHRoYXQgaXMgc2xpZGVyIHdyYXBwZXJcbiAgICAgICAgICAgICAqIEVsc2UgZ2V0IHRhcmdldCBzZXQgaW4gb3B0aW9uc1xuICAgICAgICAgICAgICogQHR5cGUge0Jvb2wgb3IgU3RyaW5nfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICAodGhpcy5vcHRpb25zLmFycm93cyA9PT0gdHJ1ZSkgPyB0aGlzLnBhcmVudCA6IHRoaXMub3B0aW9ucy5hcnJvd3NcbiAgICAgICAgKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmlnaHQgYXJyb3dcbiAgICAgICAgICogQHR5cGUge09iZWpjdH1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuYXJyb3dzLnJpZ2h0ID0gJCgnPGRpdiAvPicsIHtcbiAgICAgICAgICAgICdjbGFzcyc6IHRoaXMub3B0aW9ucy5hcnJvd01haW5DbGFzcyArICcgJyArIHRoaXMub3B0aW9ucy5hcnJvd1JpZ2h0Q2xhc3MsXG4gICAgICAgICAgICAvLyBEaXJlY3Rpb24gYW5kIGRpc3RhbmNlIC0+IE9uZSBmb3J3YXJkXG4gICAgICAgICAgICAnZGF0YS1kaXN0YW5jZSc6ICcxJyxcbiAgICAgICAgICAgICdodG1sJzogdGhpcy5vcHRpb25zLmFycm93UmlnaHRUZXh0XG4gICAgICAgIH0pLmFwcGVuZFRvKHRoaXMuYXJyb3dzLndyYXBwZXIpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBMZWZ0IGFycm93XG4gICAgICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmFycm93cy5sZWZ0ID0gJCgnPGRpdiAvPicsIHtcbiAgICAgICAgICAgICdjbGFzcyc6IHRoaXMub3B0aW9ucy5hcnJvd01haW5DbGFzcyArICcgJyArIHRoaXMub3B0aW9ucy5hcnJvd0xlZnRDbGFzcyxcbiAgICAgICAgICAgIC8vIERpcmVjdGlvbiBhbmQgZGlzdGFuY2UgLT4gT25lIGJhY2t3YXJkXG4gICAgICAgICAgICAnZGF0YS1kaXN0YW5jZSc6ICctMScsXG4gICAgICAgICAgICAnaHRtbCc6IHRoaXMub3B0aW9ucy5hcnJvd0xlZnRUZXh0XG4gICAgICAgIH0pLmFwcGVuZFRvKHRoaXMuYXJyb3dzLndyYXBwZXIpO1xuXG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEZ1bmN0aW9uIGJpbmRpbmdzXG4gICAgICovXG4gICAgSnVhcmV6LnByb3RvdHlwZS5iaW5kaW5ncyA9IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICAgICAgICBvID0gdGhpcy5vcHRpb25zLFxuICAgICAgICAgICAgcHJlZml4ID0gdGhpcy5jc3MuZ2V0UHJlZml4KCk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNldHVwIHNsaWRlciB3cmFwcGVyIGJpbmRpbmdzXG4gICAgICAgICAqIGZvciB0cmFuc2xhdGUgYW5kIHRyYW5zaXRpb24gY29udHJvbFxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy53cmFwcGVyLmJpbmQoe1xuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFNldCB0cmFuc2l0aW9uXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICdzZXRUcmFuc2l0aW9uJzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICQodGhpcykuY3NzKCBwcmVmaXggKyAndHJhbnNpdGlvbicsIHByZWZpeCArICd0cmFuc2Zvcm0gJyArIG8uYW5pbWF0aW9uRHVyYXRpb24gKyAnbXMgJyArIG8uYW5pbWF0aW9uVGltaW5nRnVuYyk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIENsZWFyIHRyYW5zaXRpb25cbiAgICAgICAgICAgICAqIGZvciBpbW1lZGlhdGUganVtcCBlZmZlY3RcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgJ2NsZWFyVHJhbnNpdGlvbic6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmNzcyggcHJlZml4ICsgJ3RyYW5zaXRpb24nLCAnbm9uZScpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBTZXQgdHJhbnNsYXRlIHZhbHVlXG4gICAgICAgICAgICAgKiBAcGFyYW0gIHtPYmplY3R9IGV2ZW50XG4gICAgICAgICAgICAgKiBAcGFyYW0gIHtJbmR9IHRyYW5zbGF0ZVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICAnc2V0VHJhbnNsYXRlJzogZnVuY3Rpb24oZXZlbnQsIHRyYW5zbGF0ZSkge1xuICAgICAgICAgICAgICAgIC8vIGlmIGNzczMgc3Vwb3J0ZWQgc2V0IHRyYW5zbGF0ZTNkXG4gICAgICAgICAgICAgICAgaWYgKHNlbGYuY3NzU3VwcG9ydCkgJCh0aGlzKS5jc3MoIHByZWZpeCArICd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlM2QoJyArIHRyYW5zbGF0ZSArICdweCwgMHB4LCAwcHgpJyk7XG4gICAgICAgICAgICAgICAgLy8gaWYgbm90IHNldCBsZWZ0IG1hcmdpblxuICAgICAgICAgICAgICAgIGVsc2UgJCh0aGlzKS5jc3MoJ21hcmdpbi1sZWZ0JywgdHJhbnNsYXRlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9KTtcblxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBFdmVudHMgY29udHJvbGxlcnNcbiAgICAgKi9cbiAgICBKdWFyZXoucHJvdG90eXBlLmV2ZW50cyA9IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAvKipcbiAgICAgICAgICogU3dpcGVcbiAgICAgICAgICogSWYgc3dpcGUgb3B0aW9uIGlzIHRydWVcbiAgICAgICAgICogQXR0YWNoIHRvdWNoIGV2ZW50c1xuICAgICAgICAgKi9cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy50b3VjaERpc3RhbmNlKSB7XG4gICAgICAgICAgICB0aGlzLnBhcmVudC5vbih7XG4gICAgICAgICAgICAgICAgJ3RvdWNoc3RhcnQgTVNQb2ludGVyRG93bic6ICQucHJveHkodGhpcy5ldmVudHMudG91Y2hzdGFydCwgdGhpcyksXG4gICAgICAgICAgICAgICAgJ3RvdWNobW92ZSBNU1BvaW50ZXJNb3ZlJzogJC5wcm94eSh0aGlzLmV2ZW50cy50b3VjaG1vdmUsIHRoaXMpLFxuICAgICAgICAgICAgICAgICd0b3VjaGVuZCBNU1BvaW50ZXJVcCc6ICQucHJveHkodGhpcy5ldmVudHMudG91Y2hlbmQsIHRoaXMpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBcnJvd3NcbiAgICAgICAgICogSWYgYXJyb3dzIGV4aXN0c1xuICAgICAgICAgKiBBdHRhY2ggY2xpY2sgZXZlbnRcbiAgICAgICAgICovXG4gICAgICAgIGlmICh0aGlzLmFycm93cy53cmFwcGVyKSB7XG4gICAgICAgICAgICAkKHRoaXMuYXJyb3dzLndyYXBwZXIpLmNoaWxkcmVuKCkub24oJ2NsaWNrIHRvdWNoc3RhcnQnLFxuICAgICAgICAgICAgICAgICQucHJveHkodGhpcy5ldmVudHMuYXJyb3dzLCB0aGlzKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBOYXZpZ2F0aW9uXG4gICAgICAgICAqIElmIG5hdmlnYXRpb24gZXhpc3RzXG4gICAgICAgICAqIEF0dGFjaCBjbGljayBldmVudFxuICAgICAgICAgKi9cbiAgICAgICAgaWYgKHRoaXMubmF2aWdhdGlvbi53cmFwcGVyKSB7XG4gICAgICAgICAgICAkKHRoaXMubmF2aWdhdGlvbi53cmFwcGVyKS5jaGlsZHJlbigpLm9uKCdjbGljayB0b3VjaHN0YXJ0JyxcbiAgICAgICAgICAgICAgICAkLnByb3h5KHRoaXMuZXZlbnRzLm5hdmlnYXRpb24sIHRoaXMpXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEtleWJvYXJkXG4gICAgICAgICAqIElmIGtleWJvYXJkIG9wdGlvbiBpcyB0cnVlXG4gICAgICAgICAqIEF0dGFjaCBwcmVzcyBldmVudFxuICAgICAgICAgKi9cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5rZXlib2FyZCkge1xuICAgICAgICAgICAgJChkb2N1bWVudCkub24oJ2tleXVwLmp1YXJlektleXVwJyxcbiAgICAgICAgICAgICAgICAkLnByb3h5KHRoaXMuZXZlbnRzLmtleWJvYXJkLCB0aGlzKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTbGlkZXIgaG92ZXJcbiAgICAgICAgICogSWYgaG92ZXIgb3B0aW9uIGlzIHRydWVcbiAgICAgICAgICogQXR0YWNoIGhvdmVyIGV2ZW50XG4gICAgICAgICAqL1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmhvdmVycGF1c2UpIHtcbiAgICAgICAgICAgIHRoaXMucGFyZW50Lm9uKCdtb3VzZW92ZXIgbW91c2VvdXQnLFxuICAgICAgICAgICAgICAgICQucHJveHkodGhpcy5ldmVudHMuaG92ZXIsIHRoaXMpXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNsaWRlciByZXNpemVcbiAgICAgICAgICogT24gd2luZG93IHJlc2l6ZVxuICAgICAgICAgKiBBdHRhY2ggcmVzaXplIGV2ZW50XG4gICAgICAgICAqL1xuICAgICAgICAkKHdpbmRvdykub24oJ3Jlc2l6ZScsXG4gICAgICAgICAgICAkLnByb3h5KHRoaXMuZXZlbnRzLnJlc2l6ZSwgdGhpcylcbiAgICAgICAgKTtcblxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBOYXZpZ2F0aW9uIGV2ZW50IGNvbnRyb2xsZXJcbiAgICAgKiBPbiBjbGljayBpbiBuYXZpZ2F0aW9uIGl0ZW0gZ2V0IGRpc3RhbmNlXG4gICAgICogVGhlbiBzbGlkZSBzcGVjaWZpZWQgZGlzdGFuY2Ugd2l0aCBqdW1wXG4gICAgICovXG4gICAgSnVhcmV6LnByb3RvdHlwZS5ldmVudHMubmF2aWdhdGlvbiA9IGZ1bmN0aW9uIChldmVudCkge1xuXG4gICAgICAgIGlmICghdGhpcy53cmFwcGVyLmF0dHIoJ2Rpc2FibGVkJykpIHtcbiAgICAgICAgICAgIC8vIFByZXZlbnQgZGVmYXVsdCBiZWhhdmlvdXJcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAvLyBTbGlkZSBkaXN0YW5jZSBzcGVjaWZpZWQgaW4gZGF0YSBhdHRyaWJ1dGVcbiAgICAgICAgICAgIHRoaXMuc2xpZGUoJChldmVudC5jdXJyZW50VGFyZ2V0KS5kYXRhKCdkaXN0YW5jZScpLCB0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEFycm93cyBldmVudCBjb250cm9sbGVyXG4gICAgICogT24gY2xpY2sgaW4gYXJyb3dzIGdldCBkaXJlY3Rpb24gYW5kIGRpc3RhbmNlXG4gICAgICogVGhlbiBzbGlkZSBzcGVjaWZpZWQgZGlzdGFuY2Ugd2l0aG91dCBqdW1wXG4gICAgICogQHBhcmFtICB7T2JlamN0fSBldmVudFxuICAgICAqL1xuICAgIEp1YXJlei5wcm90b3R5cGUuZXZlbnRzLmFycm93cyA9IGZ1bmN0aW9uIChldmVudCkge1xuXG4gICAgICAgIGlmICghdGhpcy53cmFwcGVyLmF0dHIoJ2Rpc2FibGVkJykpIHtcbiAgICAgICAgICAgIC8vIFByZXZlbnQgZGVmYXVsdCBiZWhhdmlvdXJcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAvLyBTbGlkZSBkaXN0YW5jZSBzcGVjaWZpZWQgaW4gZGF0YSBhdHRyaWJ1dGVcbiAgICAgICAgICAgIHRoaXMuc2xpZGUoJChldmVudC5jdXJyZW50VGFyZ2V0KS5kYXRhKCdkaXN0YW5jZScpLCBmYWxzZSk7XG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBLZXlib2FyZCBhcnJvd3MgZXZlbnQgY29udHJvbGxlclxuICAgICAqIEtleWJvYXJkIGxlZnQgYW5kIHJpZ2h0IGFycm93IGtleXMgcHJlc3NcbiAgICAgKi9cbiAgICBKdWFyZXoucHJvdG90eXBlLmV2ZW50cy5rZXlib2FyZCA9IGZ1bmN0aW9uIChldmVudCkge1xuXG4gICAgICAgIGlmICghdGhpcy53cmFwcGVyLmF0dHIoJ2Rpc2FibGVkJykpIHtcbiAgICAgICAgICAgIC8vIE5leHRcbiAgICAgICAgICAgIGlmIChldmVudC5rZXlDb2RlID09PSAzOSkgdGhpcy5zbGlkZSgxKTtcbiAgICAgICAgICAgIC8vIFByZXZcbiAgICAgICAgICAgIGlmIChldmVudC5rZXlDb2RlID09PSAzNykgdGhpcy5zbGlkZSgtMSk7XG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBXaGVuIG1vdXNlIGlzIG92ZXIgc2xpZGVyLCBwYXVzZSBhdXRvcGxheVxuICAgICAqIE9uIG91dCwgc3RhcnQgYXV0b3BsYXkgYWdhaW5cbiAgICAgKi9cbiAgICBKdWFyZXoucHJvdG90eXBlLmV2ZW50cy5ob3ZlciA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgdGltZTtcbiAgICAgICAgLy8gUGF1c2UgYXV0b3BsYXlcbiAgICAgICAgdGhpcy5wYXVzZSgpO1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgLy8gV2hlbiBtb3VzZSBsZWZ0IHNsaWRlciBvciB0b3VjaCBlbmQsIHN0YXJ0IGF1dG9wbGF5IGFuZXdcbiAgICAgICAgaWYgKGV2ZW50LnR5cGUgPT09ICdtb3VzZW91dCcpIHtcbiAgICAgICAgICAgIHNlbGYucGxheSgpO1xuICAgICAgICB9XG5cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogV2hlbiByZXNpemUgYnJvd3NlciB3aW5kb3dcbiAgICAgKiBSZWluaXQgcGx1Z2luIGZvciBuZXcgc2xpZGVyIGRpbWVuc2lvbnNcbiAgICAgKiBDb3JyZWN0IGNyb3AgdG8gY3VycmVudCBzbGlkZVxuICAgICAqL1xuICAgIEp1YXJlei5wcm90b3R5cGUuZXZlbnRzLnJlc2l6ZSA9IGZ1bmN0aW9uIChldmVudCkge1xuXG4gICAgICAgIC8vIFJlaW5pdCBwbHVnaW4gKHNldCBuZXcgc2xpZGVyIGRpbWVuc2lvbnMpXG4gICAgICAgIHRoaXMuZGltZW5zaW9ucygpO1xuICAgICAgICAvLyBDcm9wIHRvIGN1cnJlbnQgc2xpZGVcbiAgICAgICAgdGhpcy5zbGlkZSgwKTtcblxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBEaXNhYmxlIGV2ZW50cyB0aGF0cyBjb250cm9scyBzbGlkZSBjaGFuZ2VzXG4gICAgICovXG4gICAgSnVhcmV6LnByb3RvdHlwZS5kaXNhYmxlRXZlbnRzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLndyYXBwZXIuYXR0cihcImRpc2FibGVkXCIsIHRydWUpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBFbmFibGUgZXZlbnRzIHRoYXRzIGNvbnRyb2xzIHNsaWRlIGNoYW5nZXNcbiAgICAgKi9cbiAgICBKdWFyZXoucHJvdG90eXBlLmVuYWJsZUV2ZW50cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy53cmFwcGVyLmF0dHIoXCJkaXNhYmxlZFwiLCBmYWxzZSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICogVG91Y2ggc3RhcnRcbiAgICAqIEBwYXJhbSAge09iamVjdH0gZSBldmVudFxuICAgICovXG4gICAgSnVhcmV6LnByb3RvdHlwZS5ldmVudHMudG91Y2hzdGFydCA9IGZ1bmN0aW9uIChldmVudCkge1xuXG4gICAgICAgIGlmICghdGhpcy53cmFwcGVyLmF0dHIoJ2Rpc2FibGVkJykpIHtcbiAgICAgICAgICAgIC8vIENhY2hlIGV2ZW50XG4gICAgICAgICAgICB2YXIgdG91Y2ggPSBldmVudC5vcmlnaW5hbEV2ZW50LnRvdWNoZXNbMF0gfHwgZXZlbnQub3JpZ2luYWxFdmVudC5jaGFuZ2VkVG91Y2hlc1swXTtcblxuICAgICAgICAgICAgLy8gR2V0IHRvdWNoIHN0YXJ0IHBvaW50c1xuICAgICAgICAgICAgdGhpcy5ldmVudHMudG91Y2hTdGFydFggPSB0b3VjaC5wYWdlWDtcbiAgICAgICAgICAgIHRoaXMuZXZlbnRzLnRvdWNoU3RhcnRZID0gdG91Y2gucGFnZVk7XG4gICAgICAgICAgICB0aGlzLmV2ZW50cy50b3VjaFNpbiA9IG51bGw7XG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICAvKipcbiAgICAqIFRvdWNoIG1vdmVcbiAgICAqIEZyb20gc3dpcGUgbGVuZ3RoIHNlZ21lbnRzIGNhbGN1bGF0ZSBzd2lwZSBhbmdsZVxuICAgICogQHBhcmFtICB7T2JlamN0fSBlIGV2ZW50XG4gICAgKi9cbiAgICBKdWFyZXoucHJvdG90eXBlLmV2ZW50cy50b3VjaG1vdmUgPSBmdW5jdGlvbiAoZXZlbnQpIHtcblxuICAgICAgICBpZiAoIXRoaXMud3JhcHBlci5hdHRyKCdkaXNhYmxlZCcpKSB7XG4gICAgICAgICAgICAvLyBDYWNoZSBldmVudFxuICAgICAgICAgICAgdmFyIHRvdWNoID0gZXZlbnQub3JpZ2luYWxFdmVudC50b3VjaGVzWzBdIHx8IGV2ZW50Lm9yaWdpbmFsRXZlbnQuY2hhbmdlZFRvdWNoZXNbMF07XG5cbiAgICAgICAgICAgIC8vIENhbGN1bGF0ZSBzdGFydCwgZW5kIHBvaW50c1xuICAgICAgICAgICAgdmFyIHN1YkV4U3ggPSB0b3VjaC5wYWdlWCAtIHRoaXMuZXZlbnRzLnRvdWNoU3RhcnRYO1xuICAgICAgICAgICAgdmFyIHN1YkV5U3kgPSB0b3VjaC5wYWdlWSAtIHRoaXMuZXZlbnRzLnRvdWNoU3RhcnRZO1xuICAgICAgICAgICAgLy8gQml0d2lzZSBzdWJFeFN4IHBvd1xuICAgICAgICAgICAgdmFyIHBvd0VYID0gTWF0aC5hYnMoIHN1YkV4U3ggPDwgMiApO1xuICAgICAgICAgICAgLy8gQml0d2lzZSBzdWJFeVN5IHBvd1xuICAgICAgICAgICAgdmFyIHBvd0VZID0gTWF0aC5hYnMoIHN1YkV5U3kgPDwgMiApO1xuICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBsZW5ndGggb2YgdGhlIGh5cG90ZW51c2Ugc2VnbWVudFxuICAgICAgICAgICAgdmFyIHRvdWNoSHlwb3RlbnVzZSA9IE1hdGguc3FydCggcG93RVggKyBwb3dFWSApO1xuICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBsZW5ndGggb2YgdGhlIGNhdGhldHVzIHNlZ21lbnRcbiAgICAgICAgICAgIHZhciB0b3VjaENhdGhldHVzID0gTWF0aC5zcXJ0KCBwb3dFWSApO1xuXG4gICAgICAgICAgICAvLyBDYWxjdWxhdGUgdGhlIHNpbmUgb2YgdGhlIGFuZ2xlXG4gICAgICAgICAgICB0aGlzLmV2ZW50cy50b3VjaFNpbiA9IE1hdGguYXNpbih0b3VjaENhdGhldHVzIC8gdG91Y2hIeXBvdGVudXNlKTtcblxuICAgICAgICAgICAgaWYgKCAodGhpcy5ldmVudHMudG91Y2hTaW4gKiAoMTgwIC8gTWF0aC5QSSkpIDwgNDUgKSBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9XG5cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgKiBUb3VjaCBlbmRcbiAgICAqIEBwYXJhbSAge09iamVjdH0gZSBldmVudFxuICAgICovXG4gICAgSnVhcmV6LnByb3RvdHlwZS5ldmVudHMudG91Y2hlbmQgPSBmdW5jdGlvbiAoZXZlbnQpIHtcblxuICAgICAgICBpZiAoICF0aGlzLndyYXBwZXIuYXR0cignZGlzYWJsZWQnKSApIHtcbiAgICAgICAgICAgIC8vIENhY2hlIGV2ZW50XG4gICAgICAgICAgICB2YXIgdG91Y2ggPSBldmVudC5vcmlnaW5hbEV2ZW50LnRvdWNoZXNbMF0gfHwgZXZlbnQub3JpZ2luYWxFdmVudC5jaGFuZ2VkVG91Y2hlc1swXTtcblxuICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIHRvdWNoIGRpc3RhbmNlXG4gICAgICAgICAgICB2YXIgdG91Y2hEaXN0YW5jZSA9IHRvdWNoLnBhZ2VYIC0gdGhpcy5ldmVudHMudG91Y2hTdGFydFg7XG5cbiAgICAgICAgICAgIC8vIFdoaWxlIHRvdWNoIGlzIHBvc2l0aXZlIGFuZCBncmVhdGVyIHRoYW4gZGlzdGFuY2Ugc2V0IGluIG9wdGlvbnNcbiAgICAgICAgICAgIGlmICggKHRvdWNoRGlzdGFuY2UgPiB0aGlzLm9wdGlvbnMudG91Y2hEaXN0YW5jZSkgJiYgKCAodGhpcy5ldmVudHMudG91Y2hTaW4gKiAoMTgwIC8gTWF0aC5QSSkpIDwgNDUpICkge1xuICAgICAgICAgICAgICAgIC8vIFNsaWRlIG9uZSBiYWNrd2FyZFxuICAgICAgICAgICAgICAgIHRoaXMuc2xpZGUoLTEpO1xuICAgICAgICAgICAgLy8gV2hpbGUgdG91Y2ggaXMgbmVnYXRpdmUgYW5kIGxvd2VyIHRoYW4gbmVnYXRpdmUgZGlzdGFuY2Ugc2V0IGluIG9wdGlvbnNcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICAgICAgKHRvdWNoRGlzdGFuY2UgPCAtdGhpcy5vcHRpb25zLnRvdWNoRGlzdGFuY2UpICYmICggKHRoaXMuZXZlbnRzLnRvdWNoU2luICogKDE4MCAvIE1hdGguUEkpKSA8IDQ1KSApIHtcbiAgICAgICAgICAgICAgICAvLyBTbGlkZSBvbmUgZm9yd2FyZFxuICAgICAgICAgICAgICAgIHRoaXMuc2xpZGUoMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTbGlkZXMgY2hhbmdlICYgYW5pbWF0ZSBsb2dpY1xuICAgICAqIEBwYXJhbSAge2ludH0gZGlzdGFuY2VcbiAgICAgKiBAcGFyYW0gIHtib29sfSBqdW1wXG4gICAgICogQHBhcmFtICB7ZnVuY3Rpb259IGNhbGxiYWNrXG4gICAgICovXG4gICAgSnVhcmV6LnByb3RvdHlwZS5zbGlkZSA9IGZ1bmN0aW9uKGRpc3RhbmNlLCBqdW1wLCBjYWxsYmFjaykge1xuXG4gICAgICAgIC8vIElmIHRoZXJlIGlzIG9uZSBzbGlkZSwgZXNjYXBlXG4gICAgICAgIGlmICh0aGlzLnNsaWRlcy5sZW5ndGggPD0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFN0b3AgYXV0b3BsYXlcbiAgICAgICAgICogQ2xlYXJpbmcgdGltZXJcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMucGF1c2UoKTtcblxuICAgICAgICAvLyBDYWxsYmFja3MgYmVmb3JlIHNsaWRlIGNoYW5nZVxuICAgICAgICB0aGlzLm9wdGlvbnMuYmVmb3JlVHJhbnNpdGlvbi5jYWxsKHRoaXMpO1xuXG4gICAgICAgIC8vIFNldHVwIHZhcmlhYmxlc1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICAgICAgICBjdXJyZW50U2xpZGUgPSAoanVtcCkgPyAwIDogdGhpcy5jdXJyZW50U2xpZGUsXG4gICAgICAgICAgICBzbGlkZXNMZW5ndGggPSAtKHRoaXMuc2xpZGVzLmxlbmd0aC0xKSxcbiAgICAgICAgICAgIGZyb21GaXJzdCA9IGZhbHNlLFxuICAgICAgICAgICAgZnJvbUxhc3QgPSBmYWxzZTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2hlY2sgaWYgY3VycmVudCBzbGlkZSBpcyBmaXJzdCBhbmQgZGlyZWN0aW9uIGlzIHByZXZpb3VzLCB0aGVuIGdvIHRvIGxhc3Qgc2xpZGVcbiAgICAgICAgICogb3IgY3VycmVudCBzbGlkZSBpcyBsYXN0IGFuZCBkaXJlY3Rpb24gaXMgbmV4dCwgdGhlbiBnbyB0byB0aGUgZmlyc3Qgc2xpZGVcbiAgICAgICAgICogZWxzZSBjaGFuZ2UgY3VycmVudCBzbGlkZSBub3JtYWxseVxuICAgICAgICAgKi9cbiAgICAgICAgaWYgKCBjdXJyZW50U2xpZGUgPT09IDAgJiYgZGlzdGFuY2UgPT09IC0xICkge1xuICAgICAgICAgICAgZnJvbUZpcnN0ID0gdHJ1ZTtcbiAgICAgICAgICAgIGN1cnJlbnRTbGlkZSA9IHNsaWRlc0xlbmd0aDtcbiAgICAgICAgfSBlbHNlIGlmICggY3VycmVudFNsaWRlID09PSBzbGlkZXNMZW5ndGggJiYgZGlzdGFuY2UgPT09IDEgKSB7XG4gICAgICAgICAgICBmcm9tTGFzdCA9IHRydWU7XG4gICAgICAgICAgICBjdXJyZW50U2xpZGUgPSAwO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3VycmVudFNsaWRlID0gY3VycmVudFNsaWRlICsgKC1kaXN0YW5jZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogQ3JvcCB0byBjdXJyZW50IHNsaWRlLlxuICAgICAgICAgKiBNdWwgc2xpZGUgd2lkdGggYnkgY3VycmVudCBzbGlkZSBudW1iZXIuXG4gICAgICAgICAqL1xuICAgICAgICB2YXIgb2Zmc2V0ID0gdGhpcy5zbGlkZXMuc3ByZWFkICogY3VycmVudFNsaWRlO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBXaGlsZSBjaXJjdWxhciBkZWNyZWFzZSBvZmZzZXQgd2l0aCB0aGUgd2lkdGggb2Ygc2luZ2xlIHNsaWRlXG4gICAgICAgICAqIFdoZW4gZnJvbUZpcnN0IGFuZCBmcm9tTGFzdCBmbGFncyBhcmUgc2V0LCB1bmJpbmQgZXZlbnRzIHRoYXRzIGNvbnRyb2xzIGNoYW5naW5nXG4gICAgICAgICAqIFdoZW4gZnJvbUxhc3QgZmxhZ3MgaXMgc2V0LCBzZXQgb2Zmc2V0IHRvIHNsaWRlIHdpZHRoIG11bGxlZCBieSBzbGlkZXMgY291bnQgd2l0aG91dCBjbG9uZWQgc2xpZGVzXG4gICAgICAgICAqIFdoZW4gZnJvbUZpcnN0IGZsYWdzIGlzIHNldCwgc2V0IG9mZnNldCB0byB6ZXJvXG4gICAgICAgICAqL1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmNpcmN1bGFyKSB7XG4gICAgICAgICAgICBvZmZzZXQgPSBvZmZzZXQgLSB0aGlzLnNsaWRlcy5zcHJlYWQ7XG4gICAgICAgICAgICBpZiAoZnJvbUxhc3QgfHwgZnJvbUZpcnN0KSB0aGlzLmRpc2FibGVFdmVudHMoKTtcbiAgICAgICAgICAgIGlmIChmcm9tTGFzdCkgb2Zmc2V0ID0gdGhpcy5zbGlkZXMuc3ByZWFkICogKHNsaWRlc0xlbmd0aCAtIDIpO1xuICAgICAgICAgICAgaWYgKGZyb21GaXJzdCkgb2Zmc2V0ID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTbGlkZSBjaGFuZ2UgYW5pbWF0aW9uXG4gICAgICAgICAqIFdoaWxlIENTUzMgaXMgc3VwcG9ydGVkIHVzZSBvZmZzZXRcbiAgICAgICAgICogaWYgbm90LCB1c2UgJC5hbmltYXRlKCk7XG4gICAgICAgICAqL1xuICAgICAgICBpZiAodGhpcy5jc3NTdXBwb3J0KSB0aGlzLndyYXBwZXIudHJpZ2dlcignc2V0VHJhbnNpdGlvbicpLnRyaWdnZXIoJ3NldFRyYW5zbGF0ZScsIFtvZmZzZXRdKTtcbiAgICAgICAgZWxzZSB0aGlzLndyYXBwZXIuc3RvcCgpLmFuaW1hdGUoeyAnbWFyZ2luLWxlZnQnOiBvZmZzZXQgfSwgdGhpcy5vcHRpb25zLmFuaW1hdGlvbkR1cmF0aW9uKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogV2hpbGUgY2lyY3VsYXJcbiAgICAgICAgICovXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuY2lyY3VsYXIpIHtcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBcdFdoZW4gZnJvbUZpcnN0IGFuZCBmcm9tTGFzdCBmbGFncyBhcmUgc2V0XG4gICAgICAgICAgICAgKiBcdGFmdGVyIGFuaW1hdGlvbiBjbGVhciB0cmFuc2l0aW9uIGFuZCBiaW5kIGV2ZW50cyB0aGF0IGNvbnRyb2wgc2xpZGVzIGNoYW5naW5nXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGlmIChmcm9tRmlyc3QgfHwgZnJvbUxhc3QpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFmdGVyQW5pbWF0aW9uKGZ1bmN0aW9uICgpe1xuICAgICAgICAgICAgICAgICAgICBzZWxmLndyYXBwZXIudHJpZ2dlcignY2xlYXJUcmFuc2l0aW9uJyk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZW5hYmxlRXZlbnRzKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogV2hlbiBmcm9tTGFzdCBmbGFnIGlzIHNldFxuICAgICAgICAgICAgICogYWZ0ZXIgYW5pbWF0aW9uIG1ha2UgaW1tZWRpYXRlIGp1bXAgZnJvbSBjbG9uZWQgc2xpZGUgdG8gcHJvcGVyIG9uZVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBpZiAoZnJvbUxhc3QpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFmdGVyQW5pbWF0aW9uKGZ1bmN0aW9uICgpe1xuICAgICAgICAgICAgICAgICAgICBmcm9tTGFzdCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLndyYXBwZXIudHJpZ2dlcignc2V0VHJhbnNsYXRlJywgWy1zZWxmLnNsaWRlcy5zcHJlYWRdKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBXaGVuIGZyb21GaXJzdCBmbGFnIGlzIHNldFxuICAgICAgICAgICAgICogYWZ0ZXIgYW5pbWF0aW9uIG1ha2UgaW1tZWRpYXRlIGp1bXAgZnJvbSBjbG9uZWQgc2xpZGUgdG8gcHJvcGVyIG9uZVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBpZiAoZnJvbUZpcnN0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hZnRlckFuaW1hdGlvbihmdW5jdGlvbiAoKXtcbiAgICAgICAgICAgICAgICAgICAgZnJvbUZpcnN0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYud3JhcHBlci50cmlnZ2VyKCdzZXRUcmFuc2xhdGUnLCBbc2VsZi5zbGlkZXMuc3ByZWFkICogKHNsaWRlc0xlbmd0aC0xKV0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cblxuICAgICAgICAvLyBTZXQgdG8gbmF2aWdhdGlvbiBpdGVtIGN1cnJlbnQgY2xhc3NcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5uYXZpZ2F0aW9uICYmIHRoaXMubmF2aWdhdGlvbi53cmFwcGVyKSB7XG4gICAgICAgICAgICAkKCcuJyArIHRoaXMub3B0aW9ucy5uYXZpZ2F0aW9uQ2xhc3MsICh0aGlzLm9wdGlvbnMubmF2aWdhdGlvbiA9PT0gdHJ1ZSkgPyB0aGlzLnBhcmVudCA6IHRoaXMub3B0aW9ucy5uYXZpZ2F0aW9uKS5jaGlsZHJlbigpXG4gICAgICAgICAgICAgICAgLmVxKC1jdXJyZW50U2xpZGUpXG4gICAgICAgICAgICAgICAgICAgIC5hZGRDbGFzcyh0aGlzLm9wdGlvbnMubmF2aWdhdGlvbkN1cnJlbnRJdGVtQ2xhc3MpXG4gICAgICAgICAgICAgICAgICAgICAgICAuc2libGluZ3MoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcyh0aGlzLm9wdGlvbnMubmF2aWdhdGlvbkN1cnJlbnRJdGVtQ2xhc3MpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVXBkYXRlIGN1cnJlbnQgc2xpZGUgZ2xvYmFseVxuICAgICAgICB0aGlzLmN1cnJlbnRTbGlkZSA9IGN1cnJlbnRTbGlkZTtcblxuICAgICAgICAvLyBDYWxsYmFja3MgYWZ0ZXIgc2xpZGUgY2hhbmdlXG4gICAgICAgIHRoaXMuYWZ0ZXJBbmltYXRpb24oZnVuY3Rpb24gKCl7XG4gICAgICAgICAgICBzZWxmLm9wdGlvbnMuYWZ0ZXJUcmFuc2l0aW9uLmNhbGwoc2VsZik7XG4gICAgICAgICAgICBpZiAoIChjYWxsYmFjayAhPT0gJ3VuZGVmaW5lZCcpICYmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpICkgY2FsbGJhY2soKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFN0YXJ0IGF1dG9wbGF5XG4gICAgICAgICAqIFNldHRpbmcgdXAgdGltZXJcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMucGxheSgpO1xuXG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEF1dG9wbGF5IGxvZ2ljXG4gICAgICogU2V0dXAgY291bnRpbmdcbiAgICAgKi9cbiAgICBKdWFyZXoucHJvdG90eXBlLnBsYXkgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgLy8gQ2FjaGUgdGhpc1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIElmIGF1dG9wbGF5IHR1cm4gb25cbiAgICAgICAgICogU2xpZGUgb25lIGZvcndhcmQgYWZ0ZXIgYSBzZXQgdGltZVxuICAgICAgICAgKi9cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5hdXRvcGxheSkge1xuICAgICAgICAgICAgdGhpcy5hdXRvID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHNlbGYuc2xpZGUoMSwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIHNsaWRlclN0YXRlID0gdHJ1ZTtcbiAgICAgICAgICAgIH0sIHRoaXMub3B0aW9ucy5hdXRvcGxheSk7XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEF1dG9wbGF5IHBhdXNlXG4gICAgICogQ2xlYXIgY291bnRpbmdcbiAgICAgKi9cbiAgICBKdWFyZXoucHJvdG90eXBlLnBhdXNlID0gZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJZiBhdXRvcGxheSB0dXJuIG9uXG4gICAgICAgICAqIENsZWFyIGludGVyaWFsXG4gICAgICAgICAqL1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmF1dG9wbGF5KSB7IFxuICAgICAgICAgICAgdGhpcy5hdXRvID0gY2xlYXJJbnRlcnZhbCh0aGlzLmF1dG8pOyBcbiAgICAgICAgICAgIHNsaWRlclN0YXRlID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBDYWxsIGNhbGxiYWNrIGFmdGVyIGFuaW1hdGlvbiBkdXJhdGlvblxuICAgICAqIEFkZGVkIDEwIG1zIHRvIGR1cmF0aW9uIHRvIGJlIHN1cmUgaXMgZmlyZWQgYWZ0ZXIgYW5pbWF0aW9uXG4gICAgICogQHBhcmFtICB7RnVuY3Rpb259IGNhbGxiYWNrXG4gICAgICovXG4gICAgSnVhcmV6LnByb3RvdHlwZS5hZnRlckFuaW1hdGlvbiA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG5cbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKXtcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgIH0sIHRoaXMub3B0aW9ucy5hbmltYXRpb25EdXJhdGlvbiArIDEwKTtcblxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBEaW1lbnNpb25zXG4gICAgICogR2V0ICYgc2V0IGRpbWVuc2lvbnMgb2Ygc2xpZGVyIGVsZW1lbnRzXG4gICAgICovXG4gICAgSnVhcmV6LnByb3RvdHlwZS5kaW1lbnNpb25zID0gZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIC8vIEdldCBzbGlkZSB3aWR0aFxuICAgICAgICB0aGlzLnNsaWRlcy5zcHJlYWQgPSB0aGlzLnBhcmVudC53aWR0aCgpO1xuICAgICAgICAvLyBTZXQgd3JhcHBlciB3aWR0aFxuICAgICAgICB0aGlzLndyYXBwZXIud2lkdGgodGhpcy5zbGlkZXMuc3ByZWFkICogKHRoaXMuc2xpZGVzLmxlbmd0aCArIHRoaXMub2Zmc2V0KSk7XG4gICAgICAgIC8vIFNldCBzbGlkZSB3aWR0aFxuICAgICAgICB0aGlzLnNsaWRlcy5hZGQodGhpcy5maXJzdENsb25lKS5hZGQodGhpcy5sYXN0Q2xvbmUpLndpZHRoKHRoaXMuc2xpZGVzLnNwcmVhZCk7XG5cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogRGVzdHJveVxuICAgICAqIFJldmVydCBpbml0IG1vZGlmaWNhdGlvbnMgYW5kIGZyZWV6ZSBzbGlkZXNcbiAgICAgKi9cbiAgICBKdWFyZXoucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgdGhpcy5wYXJlbnQudW5iaW5kKCk7XG4gICAgICAgIHRoaXMud3JhcHBlci51bmJpbmQoKTtcbiAgICAgICAgdGhpcy53cmFwcGVyLnJlbW92ZUF0dHIoXCJzdHlsZVwiKTtcbiAgICAgICAgJCh0aGlzLm5hdmlnYXRpb24ud3JhcHBlcikuY2hpbGRyZW4oKS51bmJpbmQoKTtcbiAgICAgICAgJCh0aGlzLmFycm93cy53cmFwcGVyKS5jaGlsZHJlbigpLnVuYmluZCgpO1xuICAgICAgICB0aGlzLnNsaWRlKDAsIHRydWUpO1xuICAgICAgICB0aGlzLnBhdXNlKCk7XG5cbiAgICAgICAgaWYodGhpcy5vcHRpb25zLmNpcmN1bGFyKSB7XG4gICAgICAgICAgICB0aGlzLmZpcnN0Q2xvbmUucmVtb3ZlKCk7XG4gICAgICAgICAgICB0aGlzLmxhc3RDbG9uZS5yZW1vdmUoKTtcbiAgICAgICAgfVxuXG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemVcbiAgICAgKiBTZXQgd3JhcHBlclxuICAgICAqIFNldCBzbGlkZXNcbiAgICAgKiBTZXQgYW5pbWF0aW9uIHR5cGVcbiAgICAgKi9cbiAgICBKdWFyZXoucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMud3JhcHBlciA9IHRoaXMucGFyZW50LmNoaWxkcmVuKCk7XG4gICAgICAgIC8vIFNldCBzbGlkZXNcbiAgICAgICAgdGhpcy5zbGlkZXMgPSB0aGlzLndyYXBwZXIuY2hpbGRyZW4oKTtcbiAgICAgICAgLy8gU2V0IHNsaWRlciBkaW1lbnRpb25zXG4gICAgICAgIHRoaXMuZGltZW5zaW9ucygpO1xuICAgICAgICAvLyBCdWlsZCBET01cbiAgICAgICAgdGhpcy5idWlsZCgpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBNZXRob2RzIGZvciBjc3MzIG1hbmFnZW1lbnRcbiAgICAgKi9cbiAgICBKdWFyZXoucHJvdG90eXBlLmNzcyA9IHtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2hlY2sgY3NzMyBzdXBwb3J0XG4gICAgICAgICAqIEBwYXJhbSAge1N0cmluZ30gIERlY2xhcmF0aW9uIG5hbWUgdG8gY2hlY2tcbiAgICAgICAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICAgICAgICovXG4gICAgICAgIGlzU3VwcG9ydGVkOiBmdW5jdGlvbihkZWNsYXJhdGlvbikge1xuXG4gICAgICAgICAgICB2YXIgaXNTdXBwb3J0ZWQgPSBmYWxzZSxcbiAgICAgICAgICAgICAgICBwcmVmaXhlcyA9ICdLaHRtbCBtcyBPIE1veiBXZWJraXQnLnNwbGl0KCcgJyksXG4gICAgICAgICAgICAgICAgY2xvbmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSxcbiAgICAgICAgICAgICAgICBkZWNsYXJhdGlvbkNhcGl0YWwgPSBudWxsO1xuXG4gICAgICAgICAgICBkZWNsYXJhdGlvbiA9IGRlY2xhcmF0aW9uLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICBpZiAoY2xvbmUuc3R5bGVbZGVjbGFyYXRpb25dICE9PSB1bmRlZmluZWQpIGlzU3VwcG9ydGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChpc1N1cHBvcnRlZCA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICBkZWNsYXJhdGlvbkNhcGl0YWwgPSBkZWNsYXJhdGlvbi5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIGRlY2xhcmF0aW9uLnN1YnN0cigxKTtcbiAgICAgICAgICAgICAgICBmb3IoIHZhciBpID0gMDsgaSA8IHByZWZpeGVzLmxlbmd0aDsgaSsrICkge1xuICAgICAgICAgICAgICAgICAgICBpZiggY2xvbmUuc3R5bGVbcHJlZml4ZXNbaV0gKyBkZWNsYXJhdGlvbkNhcGl0YWwgXSAhPT0gdW5kZWZpbmVkICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaXNTdXBwb3J0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh3aW5kb3cub3BlcmEpIHtcbiAgICAgICAgICAgICAgICBpZiAod2luZG93Lm9wZXJhLnZlcnNpb24oKSA8IDEzKSBpc1N1cHBvcnRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoaXNTdXBwb3J0ZWQgPT09ICd1bmRlZmluZWQnIHx8IGlzU3VwcG9ydGVkID09PSB1bmRlZmluZWQpIGlzU3VwcG9ydGVkID0gZmFsc2U7XG5cbiAgICAgICAgICAgIHJldHVybiBpc1N1cHBvcnRlZDtcblxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgYnJvd3NlciBjc3MgcHJlZml4XG4gICAgICAgICAqIEByZXR1cm4ge1N0cmluZ30gXHRSZXR1cm5zIHByZWZpeCBpbiBcIi17cHJlZml4fS1cIiBmb3JtYXRcbiAgICAgICAgICovXG4gICAgICAgIGdldFByZWZpeDogZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICBpZiAoIXdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKSByZXR1cm4gJyc7XG5cbiAgICAgICAgICAgIHZhciBzdHlsZXMgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsICcnKTtcbiAgICAgICAgICAgIHJldHVybiAnLScgKyAoQXJyYXkucHJvdG90eXBlLnNsaWNlXG4gICAgICAgICAgICAgICAgLmNhbGwoc3R5bGVzKVxuICAgICAgICAgICAgICAgIC5qb2luKCcnKVxuICAgICAgICAgICAgICAgIC5tYXRjaCgvLShtb3p8d2Via2l0fG1zKS0vKSB8fCAoc3R5bGVzLk9MaW5rID09PSAnJyAmJiBbJycsICdvJ10pXG4gICAgICAgICAgICApWzFdICsgJy0nO1xuXG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICAkLmZuW25hbWVdID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICggISQuZGF0YSh0aGlzLCAnJykgKSB7XG4gICAgICAgICAgICAgICAgJC5kYXRhKHRoaXMsICcnLCBuZXcgSnVhcmV6KCQodGhpcyksIG9wdGlvbnMpICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbn07XG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICBsdWtuYXRvciA9IGZ1bmN0aW9uKCQpIHtcbiAgICAgICAgdGhpcy4kID0gJDtcbiAgICAgICAgdGhpcy5jb25maWd1cmUoKTtcbiAgICAgICAgdGhpcy5idWlsZCgpO1xuICAgIH07XG5cbiAgICB2YXIgaXNNb2JpbGUgPSAvQW5kcm9pZHx3ZWJPU3xpUGhvbmV8aVBhZHxpUG9kfEJsYWNrQmVycnl8SUVNb2JpbGV8T3BlcmEgTWluaS9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7XG5cbiAgICBsdWtuYXRvci5wcm90b3R5cGUuY29uZmlndXJlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuY29udmVyc2F0aW9uSWQgPSBudWxsO1xuICAgICAgICB0aGlzLndhaXRpbmdSZXNwb25zZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLmluaXRHb29nbGVNYXBzKCk7XG5cbiAgICAgICAgdmFyIHBhcmFtcyA9IHdpbmRvdy5sdWtuYXRvclBhcmFtcztcbiAgICAgICAgaWYgKHR5cGVvZiBwYXJhbXMgPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIHRoaXMudXJsID0gcGFyYW1zLnVybDtcbiAgICAgICAgICAgIHRoaXMuYnRfY2xvc2UgPSBwYXJhbXMuYnRfY2xvc2U7XG4gICAgICAgICAgICB0aGlzLmJ0X3NlbmQgPSBwYXJhbXMuYnRfc2VuZDtcbiAgICAgICAgICAgIHRoaXMuYm90X2NvaW4gPSBwYXJhbXMuYm90X2NvaW47XG4gICAgICAgICAgICB0aGlzLmJvdF9idWJibGUgPSBwYXJhbXMuYm90X2J1YmJsZTtcbiAgICAgICAgICAgIHRoaXMudGl0bGUgPSBwYXJhbXMudGl0bGU7XG5cdCAgICB0aGlzLnRhZ0NhbGxiYWNrID0gcGFyYW1zLnRhZ0NhbGxiYWNrO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGx1a25hdG9yLnByb3RvdHlwZS5pbml0R29vZ2xlTWFwcyA9IGZ1bmN0aW9uKGFjdGlvbikge1xuXG4gICAgICAgIHdpbmRvdy5pbml0TWFwID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB3aW5kb3cuZ29vZ2xlTWFwc0luaXRpYWxpemVkID0gdHJ1ZTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLiQoJ2hlYWQnKS5hcHBlbmQoXG4gICAgICAgICAgICAnPHNjcmlwdCBhc3luYyBkZWZlciAnICtcbiAgICAgICAgICAgICdzcmM9XCJodHRwczovL21hcHMuZ29vZ2xlYXBpcy5jb20vbWFwcy9hcGkvanM/a2V5PUFJemFTeUN2NnNIbmwzeXN0YzdKMnRNcEVUVVMtLS11T3V2TEZCZyZjYWxsYmFjaz1pbml0TWFwXCI+JyArXG4gICAgICAgICAgICAnPC9zY3JpcHQ+J1xuICAgICAgICApO1xuICAgIH07XG5cbiAgICBsdWtuYXRvci5wcm90b3R5cGUuYnVpbGQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAgICAgLy8gQ0hBTkdFIFRISVMgLy9cbiAgICAgICAgdmFyIGhvbHlIVE1MID0gJzxkaXYgY2xhc3M9XCJib3gtaGVhZGVyXCI+PGRpdiBjbGFzcz1cInRpdGxlXCI+PGgyPicgKyB0aGlzLnRpdGxlICsgJzwvaDI+PC9kaXY+PGRpdiBjbGFzcz1cImNsb3NlLWJ1dHRvblwiPjxpIGNsYXNzPVwiY2xvc2Ugc3ZnLWNsb3NlLWNoYXRcIiBzdHlsZT1cImN1cnNvcjpwb2ludGVyXCI+PC9pPjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XCJib3gtY29udGVudFwiPjxkaXYgY2xhc3M9XCJib3gtYWxlcnRcIj48L2Rpdj48ZGl2IGNsYXNzPVwiY2hhdC1jb250ZW50XCI+PGRpdiBjbGFzcz1cImNoYXQtaXRlbSBib3RcIj48ZGl2IGNsYXNzPVwiYm94LW9wdGlvbnNcIi8+PC9kaXY+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cImJveC1mb290ZXJcIj48ZGl2IGNsYXNzPVwiZm9ybS1hcmVhXCI+PGRpdiBjbGFzcz1cImJveC1pbnB1dFwiPjxkaXYgY2xhc3M9XCJpbnB1dC13cmFwcGVyXCI+PGJ1dHRvbiBpZD1cInN1Ym1pdGNoYXRcIiBjbGFzcz1cInN1Ym1pdC1jaGF0XCI+PC9idXR0b24+PGlucHV0IGNsYXNzPVwidXNlci1pbnB1dFwiIHR5cGU9XCJ0ZXh0XCIgZGF0YS1lbW9qaWFibGU9XCJ0cnVlXCIgcGxhY2Vob2xkZXI9XCJFc2NyZXZhIHN1YSBtZW5zYWdlbS4uLlwiPjwvZGl2PjwvZGl2PjwvZGl2PjwvZGl2Pic7XG4gICAgICAgIC8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICAgICAgdmFyIGNoYXRXaWRnZXQgPSB0aGlzLiQoJzxkaXYvPicsIHtcbiAgICAgICAgICAgICdpZCc6ICdjaGF0LXdpZGdldCcsXG4gICAgICAgICAgICAnY2xhc3MnOiAndXNlcmNoYXQtdWkgb3V0J1xuICAgICAgICB9KTtcbiAgICAgICAgY2hhdFdpZGdldC5odG1sKGhvbHlIVE1MKTtcblxuICAgICAgICAvLyBDb2luXG4gICAgICAgIHZhciBjb2luRGl2ID0gdGhpcy4kKCc8ZGl2Lz4nLCB7XG4gICAgICAgICAgICAnaWQnOiAnY2hhdC1jb2luLWljb24nXG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgY29pbkNvbnRhaW5lciA9IHRoaXMuJCgnPGRpdi8+Jywge1xuICAgICAgICAgICAgJ2NsYXNzJzogJ2F2YXRhci1jb250YWluZXInXG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgY29pbkltZyA9IHRoaXMuJCgnPGltZy8+Jywge1xuICAgICAgICAgICAgJ3NyYyc6IHRoaXMuYm90X2NvaW4sXG4gICAgICAgICAgICAnZHJhZ2dhYmxlJzogJ2ZhbHNlJ1xuICAgICAgICB9KTtcbiAgICAgICAgY29pbkNvbnRhaW5lci5hcHBlbmQoY29pbkltZyk7XG4gICAgICAgIGNvaW5EaXYuYXBwZW5kKGNvaW5Db250YWluZXIpO1xuXG4gICAgICAgIHRoaXMuJCgnbHVrbmF0b3ItY29udGFpbmVyJykuYXBwZW5kKGNoYXRXaWRnZXQpO1xuICAgICAgICB0aGlzLiQoJ2x1a25hdG9yLWNvbnRhaW5lcicpLmFwcGVuZChjb2luRGl2KTtcblxuICAgICAgICAvLyBCdXR0b24gQ2xvc2VcbiAgICAgICAgdGhpcy4kKCcuYm94LWhlYWRlciAuY2xvc2UtYnV0dG9uJykuY3NzKFxuICAgICAgICAgICAgJ2JhY2tncm91bmQnLFxuICAgICAgICAgICAgJ3VybCgnICsgdGhpcy5idF9jbG9zZSArICcpJ1xuICAgICAgICApO1xuXG4gICAgICAgIC8vIEJ1dHRvbiBTZW5kXG4gICAgICAgIHRoaXMuJCgnLnN1Ym1pdC1jaGF0JykuY3NzKFxuICAgICAgICAgICAgJ2JhY2tncm91bmQtaW1hZ2UnLFxuICAgICAgICAgICAgJ3VybCgnICsgdGhpcy5idF9zZW5kICsgJyknXG4gICAgICAgICk7XG5cbiAgICAgICAgdGhpcy5iaW5kKCk7XG5cbiAgICAgICAgdmFyIHVybFBhcmFtcyA9IG5ldyBVUkxTZWFyY2hQYXJhbXMod2luZG93LmxvY2F0aW9uLnNlYXJjaCk7XG4gICAgICAgIHZhciBvcGVuQ2hhdCA9IHVybFBhcmFtcy5nZXQoJ29wZW5DaGF0Jyk7XG5cbiAgICAgICAgaWYgKG9wZW5DaGF0KSB7XG4gICAgICAgICAgICAkKCcjY2hhdC1jb2luLWljb24nKS5jbGljaygpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGx1a25hdG9yLnByb3RvdHlwZS5iaW5kID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBoaWRlX2FsZXJ0X2RlbGF5ID0gNjAwMDA7XG5cbiAgICAgICAgLy9CaW5kIElucHV0XG4gICAgICAgIHRoaXMuJCgnLnVzZXItaW5wdXQnKS5mb2N1c2luKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy4kKCcjY2hhdC1jb2luLWljb24nKS5hZGRDbGFzcygnb3V0Jyk7XG4gICAgICAgICAgICB0aGlzLiQoJyNjaGF0LXdpZGdldCcpLmFkZENsYXNzKCdmdWxsJyk7XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG5cbiAgICAgICAgLy8gQmluZCBDb2luXG4gICAgICAgIHRoaXMuJCgnI2NoYXQtY29pbi1pY29uJykub2ZmKCkub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoJCgnLmJveC1hbGVydCcpLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAkKCcuYm94LWFsZXJ0Jykuc2xpZGVVcChcInNsb3dcIiwgZnVuY3Rpb24gKCkgeyAkKHRoaXMpLnJlbW92ZSgpOyB9KTtcbiAgICAgICAgICAgICAgICB9LCBoaWRlX2FsZXJ0X2RlbGF5KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMuJCgnI2NoYXQtd2lkZ2V0JykuaGFzQ2xhc3MoJ291dCcpID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFsdWtuYXRvci5jb252ZXJzYXRpb25JZCAmJiAhdGhpcy53YWl0aW5nUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53YWl0aW5nUmVzcG9uc2UgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLiQuYWpheCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBtb2RlOiAnY29ycycsXG4gICAgICAgICAgICAgICAgICAgICAgICB1cmw6IHRoaXMudXJsXG4gICAgICAgICAgICAgICAgICAgIH0pLmRvbmUoZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldE1lc3NhZ2VBbmRBbGVydChyZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICB9LmJpbmQodGhpcykpXG4gICAgICAgICAgICAgICAgICAgIC5mYWlsKGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LnJlc3BvbnNlSlNPTjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0TWVzc2FnZUFuZEFsZXJ0KHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4kKCcjY2hhdC13aWRnZXQnKS5yZW1vdmVDbGFzcygnb3V0Jyk7XG4gICAgICAgICAgICAgICAgICAgIGlmKGlzTW9iaWxlKSB7IHRoaXMuJCgnaHRtbCcpLmNzcyhcIm92ZXJmbG93XCIsIFwiaGlkZGVuXCIpOyB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLiQoJyNjaGF0LXdpZGdldCcpLmFkZENsYXNzKCdvdXQnKTtcbiAgICAgICAgICAgICAgICAgIGlmKGlzTW9iaWxlKSB7IHRoaXMuJCgnaHRtbCcpLmNzcyhcIm92ZXJmbG93XCIsIFwiYXV0b1wiKTsgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICAgIFxuICAgICAgICAvLyBCaW5kIENsb3NlXG4gICAgICAgIHRoaXMuJCgnI2NoYXQtd2lkZ2V0IC5jbG9zZS1idXR0b24nKS5vZmYoKS5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuJCgnI2NoYXQtY29pbi1pY29uJykucmVtb3ZlQ2xhc3MoJ291dCcpO1xuICAgICAgICAgICAgdGhpcy4kKCcjY2hhdC13aWRnZXQnKS5hZGRDbGFzcygnb3V0Jyk7XG4gICAgICAgICAgICB0aGlzLiQoJyNjaGF0LXdpZGdldCcpLnJlbW92ZUNsYXNzKCdmdWxsJyk7XG4gICAgICAgICAgICBpZihpc01vYmlsZSkgeyB0aGlzLiQoJ2h0bWwnKS5yZW1vdmVDbGFzcygnaS1hbXBodG1sLXNjcm9sbC1kaXNhYmxlZCcpOyB9XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG5cbiAgICAgICAgLy8gQmluZCBDbGljayBTdWJtaXRcbiAgICAgICAgdGhpcy4kKCcjY2hhdC13aWRnZXQgLnN1Ym1pdC1jaGF0Jykub2ZmKCkub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgIHRoaXMuY2xlYW5NZXNzYWdlKCk7XG4gICAgICAgICAgICBcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcblxuXG4gICAgICAgIC8vIEJpbmQgdGV4dCBBcmVhXG4gICAgICAgIHRoaXMuJCgnI2NoYXQtd2lkZ2V0IC51c2VyLWlucHV0Jykua2V5dXAoZnVuY3Rpb24oZSkge1xuXG4gICAgICAgICAgICBpZiAoZS5rZXlDb2RlID09IDEzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhbk1lc3NhZ2UoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9LmJpbmQodGhpcykpO1xuXG4gICAgICAgIGx1a25hdG9yLnByb3RvdHlwZS5zZXRNZXNzYWdlQW5kQWxlcnQgPSBmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgICAgICAgIGx1a25hdG9yLmNvbnZlcnNhdGlvbklkID0gcmVzdWx0LmNvbnZlcnNhdGlvbl9pZDtcbiAgICAgICAgICAgIGlmIChyZXN1bHQudHJ5X2NiICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBsdWtuYXRvci50cnlfY2IgPSByZXN1bHQudHJ5X2NiXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmNyZWF0ZU1lc3NhZ2UoJ2JvdCcsIHJlc3VsdCk7XG4gICAgICAgICAgICB0aGlzLndhaXRpbmdSZXNwb25zZSA9IGZhbHNlO1xuICAgICAgICAgICAgaWYgKHJlc3VsdC5tZXNzYWdlX2FsZXJ0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLiQoJy5ib3gtYWxlcnQnKS5hZGRDbGFzcygnYm94LWFsZXJ0LXN0eWxlJyk7XG4gICAgICAgICAgICAgICAgdGhpcy4kKCcuYm94LWFsZXJ0JykuYXBwZW5kKHJlc3VsdC5tZXNzYWdlX2FsZXJ0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGlzTW9iaWxlKSB7IHRoaXMuJCgnaHRtbCcpLmNzcyhcIm92ZXJmbG93XCIsIFwiaGlkZGVuXCIpOyB9XG4gICAgICAgIH1cblxuICAgICAgICBsdWtuYXRvci5wcm90b3R5cGUuc2VuZFRleHQgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgdmFyIHVzZXJ0ZXh0ID0gdGhpcy4kKCcjY2hhdC13aWRnZXQgLnVzZXItaW5wdXQnKS52YWwoKTtcblxuICAgICAgICAgICAgdGhpcy5jcmVhdGVNZXNzYWdlKCd1c2VyJywge1xuICAgICAgICAgICAgICAgICdyZXNwb25zZXMnOiBbdXNlcnRleHRdXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgdGhpcy4kKCcjY2hhdC13aWRnZXQgLnVzZXItaW5wdXQnKS52YWwoJycpO1xuICAgICAgICAgICAgdGhpcy4kKCcub3B0aW9ucycpLnJlbW92ZSgpO1xuICAgICAgICAgICAgdGhpcy4kKCcjY2hhdC1jb2luLWljb24nKS5hZGRDbGFzcygnb3V0Jyk7XG4gICAgICAgICAgICB0aGlzLiQoJyNjaGF0LXdpZGdldCcpLmFkZENsYXNzKCdmdWxsJyk7XG4gICAgICAgICAgICB0aGlzLiQoJy5ib3QgLnNwZWFrJykubGFzdCgpLnJlbW92ZUNsYXNzKCdzcGVhay1vcHRpb24nKTtcblxuICAgICAgICAgICAgdGhpcy5ib3RSZXF1ZXN0KHVzZXJ0ZXh0KTtcblxuICAgICAgICB9O1xuXG4gICAgICAgIGx1a25hdG9yLnByb3RvdHlwZS5jbGVhbk1lc3NhZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKCQudHJpbSgkKCcjY2hhdC13aWRnZXQgLnVzZXItaW5wdXQnKS52YWwoKSkgIT0gXCJcIikge1xuICAgICAgICAgICAgICAgIHRoaXMuc2VuZFRleHQoKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgfTtcblxuXG4gICAgfTtcblxuICAgIGx1a25hdG9yLnByb3RvdHlwZS5ib3RSZXF1ZXN0ID0gZnVuY3Rpb24odGV4dCkge1xuICAgICAgICB2YXIgYm94SW5kaWNhdG9yID0gdGhpcy4kKCcjY2hhdC13aWRnZXQgLnNwZWFrJykubGFzdCgpO1xuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgIHZhciBkYXRhID0geyAnY29udmVyc2F0aW9uX2lkJzogbHVrbmF0b3IuY29udmVyc2F0aW9uSWQgfVxuICAgICAgICBpZiAobHVrbmF0b3IudHJ5X2NiICE9IG51bGwpIHtcbiAgICAgICAgICAgIGRhdGEgPSB7ICdjb252ZXJzYXRpb25faWQnOiBsdWtuYXRvci5jb252ZXJzYXRpb25JZCwgJ3RyeV9jYic6IGx1a25hdG9yLnRyeV9jYiB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRleHQpIHsgZGF0YS50ZXh0ID0gdGV4dCB9XG5cbiAgICAgICAgdGhpcy4kLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiB0aGlzLnVybCxcbiAgICAgICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgICAgIG1vZGU6ICdjb3JzJyxcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXG4gICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeShkYXRhKSxcbiAgICAgICAgICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOCcsXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbihyZXN1bHQpe1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICQoJyNjaGF0LXdpZGdldCAudXNlci1pbnB1dCcpLnByb3AoJ2Rpc2FibGVkJywgZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICAkKFwiZGl2LmZsb2F0LXR5cGluZ1wiKS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgbHVrbmF0b3IudHJ5X2NiID0gcmVzdWx0LnRyeV9jYjtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoYXQuY3JlYXRlTWVzc2FnZSgnYm90JywgcmVzdWx0KTtcbiAgICAgICAgICAgICAgICB9LCA4MDApO1xuXG4gICAgICAgICAgICB9LmJpbmQodGhpcyksXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ2Vycm9yIHByb2Nlc3NpbmcgcmVxdWVzdDogJysgcmVzdWx0LnJlc3BvbnNlVGV4dCArJ1xcbnN0YXR1czogJysgcmVzdWx0LnN0YXR1cyArJyBcXG5zdGF0dXNUZXh0OicgKyByZXN1bHQuc3RhdHVzVGV4dClcbiAgICAgICAgICAgICAgICAkKCcjY2hhdC13aWRnZXQgLnVzZXItaW5wdXQnKS5wcm9wKCdkaXNhYmxlZCcsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAkKFwiZGl2LmZsb2F0LXR5cGluZ1wiKS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICByZXN1bHQucmVzcG9uc2VzID0gWydEZXNjdWxwYSwgZXN0b3UgdGVuZG8gdW0gcHJvYmxlbWluaGEsIHBvZGVtb3MgZmFsYXIgbWFpcyB0YXJkZT8nXTtcbiAgICAgICAgICAgICAgICBpZihcInJlc3BvbnNlSlNPTlwiIGluIHJlc3VsdCl7XG4gICAgICAgICAgICAgICAgICAgIHZhciByZXNwb25zZUpTT04gPSByZXN1bHQucmVzcG9uc2VKU09OO1xuICAgICAgICAgICAgICAgICAgICBpZihcImNvbnZlcnNhdGlvbl9pZFwiIGluIHJlc3BvbnNlSlNPTil7XG4gICAgICAgICAgICAgICAgICAgICAgICBsdWtuYXRvci5jb252ZXJzYXRpb25faWQgPSByZXNwb25zZUpTT04uY29udmVyc2F0aW9uX2lkO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnJlc3BvbnNlcyA9IHJlc3BvbnNlSlNPTi5yZXNwb25zZXM7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzdWx0KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhhdC5jcmVhdGVNZXNzYWdlKCdib3QnLCByZXN1bHQpO1xuICAgICAgICAgICAgfS5iaW5kKHRoaXMpXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuJCgnI2NoYXQtd2lkZ2V0IC51c2VyLWlucHV0JykucHJvcCgnZGlzYWJsZWQnLCB0cnVlKTtcblxuICAgICAgICBib3hJbmRpY2F0b3IuYWZ0ZXIoJzxkaXYgY2xhc3M9XCJmbG9hdC10eXBpbmdcIj48ZGl2IGNsYXNzPVwidHlwaW5nLWluZGljYXRvclwiPjxzcGFuPjwvc3Bhbj48c3Bhbj48L3NwYW4+PHNwYW4+PC9zcGFuPjwvZGl2PjwvZGl2PicpO1xuICAgIH07XG5cbiAgICBsdWtuYXRvci5wcm90b3R5cGUuYWN0aW9uRGlzcGxheU9wdGlvbnMgPSBmdW5jdGlvbihhY3Rpb24pIHtcblxuICAgICAgICB2YXIgYm94T3B0aW9ucyA9IHRoaXMuJCgnI2NoYXQtd2lkZ2V0IC5zcGVhaycpLmxhc3QoKTtcbiAgICAgICAgdmFyIG9wdGlvbnMgPSBhY3Rpb24ub3B0aW9ucztcbiAgICAgICAgdmFyIGRpdl9vcHRpb25zID0gdGhpcy4kKCc8ZGl2PicsIHtcbiAgICAgICAgICAgICdjbGFzcyc6ICdvcHRpb25zJ1xuICAgICAgICB9KTtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9wdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBvcHRpb25fdGV4dCA9IG9wdGlvbnNbaV07XG5cbiAgICAgICAgICAgIHZhciBvcHRpb24gPSB0aGlzLiQoJzxpbnB1dD4nKS5hdHRyKHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnYnV0dG9uJyxcbiAgICAgICAgICAgICAgICBpZDogb3B0aW9uX3RleHQsXG4gICAgICAgICAgICAgICAgdmFsdWU6IG9wdGlvbl90ZXh0LFxuICAgICAgICAgICAgICAgIGNsYXNzOiAnaW5wdXQtb3B0aW9uJ1xuICAgICAgICAgICAgfSkub2ZmKCkub24oJ2NsaWNrJywgZnVuY3Rpb24oYnV0dG9uKSB7XG5cbiAgICAgICAgICAgICAgICB2YXIgb3B0aW9uX3RleHQgPSBidXR0b24udGFyZ2V0LmlkO1xuICAgICAgICAgICAgICAgIHRoaXMuY3JlYXRlTWVzc2FnZSgndXNlcicsIHtcbiAgICAgICAgICAgICAgICAgICAgJ3Jlc3BvbnNlcyc6IFtvcHRpb25fdGV4dF1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLiQoJy5vcHRpb25zJykucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgdGhpcy4kKCcjY2hhdC13aWRnZXQgLnVzZXItaW5wdXQnKS52YWwoJycpO1xuICAgICAgICAgICAgICAgIHRoaXMuJCgnI2NoYXQtY29pbi1pY29uJykuYWRkQ2xhc3MoJ291dCcpO1xuICAgICAgICAgICAgICAgIHRoaXMuJCgnI2NoYXQtd2lkZ2V0JykuYWRkQ2xhc3MoJ2Z1bGwnKTtcbiAgICAgICAgICAgICAgICBib3hPcHRpb25zLnJlbW92ZUNsYXNzKCdzcGVhay1vcHRpb24nKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuYm90UmVxdWVzdChvcHRpb25fdGV4dCk7XG5cbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG5cbiAgICAgICAgICAgIGRpdl9vcHRpb25zLmFwcGVuZChvcHRpb24pO1xuICAgICAgICB9XG5cbiAgICAgICAgYm94T3B0aW9ucy5hZGRDbGFzcygnc3BlYWstb3B0aW9uJyk7XG5cbiAgICAgICAgdGhpcy4kKCcjY2hhdC13aWRnZXQgLmJveC1jb250ZW50JykuYW5pbWF0ZSh7XG4gICAgICAgICAgICBzY3JvbGxUb3A6IDk5OTk5XG4gICAgICAgIH0sIDUwMCk7XG4gXG4gICAgICAgIGJveE9wdGlvbnMuYXBwZW5kKGRpdl9vcHRpb25zKTtcblxuICAgIH07XG5cbiAgICBsdWtuYXRvci5wcm90b3R5cGUuY3JlYXRlTWVzc2FnZSA9IGZ1bmN0aW9uKGNsYXNzTmFtZSwgcmVzdWx0KSB7XG4gICAgICAgIHRoaXMuJCgnI2NoYXQtd2lkZ2V0JykucmVtb3ZlQ2xhc3MoJ291dCcpO1xuXG5cdC8vIGV4cG9zZSBib3QgdGFnXG4gICAgICAgIHdpbmRvdy5Cb3RUYWcgPSByZXN1bHQudGFnO1xuXHRpZiAodGhpcy50YWdDYWxsYmFjayAmJiBjbGFzc05hbWUgPT0gJ2JvdCcpIHtcblx0ICAgIHRoaXMudGFnQ2FsbGJhY2socmVzdWx0LnRhZyk7XG5cdH1cblx0XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgcmVzdWx0LnJlc3BvbnNlcy5sZW5ndGg7IGorKykge1xuXG4gICAgICAgICAgICB2YXIgdGV4dCA9IHJlc3VsdC5yZXNwb25zZXNbal07XG4gICAgICAgICAgICB2YXIgZnVsbENsYXNzTmFtZSA9ICdjaGF0LWl0ZW0gJyArIGNsYXNzTmFtZTtcbiAgICAgICAgICAgIHZhciBjaGF0SXRlbSA9IHRoaXMuJCgnPGRpdj4nLCB7XG4gICAgICAgICAgICAgICAnY2xhc3MnOiBmdWxsQ2xhc3NOYW1lXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgdmFyIHNwYW4gPSB0aGlzLiQoJzxzcGFuPicpO1xuXG4gICAgICAgICAgICBpZiAoY2xhc3NOYW1lID09ICdib3QnKSB7XG4gICAgICAgICAgICAgICAgdmFyIGF2YXRhciA9IHRoaXMuJCgnPGRpdj4nLCB7XG4gICAgICAgICAgICAgICAgICAgICdjbGFzcyc6ICdhdmF0YXInXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdmFyIGltZyA9IHRoaXMuJCgnPGltZz4nKVxuICAgICAgICAgICAgICAgICAgICAuYXR0cignc3JjJywgdGhpcy5ib3RfYnViYmxlKVxuICAgICAgICAgICAgICAgICAgICAuYXR0cignZHJhZ2dhYmxlJywgJ2ZhbHNlJyk7XG4gICAgICAgICAgICAgICAgYXZhdGFyLmFwcGVuZChpbWcpO1xuICAgICAgICAgICAgICAgIGNoYXRJdGVtLmFwcGVuZChhdmF0YXIpO1xuICAgICAgICAgICAgICAgIHNwYW4uaHRtbCh0ZXh0KTtcblxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzcGFuLnRleHQodGV4dCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBzcGVhayA9IHRoaXMuJCgnPGRpdj4nLCB7XG4gICAgICAgICAgICAgICAgJ2NsYXNzJzogJ3NwZWFrJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBzcGVhay5hcHBlbmQoc3Bhbik7XG4gICAgICAgICAgICBjaGF0SXRlbS5hcHBlbmQoc3BlYWspO1xuXG4gICAgICAgICAgICB0aGlzLiQoJyNjaGF0LXdpZGdldCAuY2hhdC1jb250ZW50JykuYXBwZW5kKGNoYXRJdGVtKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyZXN1bHQudHJ5X2NiICE9IG51bGwgJiYgcmVzdWx0LnRyeV9jYiA+IDApIHtcbiAgICAgICAgICAgIGlmIChyZXN1bHQudHJ5X2NiID09IDEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFjdGlvbkRpc3BsYXlPcHRpb25zKHtcIm9wdGlvbnNcIjogW1wiRmFsYXIgY29tIGF0ZW5kZW50ZVwiLCBcIk7Do28gcHJlY2lzYVwiXSB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hY3Rpb25EaXNwbGF5T3B0aW9ucyh7XCJvcHRpb25zXCI6IFtcIkZhbGFyIGNvbSBhdGVuZGVudGVcIiwgXCJBdMOpIG1haXMgdGFyZGVcIl0gfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgfVxuXG5cbiAgICAgICAgaWYgKHJlc3VsdC5hY3Rpb25zKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlc3VsdC5hY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG5cbiAgICAgICAgICAgICAgICB2YXIgYWN0aW9uID0gcmVzdWx0LmFjdGlvbnNbaV07XG5cbiAgICAgICAgICAgICAgICBpZiAoYWN0aW9uLnR5cGUgPT0gJ2F1dG9fcmVwbHknKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYm90UmVxdWVzdCgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChhY3Rpb24udHlwZSA9PSAnb3B0aW9uJyB8fCBhY3Rpb24udHlwZSA9PSAnZGlzcGxheV9vcHRpb25zJykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFjdGlvbkRpc3BsYXlPcHRpb25zKGFjdGlvbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy4kKCcjY2hhdC13aWRnZXQgLmJveC1jb250ZW50JykuYW5pbWF0ZSh7XG4gICAgICAgICAgICBzY3JvbGxUb3A6IDk5OTk5XG4gICAgICAgIH0sIDApO1xuXG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIG1haW4ocGFyYW1zKSB7XG4gICAgICAgIHdpbmRvdy5qUXVlcnkoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCQpIHtcblxuICAgICAgICAgICAgaWYgKCF3aW5kb3cuX2x1a25hdG9yKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNzc0xpbmsgPSAkKCc8bGluaz4nLCB7XG4gICAgICAgICAgICAgICAgICAgIHJlbDogJ3N0eWxlc2hlZXQnLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAndGV4dC9jc3MnLFxuICAgICAgICAgICAgICAgICAgICBocmVmOiB3aW5kb3cubHVrbmF0b3JQYXJhbXMuY3NzXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY3NzTGluay5hcHBlbmRUbygnaGVhZCcpO1xuICAgICAgICAgICAgICAgIHdpbmRvdy5fbHVrbmF0b3IgPSBuZXcgbHVrbmF0b3IoJCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8vLy8vLy8vLy8vL1xuICAgIC8vIExvYWRlciAvL1xuICAgIC8vLy8vLy8vLy8vL1xuICAgIHZhciBqUXVlcnk7XG4gICAgaWYgKHdpbmRvdy5qUXVlcnkgPT09IHVuZGVmaW5lZCB8fCB3aW5kb3cualF1ZXJ5LmZuLmpxdWVyeSAhPT0gJzEuMTIuNCcpIHtcblxuICAgICAgICB2YXIgc2NyaXB0X3RhZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuXG4gICAgICAgIHNjcmlwdF90YWcuc2V0QXR0cmlidXRlKCd0eXBlJywgJ3RleHQvamF2YXNjcmlwdCcpO1xuICAgICAgICBzY3JpcHRfdGFnLnNldEF0dHJpYnV0ZShcbiAgICAgICAgICAgICdzcmMnLFxuICAgICAgICAgICAgJy8vYWpheC5nb29nbGVhcGlzLmNvbS9hamF4L2xpYnMvanF1ZXJ5LzEuMTIuNC9qcXVlcnkubWluLmpzJ1xuICAgICAgICApO1xuXG4gICAgICAgIGlmIChzY3JpcHRfdGFnLnJlYWR5U3RhdGUpIHtcbiAgICAgICAgICAgIHNjcmlwdF90YWcub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7IC8vIEZvciBvbGQgdmVyc2lvbnMgb2YgSUVcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5yZWFkeVN0YXRlID09ICdjb21wbGV0ZScgfHwgdGhpcy5yZWFkeVN0YXRlID09ICdsb2FkZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjcmlwdExvYWRIYW5kbGVyKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNjcmlwdF90YWcub25sb2FkID0gc2NyaXB0TG9hZEhhbmRsZXI7XG4gICAgICAgIH1cbiAgICAgICAgKGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0gfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50KS5hcHBlbmRDaGlsZChzY3JpcHRfdGFnKTtcblxuICAgIH0gZWxzZSB7XG4gICAgICAgIGpRdWVyeSA9IHdpbmRvdy5qUXVlcnk7XG4gICAgICAgIG1haW4oKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzY3JpcHRMb2FkSGFuZGxlcigpIHtcbiAgICAgICAgalF1ZXJ5ID0gd2luZG93LmpRdWVyeS5ub0NvbmZsaWN0KHRydWUpO1xuICAgICAgICBtYWluKCk7XG4gICAgfTtcblxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XG5cbiAgICBsdWtuYXRvciA9IGZ1bmN0aW9uKCQpIHtcbiAgICAgICAgdGhpcy4kID0gJDtcbiAgICAgICAgdGhpcy5jb25maWd1cmUoKTtcbiAgICAgICAgdGhpcy5idWlsZCgpO1xuICAgIH07XG5cbiAgICB2YXIgaXNNb2JpbGUgPSAvQW5kcm9pZHx3ZWJPU3xpUGhvbmV8aVBhZHxpUG9kfEJsYWNrQmVycnl8SUVNb2JpbGV8T3BlcmEgTWluaS9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7XG4gICAgdmFyIG1sMl9zaWRfYyA9IHVuZGVmaW5lZDtcbiAgICB2YXIgY2hhdF91c2VyX3V1aWQgPSB1bmRlZmluZWQ7XG5cbiAgICBsdWtuYXRvci5wcm90b3R5cGUuY29uZmlndXJlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuY29udmVyc2F0aW9uSWQgPSBudWxsO1xuICAgICAgICB0aGlzLndhaXRpbmdSZXNwb25zZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLmluaXRHb29nbGVNYXBzKCk7XG5cbiAgICAgICAgdmFyIHBhcmFtcyA9IHdpbmRvdy5sdWtuYXRvclBhcmFtcztcbiAgICAgICAgaWYgKHR5cGVvZiBwYXJhbXMgPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIHRoaXMudXJsID0gcGFyYW1zLnVybDtcbiAgICAgICAgICAgIHRoaXMuYnRfY2xvc2UgPSBwYXJhbXMuYnRfY2xvc2U7XG4gICAgICAgICAgICB0aGlzLmJ0X3NlbmQgPSBwYXJhbXMuYnRfc2VuZDtcbiAgICAgICAgICAgIHRoaXMuYm90X2NvaW4gPSBwYXJhbXMuYm90X2NvaW47XG4gICAgICAgICAgICB0aGlzLmJvdF9idWJibGUgPSBwYXJhbXMuYm90X2J1YmJsZTtcbiAgICAgICAgICAgIHRoaXMudGl0bGUgPSBwYXJhbXMudGl0bGU7XG5cdCAgICB0aGlzLnRhZ0NhbGxiYWNrID0gcGFyYW1zLnRhZ0NhbGxiYWNrO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGx1a25hdG9yLnByb3RvdHlwZS5pbml0R29vZ2xlTWFwcyA9IGZ1bmN0aW9uKGFjdGlvbikge1xuXG4gICAgICAgIHdpbmRvdy5pbml0TWFwID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB3aW5kb3cuZ29vZ2xlTWFwc0luaXRpYWxpemVkID0gdHJ1ZTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLiQoJ2hlYWQnKS5hcHBlbmQoXG4gICAgICAgICAgICAnPHNjcmlwdCBhc3luYyBkZWZlciAnICtcbiAgICAgICAgICAgICdzcmM9XCJodHRwczovL21hcHMuZ29vZ2xlYXBpcy5jb20vbWFwcy9hcGkvanM/a2V5PUFJemFTeUN2NnNIbmwzeXN0YzdKMnRNcEVUVVMtLS11T3V2TEZCZyZjYWxsYmFjaz1pbml0TWFwXCI+JyArXG4gICAgICAgICAgICAnPC9zY3JpcHQ+J1xuICAgICAgICApO1xuICAgIH07XG5cbiAgICBsdWtuYXRvci5wcm90b3R5cGUuYnVpbGQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAgICAgLy8gQ0hBTkdFIFRISVMgLy9cbiAgICAgICAgdmFyIGhvbHlIVE1MID0gJzxkaXYgY2xhc3M9XCJib3gtaGVhZGVyXCI+PGRpdiBjbGFzcz1cInRpdGxlXCI+PGgyPicgKyB0aGlzLnRpdGxlICsgJzwvaDI+PC9kaXY+PGRpdiBjbGFzcz1cImNsb3NlLWJ1dHRvblwiPjxpIGNsYXNzPVwiY2xvc2Ugc3ZnLWNsb3NlLWNoYXRcIiBzdHlsZT1cImN1cnNvcjpwb2ludGVyXCI+PC9pPjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XCJib3gtY29udGVudFwiPjxkaXYgY2xhc3M9XCJib3gtYWxlcnRcIj48L2Rpdj48ZGl2IGNsYXNzPVwiY2hhdC1jb250ZW50XCI+PGRpdiBjbGFzcz1cImNoYXQtaXRlbSBib3RcIj48ZGl2IGNsYXNzPVwiYm94LW9wdGlvbnNcIi8+PC9kaXY+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz1cImJveC1mb290ZXJcIj48ZGl2IGNsYXNzPVwiZm9ybS1hcmVhXCI+PGRpdiBjbGFzcz1cImJveC1pbnB1dFwiPjxkaXYgY2xhc3M9XCJpbnB1dC13cmFwcGVyXCI+PGJ1dHRvbiBpZD1cInN1Ym1pdGNoYXRcIiBjbGFzcz1cInN1Ym1pdC1jaGF0XCI+PC9idXR0b24+PGlucHV0IGNsYXNzPVwidXNlci1pbnB1dFwiIHR5cGU9XCJ0ZXh0XCIgZGF0YS1lbW9qaWFibGU9XCJ0cnVlXCIgcGxhY2Vob2xkZXI9XCJFc2NyZXZhIHN1YSBtZW5zYWdlbS4uLlwiPjwvZGl2PjwvZGl2PjwvZGl2PjwvZGl2Pic7XG4gICAgICAgIC8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICAgICAgdmFyIGNoYXRXaWRnZXQgPSB0aGlzLiQoJzxkaXYvPicsIHtcbiAgICAgICAgICAgICdpZCc6ICdjaGF0LXdpZGdldCcsXG4gICAgICAgICAgICAnY2xhc3MnOiAndXNlcmNoYXQtdWkgb3V0J1xuICAgICAgICB9KTtcbiAgICAgICAgY2hhdFdpZGdldC5odG1sKGhvbHlIVE1MKTtcblxuICAgICAgICAvLyBDb2luXG4gICAgICAgIHZhciBjb2luRGl2ID0gdGhpcy4kKCc8ZGl2Lz4nLCB7XG4gICAgICAgICAgICAnaWQnOiAnY2hhdC1jb2luLWljb24nXG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgY29pbkNvbnRhaW5lciA9IHRoaXMuJCgnPGRpdi8+Jywge1xuICAgICAgICAgICAgJ2NsYXNzJzogJ2F2YXRhci1jb250YWluZXInXG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgY29pbkltZyA9IHRoaXMuJCgnPGltZy8+Jywge1xuICAgICAgICAgICAgJ3NyYyc6IHRoaXMuYm90X2NvaW4sXG4gICAgICAgICAgICAnZHJhZ2dhYmxlJzogJ2ZhbHNlJ1xuICAgICAgICB9KTtcbiAgICAgICAgY29pbkNvbnRhaW5lci5hcHBlbmQoY29pbkltZyk7XG4gICAgICAgIGNvaW5EaXYuYXBwZW5kKGNvaW5Db250YWluZXIpO1xuXG4gICAgICAgIHRoaXMuJCgnbHVrbmF0b3ItY29udGFpbmVyJykuYXBwZW5kKGNoYXRXaWRnZXQpO1xuICAgICAgICB0aGlzLiQoJ2x1a25hdG9yLWNvbnRhaW5lcicpLmFwcGVuZChjb2luRGl2KTtcblxuICAgICAgICAvLyBCdXR0b24gQ2xvc2VcbiAgICAgICAgdGhpcy4kKCcuYm94LWhlYWRlciAuY2xvc2UtYnV0dG9uJykuY3NzKFxuICAgICAgICAgICAgJ2JhY2tncm91bmQnLFxuICAgICAgICAgICAgJ3VybCgnICsgdGhpcy5idF9jbG9zZSArICcpJ1xuICAgICAgICApO1xuXG4gICAgICAgIC8vIEJ1dHRvbiBTZW5kXG4gICAgICAgIHRoaXMuJCgnLnN1Ym1pdC1jaGF0JykuY3NzKFxuICAgICAgICAgICAgJ2JhY2tncm91bmQtaW1hZ2UnLFxuICAgICAgICAgICAgJ3VybCgnICsgdGhpcy5idF9zZW5kICsgJyknXG4gICAgICAgICk7XG5cbiAgICAgICAgdGhpcy5iaW5kKCk7XG5cbiAgICAgICAgdmFyIHVybFBhcmFtcyA9IG5ldyBVUkxTZWFyY2hQYXJhbXMod2luZG93LmxvY2F0aW9uLnNlYXJjaCk7XG4gICAgICAgIHZhciBvcGVuQ2hhdCA9IHVybFBhcmFtcy5nZXQoJ29wZW5DaGF0Jyk7XG5cbiAgICAgICAgaWYgKG9wZW5DaGF0KSB7XG4gICAgICAgICAgICAkKCcjY2hhdC1jb2luLWljb24nKS5jbGljaygpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGx1a25hdG9yLnByb3RvdHlwZS5iaW5kID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBoaWRlX2FsZXJ0X2RlbGF5ID0gNjAwMDA7XG5cbiAgICAgICAgLy9CaW5kIElucHV0XG4gICAgICAgIHRoaXMuJCgnLnVzZXItaW5wdXQnKS5mb2N1c2luKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy4kKCcjY2hhdC1jb2luLWljb24nKS5hZGRDbGFzcygnb3V0Jyk7XG4gICAgICAgICAgICB0aGlzLiQoJyNjaGF0LXdpZGdldCcpLmFkZENsYXNzKCdmdWxsJyk7XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG5cbiAgICAgICAgLy8gQmluZCBDb2luXG4gICAgICAgIHRoaXMuJCgnI2NoYXQtY29pbi1pY29uJykub2ZmKCkub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyB2ZXJpZnkgY29va2llc1xuICAgICAgICAgICAgdGhpcy5oYW5kbGVDb29raWVVc2VyVW5pcXVlKCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIHJlbW92ZSBtZXNzYWdlXG4gICAgICAgICAgICBpZiAoJCgnLmJveC1hbGVydCcpLmxlbmd0aCl7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICAkKCcuYm94LWFsZXJ0Jykuc2xpZGVVcCggXCJzbG93XCIsIGZ1bmN0aW9uKCl7ICQodGhpcykucmVtb3ZlKCk7fSk7XG4gICAgICAgICAgICAgICAgfSwgaGlkZV9hbGVydF9kZWxheSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChtbDJfc2lkX2MgIT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51cmwgKz0gJz9tbDJfc2lkX2M9JyArIG1sMl9zaWRfY1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhpcy4kKCcjY2hhdC13aWRnZXQnKS5oYXNDbGFzcygnb3V0JykgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWx1a25hdG9yLmNvbnZlcnNhdGlvbklkICYmICF0aGlzLndhaXRpbmdSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLndhaXRpbmdSZXNwb25zZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuJC5hamF4KHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vZGU6ICdjb3JzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybDogdGhpcy51cmxcbiAgICAgICAgICAgICAgICAgICAgfSkuZG9uZShmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRNZXNzYWdlQW5kQWxlcnQocmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgfS5iaW5kKHRoaXMpKVxuICAgICAgICAgICAgICAgICAgICAuZmFpbChmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdC5yZXNwb25zZUpTT047XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldE1lc3NhZ2VBbmRBbGVydChyZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuJCgnI2NoYXQtd2lkZ2V0JykucmVtb3ZlQ2xhc3MoJ291dCcpO1xuICAgICAgICAgICAgICAgICAgICBpZihpc01vYmlsZSkgeyB0aGlzLiQoJ2h0bWwnKS5jc3MoXCJvdmVyZmxvd1wiLCBcImhpZGRlblwiKTsgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy4kKCcjY2hhdC13aWRnZXQnKS5hZGRDbGFzcygnb3V0Jyk7XG4gICAgICAgICAgICAgICAgICBpZihpc01vYmlsZSkgeyB0aGlzLiQoJ2h0bWwnKS5jc3MoXCJvdmVyZmxvd1wiLCBcImF1dG9cIik7IH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgICBcbiAgICAgICAgLy8gQmluZCBDbG9zZVxuICAgICAgICB0aGlzLiQoJyNjaGF0LXdpZGdldCAuY2xvc2UtYnV0dG9uJykub2ZmKCkub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLiQoJyNjaGF0LWNvaW4taWNvbicpLnJlbW92ZUNsYXNzKCdvdXQnKTtcbiAgICAgICAgICAgIHRoaXMuJCgnI2NoYXQtd2lkZ2V0JykuYWRkQ2xhc3MoJ291dCcpO1xuICAgICAgICAgICAgdGhpcy4kKCcjY2hhdC13aWRnZXQnKS5yZW1vdmVDbGFzcygnZnVsbCcpO1xuICAgICAgICAgICAgaWYoaXNNb2JpbGUpIHsgdGhpcy4kKCdodG1sJykucmVtb3ZlQ2xhc3MoJ2ktYW1waHRtbC1zY3JvbGwtZGlzYWJsZWQnKTsgfVxuICAgICAgICB9LmJpbmQodGhpcykpO1xuXG4gICAgICAgIC8vIEJpbmQgQ2xpY2sgU3VibWl0XG4gICAgICAgIHRoaXMuJCgnI2NoYXQtd2lkZ2V0IC5zdWJtaXQtY2hhdCcpLm9mZigpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICB0aGlzLmNsZWFuTWVzc2FnZSgpO1xuICAgICAgICAgICAgXG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG5cbiAgICAgICAgLy8gQmluZCB0ZXh0IEFyZWFcbiAgICAgICAgdGhpcy4kKCcjY2hhdC13aWRnZXQgLnVzZXItaW5wdXQnKS5rZXl1cChmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBpZiAoZS5rZXlDb2RlID09IDEzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhbk1lc3NhZ2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgICAgbHVrbmF0b3IucHJvdG90eXBlLmhhbmRsZUNvb2tpZVVzZXJVbmlxdWUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBjb29raWVzID0gZG9jdW1lbnQuY29va2llLnNwbGl0KFwiO1wiKTtcbiAgICAgICAgICAgIGlmIChjb29raWVzLmZpbmQoZWwgPT4gZWwuaW5jbHVkZXMoXCJtbDJfc2lkX2NcIikpKSB7XG4gICAgICAgICAgICAgICAgYiA9IGNvb2tpZXMuZmluZChlbCA9PiBlbC5pbmNsdWRlcyhcIm1sMl9zaWRfY1wiKSk7XG4gICAgICAgICAgICAgICAgbWwyX3NpZF9jID0gZGVjb2RlVVJJQ29tcG9uZW50KGIucmVwbGFjZShcIm1sMl9zaWRfYz1cIiwgXCJcIikpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGx1a25hdG9yLnByb3RvdHlwZS5zZXRDb29raWUgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSwgIGV4cERheXMpIHtcbiAgICAgICAgICAgIHZhciBkYXRlID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgIGRhdGUuc2V0VGltZShkYXRlLmdldERhdGUoKSArIChleHBEYXlzICogMjQgKiA2MCAqIDYwICogMTAwMCkpO1xuICAgICAgICAgICAgZG9jdW1lbnQuY29va2llID0gbmFtZSArIFwiPVwiICsgdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGx1a25hdG9yLnByb3RvdHlwZS5zZXRNZXNzYWdlQW5kQWxlcnQgPSBmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgICAgICAgIGx1a25hdG9yLmNvbnZlcnNhdGlvbklkID0gcmVzdWx0LmNvbnZlcnNhdGlvbl9pZDtcbiAgICAgICAgICAgIGlmIChyZXN1bHQudHJ5X2NiICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBsdWtuYXRvci50cnlfY2IgPSByZXN1bHQudHJ5X2NiXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmNyZWF0ZU1lc3NhZ2UoJ2JvdCcsIHJlc3VsdCk7XG4gICAgICAgICAgICB0aGlzLndhaXRpbmdSZXNwb25zZSA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy4kKCcuYm94LWFsZXJ0JykuYXBwZW5kKHJlc3VsdC5tZXNzYWdlX2FsZXJ0KTtcbiAgICAgICAgICAgIGlmKGlzTW9iaWxlKSB7IHRoaXMuJCgnaHRtbCcpLmNzcyhcIm92ZXJmbG93XCIsIFwiaGlkZGVuXCIpOyB9XG4gICAgICAgIH1cblxuICAgICAgICBsdWtuYXRvci5wcm90b3R5cGUuc2VuZFRleHQgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgdmFyIHVzZXJ0ZXh0ID0gdGhpcy4kKCcjY2hhdC13aWRnZXQgLnVzZXItaW5wdXQnKS52YWwoKTtcblxuICAgICAgICAgICAgdGhpcy5jcmVhdGVNZXNzYWdlKCd1c2VyJywge1xuICAgICAgICAgICAgICAgICdyZXNwb25zZXMnOiBbdXNlcnRleHRdXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgdGhpcy4kKCcjY2hhdC13aWRnZXQgLnVzZXItaW5wdXQnKS52YWwoJycpO1xuICAgICAgICAgICAgdGhpcy4kKCcub3B0aW9ucycpLnJlbW92ZSgpO1xuICAgICAgICAgICAgdGhpcy4kKCcjY2hhdC1jb2luLWljb24nKS5hZGRDbGFzcygnb3V0Jyk7XG4gICAgICAgICAgICB0aGlzLiQoJyNjaGF0LXdpZGdldCcpLmFkZENsYXNzKCdmdWxsJyk7XG4gICAgICAgICAgICB0aGlzLiQoJy5ib3QgLnNwZWFrJykubGFzdCgpLnJlbW92ZUNsYXNzKCdzcGVhay1vcHRpb24nKTtcblxuICAgICAgICAgICAgdGhpcy5ib3RSZXF1ZXN0KHVzZXJ0ZXh0KTtcblxuICAgICAgICB9O1xuXG4gICAgICAgIGx1a25hdG9yLnByb3RvdHlwZS5jbGVhbk1lc3NhZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKCQudHJpbSgkKCcjY2hhdC13aWRnZXQgLnVzZXItaW5wdXQnKS52YWwoKSkgIT0gXCJcIikge1xuICAgICAgICAgICAgICAgIHRoaXMuc2VuZFRleHQoKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgbHVrbmF0b3IucHJvdG90eXBlLmJvdFJlcXVlc3QgPSBmdW5jdGlvbih0ZXh0KSB7XG4gICAgICAgIHZhciBib3hJbmRpY2F0b3IgPSB0aGlzLiQoJyNjaGF0LXdpZGdldCAuc3BlYWsnKS5sYXN0KCk7XG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgdmFyIGRhdGEgPSB7ICdjb252ZXJzYXRpb25faWQnOiBsdWtuYXRvci5jb252ZXJzYXRpb25JZCB9XG4gICAgICAgIGlmIChsdWtuYXRvci50cnlfY2IgIT0gbnVsbCkge1xuICAgICAgICAgICAgZGF0YSA9IHsgJ2NvbnZlcnNhdGlvbl9pZCc6IGx1a25hdG9yLmNvbnZlcnNhdGlvbklkLCAndHJ5X2NiJzogbHVrbmF0b3IudHJ5X2NiIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodGV4dCkgeyBkYXRhLnRleHQgPSB0ZXh0IH1cblxuICAgICAgICBpZiAodGhpcy51cmwuaW5kZXhPZignanVwaXRlcicpICE9PSAtMSkgeyBkYXRhLndhX2lkID0gJzU1MzQ5MjM5Nzg5NSd9XG5cbiAgICAgICAgdGhpcy4kLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiB0aGlzLnVybCxcbiAgICAgICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgICAgIG1vZGU6ICdjb3JzJyxcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXG4gICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeShkYXRhKSxcbiAgICAgICAgICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOCcsXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbihyZXN1bHQpe1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICQoJyNjaGF0LXdpZGdldCAudXNlci1pbnB1dCcpLnByb3AoJ2Rpc2FibGVkJywgZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICAkKFwiZGl2LmZsb2F0LXR5cGluZ1wiKS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgbHVrbmF0b3IudHJ5X2NiID0gcmVzdWx0LnRyeV9jYjtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoYXQuY3JlYXRlTWVzc2FnZSgnYm90JywgcmVzdWx0KTtcbiAgICAgICAgICAgICAgICB9LCA4MDApO1xuXG4gICAgICAgICAgICB9LmJpbmQodGhpcyksXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQucmVzcG9uc2VUZXh0LmluZGV4T2YoJ2h0bWwnKSAhPSAtMSkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQucmVzcG9uc2VzID0gWydIdW1tbSEgVMO0IGNvbSB1bSBwcm9ibGVtaW5oYSBhcXVpIG5vcyBtZXVzIGFsZ29yw610aW1vcyBlIG7Do28gcGVndWVpIG8gcXVlIHZjIG1lIG1hbmRvdS4gUG9kZSBlc2NyZXZlciBvdXRyYSB2ZXo/J107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQucmVzcG9uc2VzID0gSlNPTi5wYXJzZShyZXN1bHQucmVzcG9uc2VUZXh0KS5yZXNwb25zZXM7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ2Vycm9yIHByb2Nlc3NpbmcgcmVxdWVzdDogJyArIHJlc3VsdC5yZXNwb25zZXMgKyAnXFxuc3RhdHVzOiAnICsgcmVzdWx0LnN0YXR1cyArICcgXFxuc3RhdHVzVGV4dDonICsgcmVzdWx0LnN0YXR1c1RleHQpO1xuXG4gICAgICAgICAgICAgICAgJCgnI2NoYXQtd2lkZ2V0IC51c2VyLWlucHV0JykucHJvcCgnZGlzYWJsZWQnLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgJChcImRpdi5mbG9hdC10eXBpbmdcIikucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYoXCJyZXNwb25zZUpTT05cIiBpbiByZXN1bHQpe1xuICAgICAgICAgICAgICAgICAgICB2YXIgcmVzcG9uc2VKU09OID0gcmVzdWx0LnJlc3BvbnNlSlNPTjtcbiAgICAgICAgICAgICAgICAgICAgaWYoXCJjb252ZXJzYXRpb25faWRcIiBpbiByZXNwb25zZUpTT04pe1xuICAgICAgICAgICAgICAgICAgICAgICAgbHVrbmF0b3IuY29udmVyc2F0aW9uX2lkID0gcmVzcG9uc2VKU09OLmNvbnZlcnNhdGlvbl9pZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5yZXNwb25zZXMgPSByZXNwb25zZUpTT04ucmVzcG9uc2VzO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoYXQuY3JlYXRlTWVzc2FnZSgnYm90JywgcmVzdWx0KTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKVxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLiQoJyNjaGF0LXdpZGdldCAudXNlci1pbnB1dCcpLnByb3AoJ2Rpc2FibGVkJywgdHJ1ZSk7XG5cbiAgICAgICAgYm94SW5kaWNhdG9yLmFmdGVyKCc8ZGl2IGNsYXNzPVwiZmxvYXQtdHlwaW5nXCI+PGRpdiBjbGFzcz1cInR5cGluZy1pbmRpY2F0b3JcIj48c3Bhbj48L3NwYW4+PHNwYW4+PC9zcGFuPjxzcGFuPjwvc3Bhbj48L2Rpdj48L2Rpdj4nKTtcbiAgICB9O1xuXG4gICAgbHVrbmF0b3IucHJvdG90eXBlLmFjdGlvbkNsb3NlQ2hhdCA9IGZ1bmN0aW9uKGFjdGlvbikge1xuICAgICAgICB0aGlzLiQoJyNjaGF0LXdpZGdldCcpLmFkZENsYXNzKCdvdXQnKTtcbiAgICB9O1xuXG5cbiAgICBsdWtuYXRvci5wcm90b3R5cGUuYWN0aW9uRGlzcGxheU9wdGlvbnMgPSBmdW5jdGlvbihhY3Rpb24pIHtcblxuICAgICAgICB2YXIgYm94T3B0aW9ucyA9IHRoaXMuJCgnI2NoYXQtd2lkZ2V0IC5zcGVhaycpLmxhc3QoKTtcbiAgICAgICAgdmFyIG9wdGlvbnMgPSBhY3Rpb24ub3B0aW9ucztcbiAgICAgICAgdmFyIGRpdl9vcHRpb25zID0gdGhpcy4kKCc8ZGl2PicsIHtcbiAgICAgICAgICAgICdjbGFzcyc6ICdvcHRpb25zJ1xuICAgICAgICB9KTtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9wdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBvcHRpb25fdGV4dCA9IG9wdGlvbnNbaV07XG5cbiAgICAgICAgICAgIHZhciBvcHRpb24gPSB0aGlzLiQoJzxpbnB1dD4nKS5hdHRyKHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnYnV0dG9uJyxcbiAgICAgICAgICAgICAgICBpZDogb3B0aW9uX3RleHQsXG4gICAgICAgICAgICAgICAgdmFsdWU6IG9wdGlvbl90ZXh0LFxuICAgICAgICAgICAgICAgIGNsYXNzOiAnaW5wdXQtb3B0aW9uJ1xuICAgICAgICAgICAgfSkub2ZmKCkub24oJ2NsaWNrJywgZnVuY3Rpb24oYnV0dG9uKSB7XG5cbiAgICAgICAgICAgICAgICB2YXIgb3B0aW9uX3RleHQgPSBidXR0b24udGFyZ2V0LmlkO1xuICAgICAgICAgICAgICAgIHRoaXMuY3JlYXRlTWVzc2FnZSgndXNlcicsIHtcbiAgICAgICAgICAgICAgICAgICAgJ3Jlc3BvbnNlcyc6IFtvcHRpb25fdGV4dF1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLiQoJy5vcHRpb25zJykucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgdGhpcy4kKCcjY2hhdC13aWRnZXQgLnVzZXItaW5wdXQnKS52YWwoJycpO1xuICAgICAgICAgICAgICAgIHRoaXMuJCgnI2NoYXQtY29pbi1pY29uJykuYWRkQ2xhc3MoJ291dCcpO1xuICAgICAgICAgICAgICAgIHRoaXMuJCgnI2NoYXQtd2lkZ2V0JykuYWRkQ2xhc3MoJ2Z1bGwnKTtcbiAgICAgICAgICAgICAgICBib3hPcHRpb25zLnJlbW92ZUNsYXNzKCdzcGVhay1vcHRpb24nKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuYm90UmVxdWVzdChvcHRpb25fdGV4dCk7XG5cbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG5cbiAgICAgICAgICAgIGRpdl9vcHRpb25zLmFwcGVuZChvcHRpb24pO1xuICAgICAgICB9XG5cbiAgICAgICAgYm94T3B0aW9ucy5hZGRDbGFzcygnc3BlYWstb3B0aW9uJyk7XG5cbiAgICAgICAgdGhpcy4kKCcjY2hhdC13aWRnZXQgLmJveC1jb250ZW50JykuYW5pbWF0ZSh7XG4gICAgICAgICAgICBzY3JvbGxUb3A6IDk5OTk5XG4gICAgICAgIH0sIDUwMCk7XG4gXG4gICAgICAgIGJveE9wdGlvbnMuYXBwZW5kKGRpdl9vcHRpb25zKTtcblxuICAgIH07XG5cbiAgICBsdWtuYXRvci5wcm90b3R5cGUuYWN0aW9uVHJhbnNmZXJaZW5kZXNrID0gZnVuY3Rpb24oY29udGV4dCkge1xuICAgICAgICB2YXIgcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzY3JpcHRcIik7XG4gICAgICAgIHMudHlwZSA9IFwidGV4dC9qYXZhc2NyaXB0XCI7XG4gICAgICAgIHMuc3JjID0gY29udGV4dFsndXJsX3plbmRlc2snXTtcbiAgICAgICAgcy5pZCA9IFwiemUtc25pcHBldFwiO1xuICAgICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZChzKTtcbiAgICAgICAgXG4gICAgICAgIHZhciB3YWl0Rm9yWm9waW0gPSBzZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgd2luZG93LiR6b3BpbSA9PT0gdW5kZWZpbmVkIHx8XG4gICAgICAgICAgICAgICAgd2luZG93LiR6b3BpbS5saXZlY2hhdCA9PT0gdW5kZWZpbmVkIHx8XG4gICAgICAgICAgICAgICAgd2luZG93LiR6b3BpbS5saXZlY2hhdC5kZXBhcnRtZW50cyA9PT0gdW5kZWZpbmVkXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAgICAgekUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICR6b3BpbShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghJHpvcGltLmxpdmVjaGF0LmlzQ2hhdHRpbmcoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHpvcGltLmxpdmVjaGF0LmNsZWFyQWxsKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICR6b3BpbS5saXZlY2hhdC5zZXRPbkNvbm5lY3RlZCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkem9waW0ubGl2ZWNoYXQuZGVwYXJ0bWVudHMuc2V0VmlzaXRvckRlcGFydG1lbnQoY29udGV4dFsnZGVwYXJ0bWVudCddKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0RlcGFydG1lbnQ9PT4nLCBjb250ZXh0WydkZXBhcnRtZW50J10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0RlcGFydG1lbnQgVGFnPT0+JywgIGNvbnRleHRbJ2RlcGFydG1lbnRfdGFnJ10pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29udGV4dFsnb3JkZXJfaWQnXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR6b3BpbS5saXZlY2hhdC5hZGRUYWdzKFwicGVkaWRvX1wiICsgY29udGV4dFsnb3JkZXJfaWQnXSwgXCJjcGZfXCIgKyBjb250ZXh0WydjdXN0b21lcl9jcGYnXSwgY29udGV4dFsnZGVwYXJ0bWVudF90YWcnXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR6b3BpbS5saXZlY2hhdC5hZGRUYWdzKFwiY3BmX1wiICsgY29udGV4dFsnY3VzdG9tZXJfY3BmJ10sIGNvbnRleHRbJ2RlcGFydG1lbnRfdGFnJ10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAkem9waW0ubGl2ZWNoYXQuc2V0KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBjb250ZXh0WydjdXN0b21lcl9uYW1lJ10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW1haWw6IGNvbnRleHRbJ2N1c3RvbWVyX2VtYWlsJ11cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAkem9waW0ubGl2ZWNoYXQud2luZG93LnNob3coKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkZXBhcnRtZW50X2luZm8gPSAkem9waW0ubGl2ZWNoYXQuZGVwYXJ0bWVudHMuZ2V0RGVwYXJ0bWVudChjb250ZXh0WydkZXBhcnRtZW50J10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYoZGVwYXJ0bWVudF9pbmZvLnN0YXR1cyA9PT0gXCJvbmxpbmVcIiAmJiAoY29udGV4dFsndG9nZ2xlX292ZXJmbG93X21lc3NhZ2UnXSA9PSB0cnVlIHx8IGNvbnRleHRbJ3RvZ2dsZV9vdmVyZmxvd19tZXNzYWdlJ10gPT0gXCJ0cnVlXCIpKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkem9waW0ubGl2ZWNoYXQuc2F5KGNvbnRleHRbJ292ZXJmbG93X21lc3NhZ2UnXSlcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB0aGlzLiQoJyNjaGF0LXdpZGdldCcpLmFkZENsYXNzKCdvdXQnKTtcbiAgICAgICAgICAgIHRoaXMuJCgnI2NoYXQtd2lkZ2V0JykucmVtb3ZlQ2xhc3MoJ2Z1bGwnKTtcbiAgICAgICAgICAgIGlmKGlzTW9iaWxlKSB7IHRoaXMuJCgnaHRtbCcpLnJlbW92ZUNsYXNzKCdpLWFtcGh0bWwtc2Nyb2xsLWRpc2FibGVkJyk7IH1cblxuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh3YWl0Rm9yWm9waW0pO1xuICAgICAgICB9LCAxMDApO1xuICAgIH07XG5cbiAgICBsdWtuYXRvci5wcm90b3R5cGUuY3JlYXRlTWVzc2FnZSA9IGZ1bmN0aW9uKGNsYXNzTmFtZSwgcmVzdWx0KSB7XG4gICAgICAgIHRoaXMuJCgnI2NoYXQtd2lkZ2V0JykucmVtb3ZlQ2xhc3MoJ291dCcpO1xuICAgICAgICBpZiAocmVzdWx0Lmhhc093blByb3BlcnR5KCdjb250ZXh0JykgJiYgcmVzdWx0LmNvbnRleHQuaGFzT3duUHJvcGVydHkoJ3dhaXRfYXR0ZW5kYW50Jykpe1xuICAgICAgICAgICAgdGhpcy4kKCcjY2hhdC13aWRnZXQgLnVzZXItaW5wdXQnKS5wcm9wKCdkaXNhYmxlZCcsIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIFxuXHQvLyBleHBvc2UgYm90IHRhZ1xuICAgICAgICB3aW5kb3cuQm90VGFnID0gcmVzdWx0LnRhZztcblx0aWYgKHRoaXMudGFnQ2FsbGJhY2sgJiYgY2xhc3NOYW1lID09ICdib3QnKSB7XG5cdCAgICB0aGlzLnRhZ0NhbGxiYWNrKHJlc3VsdC50YWcpO1xuXHR9XG5cdFxuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHJlc3VsdC5yZXNwb25zZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIHZhciB0ZXh0ID0gcmVzdWx0LnJlc3BvbnNlc1tqXTtcbiAgICAgICAgICAgIHZhciBmdWxsQ2xhc3NOYW1lID0gJ2NoYXQtaXRlbSAnICsgY2xhc3NOYW1lO1xuICAgICAgICAgICAgdmFyIGNoYXRJdGVtID0gdGhpcy4kKCc8ZGl2PicsIHtcbiAgICAgICAgICAgICAgICdjbGFzcyc6IGZ1bGxDbGFzc05hbWVcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB2YXIgc3BhbiA9IHRoaXMuJCgnPHNwYW4+Jyk7XG5cbiAgICAgICAgICAgIGlmIChjbGFzc05hbWUgPT0gJ2JvdCcpIHtcbiAgICAgICAgICAgICAgICB2YXIgYXZhdGFyID0gdGhpcy4kKCc8ZGl2PicsIHtcbiAgICAgICAgICAgICAgICAgICAgJ2NsYXNzJzogJ2F2YXRhcidcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB2YXIgaW1nID0gdGhpcy4kKCc8aW1nPicpXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKCdzcmMnLCB0aGlzLmJvdF9idWJibGUpXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKCdkcmFnZ2FibGUnLCAnZmFsc2UnKTtcbiAgICAgICAgICAgICAgICBhdmF0YXIuYXBwZW5kKGltZyk7XG4gICAgICAgICAgICAgICAgY2hhdEl0ZW0uYXBwZW5kKGF2YXRhcik7XG4gICAgICAgICAgICAgICAgc3Bhbi5odG1sKHRleHQpO1xuICAgICAgICAgICAgICAgICQoJyNjaGF0LXdpZGdldCAudXNlci1pbnB1dCcpLmZvY3VzKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNwYW4udGV4dCh0ZXh0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHNwZWFrID0gdGhpcy4kKCc8ZGl2PicsIHtcbiAgICAgICAgICAgICAgICAnY2xhc3MnOiAnc3BlYWsnXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHNwZWFrLmFwcGVuZChzcGFuKTtcbiAgICAgICAgICAgIGNoYXRJdGVtLmFwcGVuZChzcGVhayk7XG5cbiAgICAgICAgICAgIHRoaXMuJCgnI2NoYXQtd2lkZ2V0IC5jaGF0LWNvbnRlbnQnKS5hcHBlbmQoY2hhdEl0ZW0pO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAocmVzdWx0LnRyeV9jYiAhPSBudWxsICYmIHJlc3VsdC50cnlfY2IgPiAwKSB7XG4gICAgICAgICAgICBpZiAocmVzdWx0LnRyeV9jYiA9PSAxKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hY3Rpb25EaXNwbGF5T3B0aW9ucyh7XCJvcHRpb25zXCI6IFtcIkZhbGFyIGNvbSBhdGVuZGVudGVcIiwgXCJOw6NvIHByZWNpc2FcIl0gfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuYWN0aW9uRGlzcGxheU9wdGlvbnMoe1wib3B0aW9uc1wiOiBbXCJGYWxhciBjb20gYXRlbmRlbnRlXCIsIFwiQXTDqSBtYWlzIHRhcmRlXCJdIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgIH1cblxuICAgICAgICBpZiAocmVzdWx0LmFjdGlvbnMpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVzdWx0LmFjdGlvbnMubGVuZ3RoOyBpKyspIHtcblxuICAgICAgICAgICAgICAgIHZhciBhY3Rpb24gPSByZXN1bHQuYWN0aW9uc1tpXTtcblxuICAgICAgICAgICAgICAgIGlmIChhY3Rpb24udHlwZSA9PSAnYXV0b19yZXBseScpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0FVVE8gUkVQTFknKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmJvdFJlcXVlc3QoKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoYWN0aW9uLnR5cGUgPT0gJ29wdGlvbicgfHwgYWN0aW9uLnR5cGUgPT0gJ2Rpc3BsYXlfb3B0aW9ucycpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hY3Rpb25EaXNwbGF5T3B0aW9ucyhhY3Rpb24pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChhY3Rpb24udHlwZSA9PSAndHJhbnNmZXJfemVuZGVzaycpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hY3Rpb25UcmFuc2ZlclplbmRlc2socmVzdWx0LmNvbnRleHQpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChhY3Rpb24udHlwZSA9PSAnY2xvc2VfY2hhdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hY3Rpb25DbG9zZUNoYXQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLiQoJyNjaGF0LXdpZGdldCAuYm94LWNvbnRlbnQnKS5hbmltYXRlKHtcbiAgICAgICAgICAgIHNjcm9sbFRvcDogOTk5OTlcbiAgICAgICAgfSwgMCk7XG5cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gbWFpbihwYXJhbXMpIHtcbiAgICAgICAgd2luZG93LmpRdWVyeShkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oJCkge1xuXG4gICAgICAgICAgICBpZiAoIXdpbmRvdy5fbHVrbmF0b3IpIHtcbiAgICAgICAgICAgICAgICB2YXIgY3NzTGluayA9ICQoJzxsaW5rPicsIHtcbiAgICAgICAgICAgICAgICAgICAgcmVsOiAnc3R5bGVzaGVldCcsXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICd0ZXh0L2NzcycsXG4gICAgICAgICAgICAgICAgICAgIGhyZWY6IHdpbmRvdy5sdWtuYXRvclBhcmFtcy5jc3NcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjc3NMaW5rLmFwcGVuZFRvKCdoZWFkJyk7XG4gICAgICAgICAgICAgICAgd2luZG93Ll9sdWtuYXRvciA9IG5ldyBsdWtuYXRvcigkKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgLy8vLy8vLy8vLy8vXG4gICAgLy8gTG9hZGVyIC8vXG4gICAgLy8vLy8vLy8vLy8vXG4gICAgdmFyIGpRdWVyeTtcbiAgICBpZiAod2luZG93LmpRdWVyeSA9PT0gdW5kZWZpbmVkIHx8IHdpbmRvdy5qUXVlcnkuZm4uanF1ZXJ5ICE9PSAnMS4xMi40Jykge1xuXG4gICAgICAgIHZhciBzY3JpcHRfdGFnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG5cbiAgICAgICAgc2NyaXB0X3RhZy5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAndGV4dC9qYXZhc2NyaXB0Jyk7XG4gICAgICAgIHNjcmlwdF90YWcuc2V0QXR0cmlidXRlKFxuICAgICAgICAgICAgJ3NyYycsXG4gICAgICAgICAgICAnLy9hamF4Lmdvb2dsZWFwaXMuY29tL2FqYXgvbGlicy9qcXVlcnkvMS4xMi40L2pxdWVyeS5taW4uanMnXG4gICAgICAgICk7XG5cbiAgICAgICAgaWYgKHNjcmlwdF90YWcucmVhZHlTdGF0ZSkge1xuICAgICAgICAgICAgc2NyaXB0X3RhZy5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHsgLy8gRm9yIG9sZCB2ZXJzaW9ucyBvZiBJRVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnJlYWR5U3RhdGUgPT0gJ2NvbXBsZXRlJyB8fCB0aGlzLnJlYWR5U3RhdGUgPT0gJ2xvYWRlZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgc2NyaXB0TG9hZEhhbmRsZXIoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2NyaXB0X3RhZy5vbmxvYWQgPSBzY3JpcHRMb2FkSGFuZGxlcjtcbiAgICAgICAgfVxuICAgICAgICAoZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXSB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQpLmFwcGVuZENoaWxkKHNjcmlwdF90YWcpO1xuXG4gICAgfSBlbHNlIHtcbiAgICAgICAgalF1ZXJ5ID0gd2luZG93LmpRdWVyeTtcbiAgICAgICAgbWFpbigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNjcmlwdExvYWRIYW5kbGVyKCkge1xuICAgICAgICBqUXVlcnkgPSB3aW5kb3cualF1ZXJ5Lm5vQ29uZmxpY3QodHJ1ZSk7XG4gICAgICAgIG1haW4oKTtcbiAgICB9O1xuXG59KSgpOyJdfQ==
