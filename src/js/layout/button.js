MG.button_layout = function(target) {
  'use strict';
  this.target = target;
  this.feature_set = {};
  this.public_name = {};
  this.sorters = {};
  this.manual = [];
  this.manual_map = {};
  this.manual_callback = {};

  this._strip_punctuation = function(s) {
    var punctuationless = s.replace(/[^a-zA-Z0-9 _]+/g, '');
    var finalString = punctuationless.replace(/ +?/g, '');
    return finalString;
  };

  this.data = function(data) {
    this._data = data;
    return this;
  };

  this.manual_button = function(feature, feature_set, callback) {
    this.feature_set[feature] = feature_set;
    this.manual_map[this._strip_punctuation(feature)] = feature;
    this.manual_callback[feature] = callback; // the default is going to be the first feature.
    return this;
  };

  this.button = function(feature) {
    if (arguments.length > 1) {
      this.public_name[feature] = arguments[1];
    }

    if (arguments.length > 2) {
      this.sorters[feature] = arguments[2];
    }

    this.feature_set[feature] = [];
    return this;
  };

  this.callback = function(callback) {
    this._callback = callback;
    return this;
  };

  this.display = function() {
    var callback = this._callback;
    var manual_callback = this.manual_callback;
    var manual_map = this.manual_map;

    var d, f, features, feat;
    features = Object.keys(this.feature_set);

    var mapDtoF = function(f) {
      return d[f]; };

    var i;

    // build out this.feature_set with this.data
    for (i = 0; i < this._data.length; i++) {
      d = this._data[i];
      f = features.map(mapDtoF);
      for (var j = 0; j < features.length; j++) {
        feat = features[j];
        if (this.feature_set[feat].indexOf(f[j]) === -1) {
          this.feature_set[feat].push(f[j]);
        }
      }
    }

    for (feat in this.feature_set) {
      if (this.sorters.hasOwnProperty(feat)) {
        this.feature_set[feat].sort(this.sorters[feat]);
      }
    }

    $(this.target).empty();

    $(this.target).append("<div class='col-lg-12 segments text-center'></div>");

    var dropdownLiAClick = function() {
      var k = $(this).data('key');
      var feature = $(this).data('feature');
      var manual_feature;
      $('.' + feature + '-btns button.btn span.title').html(k);
      if (!manual_map.hasOwnProperty(feature)) {
        callback(feature, k);
      } else {
        manual_feature = manual_map[feature];
        manual_callback[manual_feature](k);
      }

      return false;
    };

    for (var feature in this.feature_set) {
      features = this.feature_set[feature];
      $(this.target + ' div.segments').append(
        '<div class="btn-group ' + this._strip_punctuation(feature) + '-btns text-left">' + // This never changes.
        '<button type="button" class="btn btn-default btn-lg dropdown-toggle" data-toggle="dropdown">' +
        "<span class='which-button'>" + (this.public_name.hasOwnProperty(feature) ? this.public_name[feature] : feature) + "</span>" +
        "<span class='title'>" + (this.manual_callback.hasOwnProperty(feature) ? this.feature_set[feature][0] : 'all') + "</span>" + // if a manual button, don't default to all in label.
        '<span class="caret"></span>' +
        '</button>' +
        '<ul class="dropdown-menu" role="menu">' +
        (!this.manual_callback.hasOwnProperty(feature) ? '<li><a href="#" data-feature="' + feature + '" data-key="all">All</a></li>' : "") +
        (!this.manual_callback.hasOwnProperty(feature) ? '<li class="divider"></li>' : "") +
        '</ul>' + '</div>');

      for (i = 0; i < features.length; i++) {
        if (features[i] !== 'all' && features[i] !== undefined) { // strange bug with undefined being added to manual buttons.
          $(this.target + ' div.' + this._strip_punctuation(feature) + '-btns ul.dropdown-menu').append(
            '<li><a href="#" data-feature="' + this._strip_punctuation(feature) + '" data-key="' + features[i] + '">' + features[i] + '</a></li>'
          );
        }
      }

      $('.' + this._strip_punctuation(feature) + '-btns .dropdown-menu li a').on('click', dropdownLiAClick);
    }

    return this;
  };

  return this;
};
