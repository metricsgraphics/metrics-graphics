var button_layout = function(target) {
    this.target = target;
    this.feature_set = {};
    this.public_name = {};
    this.sorters = {};

    this.data = function(data) {
        this._data = data;
        return this;
    }

    this.button = function(feature) {
        var sorter, the_label;
        if (arguments.length>1) {
            this.public_name[feature] = arguments[1];
        } 
        if (arguments.length>2) {
            this.sorters[feature] = arguments[2];
        }

        this.feature_set[feature] = [];

        return this;
    }

    this.callback = function(callback) {
        this._callback = callback;
        return this;
    }

    this.display = function() {
        var callback = this._callback;
        var d,f, features, feat;
        features = Object.keys(this.feature_set);
        
        // build out this.feature_set with this.data
        for (var i=0; i<this._data.length; i++) {
            d = this._data[i];
            f = features.map(function(f) { return d[f] });
            
            for (var j=0; j<features.length; j++) {
                feat = features[j]; 
                if(this.feature_set[feat].indexOf(f[j]) == -1)
                    this.feature_set[feat].push(f[j]);
            }
        }
        
        for (var feat in this.feature_set) {
            if (this.sorters.hasOwnProperty(feat)) {
                this.feature_set[feat].sort(this.sorters[feat]);
            }
        }
        
        $(this.target).empty();
        
        $(this.target).append("<div class='col-lg-12 segments text-center'></>");
        for (var feature in this.feature_set) {
            features = this.feature_set[feature];
            $(this.target + ' div.segments').append(
                "<div class='btn-group " + strip_punctuation(feature) + "-btns text-left'>"
                + "<button type='button' class='btn btn-default btn-lg dropdown-toggle' data-toggle='dropdown'>"
                + "<span class='which-button'>" 
                + (this.public_name.hasOwnProperty(feature) ? this.public_name[feature] : feature) 
                + "</span>"
                + "<span class='title'>all</span>"
                + "<span class='caret'></span>"
                + "</button>"
                + "<ul class='dropdown-menu' role='menu'>"
                + "<li><a href='#' data-feature='" + feature + "' data-key='all'>All</a></li>"
                + "<li class='divider'></li>"
                + "</ul>"
                + "</div>"
            );
            
            for (var i=0; i<features.length; i++) {
                if (features[i] != 'all') {
                    $(this.target + ' div.' + strip_punctuation(feature) + '-btns ul.dropdown-menu').append(
                        "<li><a href='#' data-feature='" + strip_punctuation(feature) 
                        + "' data-key='" + features[i] + "'>"
                        + features[i] + "</a></li>"
                    ); 
                }
            }
            
            $('.'+ strip_punctuation(feature) + '-btns .dropdown-menu li a')
                    .on('click', function() {
                var k = $(this).data('key'); 
                var feature = $(this).data('feature');

                $('.' + strip_punctuation(feature) + '-btns button.btn span.title')
                    .html(k);

                callback(feature, k);

                return false;
            })
        }

        return this;
    }

    return this
}
