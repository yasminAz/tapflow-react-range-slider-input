"use strict";

require("core-js/modules/web.dom-collections.iterator.js");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

require("core-js/modules/es.parse-float.js");

var _react = _interopRequireWildcard(require("react"));

var _clsx = _interopRequireDefault(require("clsx"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

// Aliases
const abs = Math.abs;
const float = parseFloat; // Values

const MIN = 'min';
const MAX = 'max';
const ANY = 'any';
const VERTICAL = 'vertical';
const TABINDEX = 'tabindex'; // Data Attributes

const DATA_LOWER = 'data-lower';
const DATA_UPPER = 'data-upper';
const DATA_ACTIVE = 'data-active';
const DATA_VERTICAL = 'data-vertical';
const DATA_DISABLED = 'data-disabled';

class RangeSlider extends _react.PureComponent {
  constructor() {
    super();
    this.element = /*#__PURE__*/(0, _react.createRef)();
    this.input = [/*#__PURE__*/(0, _react.createRef)(), /*#__PURE__*/(0, _react.createRef)()];
    this.thumb = [/*#__PURE__*/(0, _react.createRef)(), /*#__PURE__*/(0, _react.createRef)()];
    this.range = /*#__PURE__*/(0, _react.createRef)();
    this.options = {};
    this.firstCall = true;
    this.isControlled = false;
    this.externalInput = false;
    this.isComponentMounted = false;
    this.lastValueProp = [];
  }

  componentDidMount() {
    if (!this.isComponentMounted) {
      this.value = this.setMinMaxProps(); // Thumb indexes for min and max values
      // (swapped when the thumbs cross each other)

      this.index = this.setMinMaxProps(0, 1); // Thumb width & height for calculation of exact positions and sizes of horizontal thumbs and range

      this.thumbWidth = this.setMinMaxProps();
      this.thumbHeight = this.setMinMaxProps(); // Slidable range limits (when a thumb is dragged)

      this.rangeLimits = this.setMinMaxProps(); // Slider value depending on the user interaction

      this.sliderValue = this.setMinMaxProps(); // For dragging thumbs and range

      this.maxRangeWidth = 0;
      this.rangeWidth = 0;
      this.isDragging = false;
      this.thumbDrag = false;
      this.startPos = 0; // initial

      this.reset(); // Add listeners to element

      this.addNodeEventListener(this.element.current, 'pointerdown', e => {
        this.elementFocused(e);
      }); // Add listeners to thumbs and set [data-disabled] on disabled thumbs

      this.thumb.forEach((t, i) => {
        this.addNodeEventListener(t.current, 'pointerdown', e => {
          this.initiateThumbDrag(e, i, t.current);
        });
        this.addNodeEventListener(t.current, 'keydown', e => {
          if (e.which >= 37 && e.which <= 40) {
            e.preventDefault();
            this.stepValue(i, e.which);
          }
        });
      }); // Add listeners to range

      this.addNodeEventListener(this.range.current, 'pointerdown', e => {
        this.initiateRangeDrag(e);
      }); // Define and add global listeners

      this.pointerMoveEvent = e => {
        this.drag(e);
      };

      this.pointerUpEvent = () => {
        if (this.isDragging) {
          this.removeNodeAttribute(this.thumb[0].current, DATA_ACTIVE);
          this.removeNodeAttribute(this.thumb[1].current, DATA_ACTIVE);
          this.removeNodeAttribute(this.range.current, DATA_ACTIVE);
          this.isDragging = false;

          if (this.thumbDrag) {
            if (this.options.onThumbDragEnd) {
              this.options.onThumbDragEnd();
            }
          } else {
            if (this.options.onRangeDragEnd) {
              this.options.onRangeDragEnd();
            }
          }
        }
      };

      this.resizeEvent = () => {
        this.syncThumbDimensions();
        this.updateThumbs();
        this.updateRange();
      };

      this.addNodeEventListener(document, 'pointermove', this.pointerMoveEvent);
      this.addNodeEventListener(document, 'pointerup', this.pointerUpEvent);
      this.addNodeEventListener(window, 'resize', this.resizeEvent);
      this.isComponentMounted = true;
    }
  }

  componentDidUpdate() {
    this.reset();
  }

  componentWillUnmount() {
    // Remove global listeners
    this.removeNodeEventListener(document, 'pointermove', this.pointerMoveEvent);
    this.removeNodeEventListener(document, 'pointerup', this.pointerUpEvent);
    this.removeNodeEventListener(window, 'resize', this.resizeEvent);
    this.isComponentMounted = false;
  }

  reset() {
    this.isControlled = !!this.props.value;

    if (this.isControlled) {
      if (this.firstCall || this.props.value !== this.lastValueProp) {
        this.firstCall = false;
        this.externalInput = true;
      }

      this.lastValueProp = this.props.value;
    }

    this.maxRangeWidth = this.options.max - this.options.min;
    this.updateOrientation();
    this.setValue('', true, false);
    this.updateRangeLimits();
    this.updateDisabledState();
    this.updateThumbsDisabledState();
    this.updateTabIndexes();
  }

  isNumber(n) {
    // check for NaN explicitly
    // because with NaN, the second exp. evaluates to true
    return !isNaN(n) && +n + '' === n + '';
  }

  setMinMaxProps() {
    let min = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
    let max = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    return {
      min,
      max
    };
  }

  iterateMinMaxProps(fn) {
    [MIN, MAX].forEach(fn);
  }

  getSetProps(condition, expression, fn) {
    if (condition) {
      return expression;
    } else {
      fn();
    }
  }

  setNodeAttribute(node, attribute) {
    let value = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
    node.setAttribute(attribute, value);
  }

  removeNodeAttribute(node, attribute) {
    node.removeAttribute(attribute);
  }

  addNodeEventListener(node, event, fn) {
    let isPointerEvent = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;
    // with options for pointer events
    node.addEventListener(event, fn, isPointerEvent ? {
      passive: false,
      capture: true
    } : {});
  }

  removeNodeEventListener(node, event, fn) {
    let isPointerEvent = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;
    // with options for pointer events
    node.removeEventListener(event, fn, isPointerEvent ? {
      passive: false,
      capture: true
    } : {});
  }

  fallbackToDefault(property, defaultValue) {
    this.options[property] = this.props[property] ? this.props[property] : defaultValue;
  }

  ifVerticalElse(vertical, horizontal) {
    return this.options.orientation === VERTICAL ? vertical : horizontal;
  }

  currentIndex(i) {
    return i === 1 ? this.index.max : this.index.min;
  } // Set min and max values to 1 (arbitrarily) if any of the min or max values are "invalid"
  // Setting both values 1 will disable the slider
  // Called when,
  // -> the element is initially set
  // -> min or max properties are modified


  safeMinMaxValues() {
    let error = false;

    if (!this.isNumber(this.options.min) || !this.isNumber(this.options.max)) {
      error = true;
    }

    this.options.min = error ? 1 : +this.options.min;
    this.options.max = error ? 1 : +this.options.max;
  } // Reframe the thumbsDisabled value if "invalid"
  // Called when,
  // -> the element is initially set
  // -> thumbsDisabled property is modified


  safeThumbsDisabledValues() {
    if (this.options.thumbsDisabled instanceof Array) {
      if (this.options.thumbsDisabled.length === 1) {
        this.options.thumbsDisabled.push(false);
      }

      if (this.options.thumbsDisabled.length !== 1 && this.options.thumbsDisabled.length !== 2) {
        this.options.thumbsDisabled = [false, false];
      }
    } else {
      this.options.thumbsDisabled = [this.options.thumbsDisabled, this.options.thumbsDisabled];
    } // Boolean Values


    this.options.thumbsDisabled[0] = !!this.options.thumbsDisabled[0];
    this.options.thumbsDisabled[1] = !!this.options.thumbsDisabled[1];
  } // Called when,
  // -> the element is initially set
  // -> min, max, step or value properties are modified
  // -> thumbs are dragged
  // -> element is clicked upon
  // -> an arrow key is pressed


  setValue(newValue) {
    let forceSet = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    let callback = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
    // Current value as set in the input elements
    // which could change while changing min, max and step values
    const currentValue = this.setMinMaxProps(this.input[0].current.value, this.input[1].current.value); // var value is synced with the values set in the input elements if no newValue is passed

    newValue = newValue || currentValue;
    this.input[this.index.min].current.value = newValue.min;
    this.input[this.index.max].current.value = this.thumbDrag || forceSet ? newValue.max : newValue.min + this.rangeWidth;
    this.syncValues(); // Check if the thumbs cross each other

    if (this.value.min > this.value.max) {
      // Switch thumb indexes
      this.index.min = +!this.index.min;
      this.index.max = +!this.index.max; // Switch thumb attributes

      this.removeNodeAttribute(this.thumb[this.index.min].current, DATA_UPPER);
      this.removeNodeAttribute(this.thumb[this.index.max].current, DATA_LOWER);
      this.setNodeAttribute(this.thumb[this.index.min].current, DATA_LOWER);
      this.setNodeAttribute(this.thumb[this.index.max].current, DATA_UPPER); // Switch thumb drag labels

      if (this.thumbDrag) {
        this.thumbDrag = this.thumbDrag === MIN ? MAX : MIN;
      }

      this.syncValues();
    }

    this.sliderValue = forceSet ? this.value : newValue;
    let valueSet = false;

    if (currentValue.min !== this.input[0].current.value || forceSet) {
      valueSet = true;
    }

    if (currentValue.max !== this.input[1].current.value || forceSet) {
      valueSet = true;
    } // Update the positions, dimensions and aria attributes everytime a value is set
    // and call the onInput function from options (if set)


    if (valueSet) {
      if (callback && this.options.onInput) {
        this.options.onInput([this.value.min, this.value.max]);
      }

      if (!this.isControlled || this.externalInput) {
        this.externalInput = false;
        this.syncThumbDimensions();
        this.updateThumbs();
        this.updateRange();
        this.updateAriaValueAttributes();
      }
    }
  } // Sync var value with the input elements


  syncValues() {
    this.iterateMinMaxProps(_ => {
      this.value[_] = +this.input[this.index[_]].current.value;
    });
  } // Called when,
  // -> setValue is called and a value is set
  // -> window is resized


  updateThumbs() {
    this.iterateMinMaxProps(_ => {
      this.thumb[this.index[_]].current.style[this.ifVerticalElse('top', 'left')] = "calc(".concat((this.value[_] - this.options.min) / this.maxRangeWidth * 100, "% + ").concat((0.5 - (this.value[_] - this.options.min) / this.maxRangeWidth) * this.ifVerticalElse(this.thumbHeight, this.thumbWidth)[_], "px)");
    });
  } // Called when,
  // -> setValue is called and a value is set
  // -> window is resized


  updateRange() {
    const elementBounds = this.element.current.getBoundingClientRect();
    const deltaOffset = (0.5 - (this.value.min - this.options.min) / this.maxRangeWidth) * this.ifVerticalElse(this.thumbHeight, this.thumbWidth).min / this.ifVerticalElse(elementBounds.bottom - elementBounds.top, elementBounds.right - elementBounds.left);
    const deltaDimension = (0.5 - (this.value.max - this.options.min) / this.maxRangeWidth) * this.ifVerticalElse(this.thumbHeight, this.thumbWidth).max / this.ifVerticalElse(elementBounds.bottom - elementBounds.top, elementBounds.right - elementBounds.left);
    this.range.current.style[this.ifVerticalElse('top', 'left')] = "".concat(((this.value.min - this.options.min) / this.maxRangeWidth + deltaOffset) * 100, "%");
    this.range.current.style[this.ifVerticalElse('height', 'width')] = "".concat(((this.value.max - this.options.min) / this.maxRangeWidth - (this.value.min - this.options.min) / this.maxRangeWidth - deltaOffset + deltaDimension) * 100, "%");
  }

  updateRangeLimits() {
    this.iterateMinMaxProps((_, i) => {
      this.rangeLimits[_] = this.options.thumbsDisabled[i] ? this.value[_] : this.options[_];
    });
  } // Called when,
  // -> thumbs are initially set
  // -> thumbs are disabled / enabled


  updateTabIndexes() {
    this.iterateMinMaxProps((_, i) => {
      if (!this.options.disabled && !this.options.thumbsDisabled[i]) {
        this.setNodeAttribute(this.thumb[this.currentIndex(i)].current, TABINDEX, 0);
      } else {
        this.removeNodeAttribute(this.thumb[this.currentIndex(i)].current, TABINDEX);
      }
    });
  } // Called when,
  // -> setValue is called and a value is set


  updateAriaValueAttributes() {
    this.iterateMinMaxProps(_ => {
      this.setNodeAttribute(this.thumb[this.index[_]].current, 'aria-valuemin', this.options.min);
      this.setNodeAttribute(this.thumb[this.index[_]].current, 'aria-valuemax', this.options.max);
      this.setNodeAttribute(this.thumb[this.index[_]].current, 'aria-valuenow', this.value[_]);
      this.setNodeAttribute(this.thumb[this.index[_]].current, 'aria-valuetext', this.value[_]);
    });
  } // Called when,
  // -> disabled property is modified


  updateDisabledState() {
    if (this.options.disabled) {
      this.setNodeAttribute(this.element.current, DATA_DISABLED);
    } else {
      this.removeNodeAttribute(this.element.current, DATA_DISABLED);
    }
  } // Called when,
  // -> thumbsDisabled property is modified


  updateThumbsDisabledState() {
    this.options.thumbsDisabled.forEach((d, i) => {
      const currIndex = this.currentIndex(i);

      if (d) {
        this.setNodeAttribute(this.thumb[currIndex].current, DATA_DISABLED);
        this.setNodeAttribute(this.thumb[currIndex].current, 'aria-disabled', true);
      } else {
        this.removeNodeAttribute(this.thumb[currIndex].current, DATA_DISABLED);
        this.setNodeAttribute(this.thumb[currIndex].current, 'aria-disabled', false);
      }
    });
  } // Called when,
  // -> min or max values are modified


  updateLimits(limit) {
    let m = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    this.options[limit] = m;
    this.safeMinMaxValues();
    this.iterateMinMaxProps(_ => {
      this.input[0].current[_] = this.options[_];
      this.input[1].current[_] = this.options[_];
    });
    this.maxRangeWidth = this.options.max - this.options.min;
    this.setValue('', true);
    this.updateRangeLimits();
  } // Called when,
  // -> the element is initially set
  // -> orientation property is modified


  updateOrientation() {
    if (this.options.orientation === VERTICAL) {
      this.setNodeAttribute(this.element.current, DATA_VERTICAL);
    } else {
      this.removeNodeAttribute(this.element.current, DATA_VERTICAL);
    }

    this.range.current.style[this.ifVerticalElse('left', 'top')] = '';
    this.range.current.style[this.ifVerticalElse('width', 'height')] = '';
    this.thumb[0].current.style[this.ifVerticalElse('left', 'top')] = '';
    this.thumb[1].current.style[this.ifVerticalElse('left', 'top')] = '';
  } // thumb width & height values are to be synced with the CSS values for correct calculation of
  // thumb position and range width & position
  // Called when,
  // -> setValue is called and a value is set (called before updateThumbs() and updateRange())
  // -> thumb / range drag is initiated
  // -> window is resized


  syncThumbDimensions() {
    this.iterateMinMaxProps(_ => {
      this.thumbWidth[_] = float(window.getComputedStyle(this.thumb[this.index[_]].current).width);
      this.thumbHeight[_] = float(window.getComputedStyle(this.thumb[this.index[_]].current).height);
    });
  } // thumb position calculation depending upon the pointer position


  currentPosition(e, node) {
    const elementBounds = this.element.current.getBoundingClientRect();
    const nodeBounds = node.getBoundingClientRect();
    const currPos = (this.ifVerticalElse(nodeBounds.top - elementBounds.top, nodeBounds.left - elementBounds.left) + (e["client".concat(this.ifVerticalElse('Y', 'X'))] - node.getBoundingClientRect()[this.ifVerticalElse('top', 'left')]) - (this.thumbDrag ? (0.5 - (this.value[this.thumbDrag] - this.options.min) / this.maxRangeWidth) * this.ifVerticalElse(this.thumbHeight, this.thumbWidth)[this.thumbDrag] : 0)) / this.ifVerticalElse(elementBounds.bottom - elementBounds.top, elementBounds.right - elementBounds.left) * this.maxRangeWidth + this.options.min;

    if (currPos < this.options.min) {
      return this.options.min;
    }

    if (currPos > this.options.max) {
      return this.options.max;
    }

    return currPos;
  }

  doesntHaveClassName(e, className) {
    return !e.target.classList.contains(className);
  }

  elementFocused(e) {
    let repeat = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    let setFocus = false;

    if (!this.options.disabled && (this.doesntHaveClassName(e, 'range-slider__thumb') && this.doesntHaveClassName(e, 'range-slider__range') || this.options.rangeSlideDisabled && this.doesntHaveClassName(e, 'range-slider__thumb'))) {
      setFocus = true;
    } // No action if both thumbs are disabled


    if (setFocus && this.options.thumbsDisabled[0] && this.options.thumbsDisabled[1]) {
      setFocus = false;
    }

    if (setFocus) {
      const currPos = this.currentPosition(e, this.range.current);
      const deltaMin = abs(this.value.min - currPos);
      const deltaMax = abs(this.value.max - currPos);

      if (this.options.thumbsDisabled[0]) {
        if (currPos >= this.value.min) {
          this.setValue(this.setMinMaxProps(this.value.min, currPos), true, !repeat);
          this.initiateThumbDrag(e, this.index.max, this.thumb[this.index.max].current, !repeat);
        }
      } else if (this.options.thumbsDisabled[1]) {
        if (currPos <= this.value.max) {
          this.setValue(this.setMinMaxProps(currPos, this.value.max), true, !repeat);
          this.initiateThumbDrag(e, this.index.min, this.thumb[this.index.min].current, !repeat);
        }
      } else {
        let nearestThumbIndex = this.index.max;

        if (deltaMin === deltaMax) {
          this.setValue(this.setMinMaxProps(this.value.min, currPos), true, !repeat);
        } else {
          this.setValue(this.setMinMaxProps(deltaMin < deltaMax ? currPos : this.value.min, deltaMax < deltaMin ? currPos : this.value.max), true, !repeat);
          nearestThumbIndex = deltaMin < deltaMax ? this.index.min : this.index.max;
        }

        this.initiateThumbDrag(e, nearestThumbIndex, this.thumb[nearestThumbIndex].current, !repeat);
      }

      if (repeat) {
        this.elementFocused(e, false);
      }
    }
  }

  initiateDrag(e, node) {
    this.syncThumbDimensions();
    this.setNodeAttribute(node, DATA_ACTIVE);
    this.startPos = this.currentPosition(e, node);
    this.isDragging = true;
  }

  initiateThumbDrag(e, i, node) {
    let callback = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;

    if (!this.options.disabled && !this.options.thumbsDisabled[this.currentIndex(i)]) {
      this.initiateDrag(e, node);
      this.thumbDrag = this.index.min === i ? MIN : MAX;

      if (callback && this.options.onThumbDragStart) {
        this.options.onThumbDragStart();
      }
    }
  }

  initiateRangeDrag(e) {
    if (!this.options.disabled && !this.options.rangeSlideDisabled) {
      this.initiateDrag(e, this.range.current);
      this.rangeWidth = this.value.max - this.value.min;
      this.thumbDrag = false;

      if (this.options.onRangeDragStart) {
        this.options.onRangeDragStart();
      }
    }
  }

  drag(e) {
    if (this.isDragging) {
      const lastPos = this.currentPosition(e, this.range.current);
      const delta = lastPos - this.startPos;
      let min = this.value.min;
      let max = this.value.max;
      const lower = this.thumbDrag ? this.rangeLimits.min : this.options.min;
      const upper = this.thumbDrag ? this.rangeLimits.max : this.options.max;

      if (!this.thumbDrag || this.thumbDrag === MIN) {
        min = this.thumbDrag ? lastPos : this.sliderValue.min + delta;
      }

      if (!this.thumbDrag || this.thumbDrag === MAX) {
        max = this.thumbDrag ? lastPos : this.sliderValue.max + delta;
      }

      if (min >= lower && min <= upper && max >= lower && max <= upper) {
        this.setValue({
          min,
          max
        });
        this.startPos = lastPos;
      } else {
        // When min thumb reaches upper limit
        if (min > upper && this.thumbDrag) {
          this.setValue(this.setMinMaxProps(upper, upper));
          this.startPos = lastPos;
        } // When max thumb reaches lower limit


        if (max < lower && this.thumbDrag) {
          this.setValue(this.setMinMaxProps(lower, lower));
          this.startPos = lastPos;
        } // When range / min thumb reaches lower limit


        if (min < lower) {
          if (!this.thumbDrag) {
            this.setValue(this.setMinMaxProps(lower, this.value.max - this.value.min + lower));
          } else {
            this.setValue(this.setMinMaxProps(lower, this.value.max));
          }

          this.startPos = lastPos;
        } // When range / max thumb reaches upper limit


        if (max > upper) {
          if (!this.thumbDrag) {
            this.setValue(this.setMinMaxProps(this.value.min - this.value.max + upper, upper));
          } else {
            this.setValue(this.setMinMaxProps(this.value.min, upper));
          }

          this.startPos = lastPos;
        }
      }

      if (!this.thumbDrag) {
        this.updateRangeLimits();
      }
    }
  }

  actualStepValue() {
    const step = float(this.input[0].current.step);
    return this.input[0].current.step === ANY ? ANY : step === 0 || isNaN(step) ? 1 : step;
  } // Step value (up or down) using arrow keys


  stepValue(i, key) {
    const direction = (key === 37 || key === 40 ? -1 : 1) * this.ifVerticalElse(-1, 1);

    if (!this.options.disabled && !this.options.thumbsDisabled[this.currentIndex(i)]) {
      let step = this.actualStepValue();
      step = step === ANY ? 1 : step;
      let min = this.value.min + step * (this.index.min === i ? direction : 0);
      let max = this.value.max + step * (this.index.max === i ? direction : 0); // When min thumb reaches upper limit

      if (min > this.rangeLimits.max) {
        min = this.rangeLimits.max;
      } // When max thumb reaches lower limit


      if (max < this.rangeLimits.min) {
        max = this.rangeLimits.min;
      }

      this.setValue({
        min,
        max
      }, true);
    }
  }

  render() {
    // Set options to default values if not set
    this.fallbackToDefault('rangeSlideDisabled', false);
    this.fallbackToDefault('thumbsDisabled', [false, false]);
    this.fallbackToDefault('orientation', 'horizontal');
    this.fallbackToDefault('defaultValue', [25, 75]);
    this.fallbackToDefault('disabled', false);
    this.fallbackToDefault('onThumbDragStart', false);
    this.fallbackToDefault('onRangeDragStart', false);
    this.fallbackToDefault('onThumbDragEnd', false);
    this.fallbackToDefault('onRangeDragEnd', false);
    this.fallbackToDefault('onInput', false);
    this.fallbackToDefault('step', 1);
    this.fallbackToDefault('min', 0);
    this.fallbackToDefault('max', 100);

    if (this.props.value) {
      this.fallbackToDefault('value', [25, 75]);
    }

    this.safeMinMaxValues();
    this.safeThumbsDisabledValues();
    return /*#__PURE__*/_react.default.createElement("div", {
      "data-testid": "element",
      id: this.props.id,
      ref: this.element,
      className: (0, _clsx.default)('range-slider', this.props.className)
    }, /*#__PURE__*/_react.default.createElement("input", {
      ref: this.input[0],
      type: "range",
      min: this.options.min,
      max: this.options.max,
      step: this.options.step,
      value: this.props.value ? this.options.value[0] : this.isComponentMounted ? this.value.min : this.options.defaultValue[0],
      onChange: () => {},
      disabled: true
    }), /*#__PURE__*/_react.default.createElement("input", {
      ref: this.input[1],
      type: "range",
      min: this.options.min,
      max: this.options.max,
      step: this.options.step,
      value: this.props.value ? this.options.value[1] : this.isComponentMounted ? this.value.max : this.options.defaultValue[1],
      onChange: () => {},
      disabled: true
    }), /*#__PURE__*/_react.default.createElement("div", {
      ref: this.thumb[0],
      role: "slider",
      className: "range-slider__thumb",
      "data-lower": true
    }, /*#__PURE__*/_react.createElement("span", {
      className: "range-slider-min-max-label",
    }, this.options? this.options.value? this.options.value.length>0? this.options.value[0]:  this.value.min : this.value.min: this.value.min)), /*#__PURE__*/_react.default.createElement("div", {
      ref: this.thumb[1],
      role: "slider",
      className: "range-slider__thumb",
      "data-upper": true
    }, /*#__PURE__*/_react.createElement("span", {
      className: "range-slider-min-max-label",
    }, this.options? this.options.value? this.options.value.length>0? this.options.value[1]:  this.value.max : this.value.max: this.value.max)), /*#__PURE__*/_react.default.createElement("div", {
      ref: this.range,
      className: "range-slider__range"
    }));
  }

}

;
var _default = RangeSlider;
exports.default = _default;